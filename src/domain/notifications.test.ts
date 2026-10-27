import { describe, expect, it } from 'vitest';

import {
  defaultNotificationSettings,
  instantForLocalTime,
  planDailyNotifications,
  shouldRequestNotificationPermission,
} from './notifications';

describe('notification policy', () => {
  it('defaults to three discreet Rhythm invitations without a closing reminder', () => {
    const settings = defaultNotificationSettings('Africa/Lagos');
    const intents = planDailyNotifications('2026-10-27', settings, new Date('2026-10-27T05:00:00.000Z'));

    expect(intents.map(({ kind }) => kind)).toEqual(['morning', 'midday', 'evening']);
    expect(intents.every(({ title, body, badge, interruptionLevel }) => (
      title === 'Reflections with God'
      && !/scripture|mood|sad|happy|anxious|angry|prayer|journal/i.test(body)
      && badge === null
      && interruptionLevel === 'passive'
    ))).toBe(true);
  });

  it('sends one selected Gentle reminder and no notifications in Silent mode', () => {
    expect(planDailyNotifications('2026-10-27', {
      mode: 'gentle', timezone: 'Africa/Lagos', gentleTime: { hour: 11, minute: 15 }, closingReminder: false,
    }, new Date('2026-10-27T05:00:00.000Z'))).toHaveLength(1);
    expect(planDailyNotifications('2026-10-27', {
      mode: 'silent', timezone: 'Africa/Lagos', closingReminder: true,
    }, new Date('2026-10-27T05:00:00.000Z'))).toEqual([]);
  });

  it('adds opt-in two-hour Companion check-ins without duplicating the 2 p.m. Rhythm push', () => {
    const intents = planDailyNotifications('2026-10-27', {
      mode: 'companion', timezone: 'Africa/Lagos', closingReminder: true,
    }, new Date('2026-10-27T05:00:00.000Z'));
    expect(intents.map(({ kind }) => kind)).toEqual([
      'morning', 'check-in', 'check-in', 'midday', 'check-in', 'check-in', 'evening', 'closing',
    ]);
  });

  it('drops elapsed reminders instead of producing a restart burst', () => {
    const intents = planDailyNotifications('2026-10-27', defaultNotificationSettings('Africa/Lagos'),
      new Date('2026-10-27T16:30:00.000Z'));
    expect(intents.map(({ kind }) => kind)).toEqual(['evening']);
  });

  it('maps local wall time through daylight changes and rejects nonexistent minutes', () => {
    expect(instantForLocalTime('2026-11-01', { hour: 8, minute: 0 }, 'America/New_York')?.toISOString())
      .toBe('2026-11-01T13:00:00.000Z');
    expect(instantForLocalTime('2026-03-08', { hour: 2, minute: 30 }, 'America/New_York')).toBeUndefined();
  });

  it('defers permission until meaningful value or an explicit settings action', () => {
    expect(shouldRequestNotificationPermission({
      permission: 'undetermined', hasOpenedMeaningfulUnit: false, explicitlyEnabledReminders: false,
    })).toBe(false);
    expect(shouldRequestNotificationPermission({
      permission: 'undetermined', hasOpenedMeaningfulUnit: true, explicitlyEnabledReminders: false,
    })).toBe(true);
    expect(shouldRequestNotificationPermission({
      permission: 'denied', hasOpenedMeaningfulUnit: true, explicitlyEnabledReminders: true,
    })).toBe(false);
  });

  it('rejects invalid timezone and Gentle settings rather than silently guessing', () => {
    expect(() => defaultNotificationSettings('Not/A_Timezone')).toThrow('IANA timezone');
    expect(() => planDailyNotifications('2026-10-27', {
      mode: 'gentle', timezone: 'Africa/Lagos', closingReminder: false,
    }, new Date())).toThrow('Gentle mode');
  });
});
