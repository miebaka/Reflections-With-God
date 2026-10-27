import { describe, expect, it } from 'vitest';

import type { NotificationIntent, NotificationPermissionState } from '../domain/notifications';
import {
  synchronizeDailyNotifications,
  type NotificationPlatform,
  type ScheduledNotification,
} from './notificationScheduler';

function platform(initialPermission: NotificationPermissionState) {
  let permission = initialPermission;
  let requestResult: NotificationPermissionState = 'granted';
  let scheduled: ScheduledNotification[] = [];
  const scheduledIntents: NotificationIntent[] = [];
  let requests = 0;
  const port: NotificationPlatform = {
    async getPermission() { return permission; },
    async requestPermission() { requests += 1; permission = requestResult; return permission; },
    async listOwned() { return scheduled; },
    async schedule(intent) {
      scheduledIntents.push(intent);
      scheduled.push({ platformId: `platform-${intent.id}`, intentId: intent.id });
    },
    async cancel(platformId) { scheduled = scheduled.filter((item) => item.platformId !== platformId); },
  };
  return {
    port,
    requests: () => requests,
    scheduled: () => scheduled,
    scheduledIntents,
    setRequestResult: (value: NotificationPermissionState) => { requestResult = value; },
  };
}

const baseInput = {
  localDate: '2026-10-27',
  settings: { mode: 'rhythm' as const, timezone: 'Africa/Lagos', closingReminder: false },
  now: new Date('2026-10-27T05:00:00.000Z'),
  hasOpenedMeaningfulUnit: false,
  explicitlyEnabledReminders: false,
};

describe('daily notification synchronization', () => {
  it('defers the system prompt before meaningful value', async () => {
    const device = platform('undetermined');
    await expect(synchronizeDailyNotifications(device.port, baseInput)).resolves.toMatchObject({
      status: 'permission-deferred', scheduled: 0,
    });
    expect(device.requests()).toBe(0);
  });

  it('requests after meaningful value and schedules the Rhythm plan', async () => {
    const device = platform('undetermined');
    await expect(synchronizeDailyNotifications(device.port, {
      ...baseInput, hasOpenedMeaningfulUnit: true,
    })).resolves.toMatchObject({ status: 'scheduled', scheduled: 3 });
    expect(device.requests()).toBe(1);
    expect(device.scheduledIntents.map(({ kind }) => kind)).toEqual(['morning', 'midday', 'evening']);
  });

  it('is idempotent when the desired plan is already installed', async () => {
    const device = platform('granted');
    await synchronizeDailyNotifications(device.port, baseInput);
    await expect(synchronizeDailyNotifications(device.port, baseInput)).resolves.toMatchObject({
      scheduled: 0, cancelled: 0,
    });
  });

  it('replaces obsolete reminders without touching notifications it does not own', async () => {
    const device = platform('granted');
    await synchronizeDailyNotifications(device.port, baseInput);
    await expect(synchronizeDailyNotifications(device.port, {
      ...baseInput,
      settings: { mode: 'gentle', timezone: 'Africa/Lagos', gentleTime: { hour: 11, minute: 0 }, closingReminder: false },
    })).resolves.toMatchObject({ scheduled: 1, cancelled: 3 });
    expect(device.scheduled()).toHaveLength(1);
  });

  it('clears owned reminders after denial or when Silent mode is selected', async () => {
    const deniedDevice = platform('granted');
    await synchronizeDailyNotifications(deniedDevice.port, baseInput);
    const silent = await synchronizeDailyNotifications(deniedDevice.port, {
      ...baseInput, settings: { mode: 'silent', timezone: 'Africa/Lagos', closingReminder: false },
    });
    expect(silent).toMatchObject({ status: 'silent', cancelled: 3 });
    expect(deniedDevice.scheduled()).toEqual([]);

    const permissionDevice = platform('undetermined');
    permissionDevice.setRequestResult('denied');
    await expect(synchronizeDailyNotifications(permissionDevice.port, {
      ...baseInput, explicitlyEnabledReminders: true,
    })).resolves.toMatchObject({ status: 'permission-denied', scheduled: 0 });
  });
});
