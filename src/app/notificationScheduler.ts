import {
  planDailyNotifications,
  shouldRequestNotificationPermission,
  type NotificationIntent,
  type NotificationPermissionState,
  type NotificationSettings,
} from '../domain/notifications';

export type ScheduledNotification = { platformId: string; intentId: string };

export interface NotificationPlatform {
  getPermission(): Promise<NotificationPermissionState>;
  requestPermission(): Promise<NotificationPermissionState>;
  listOwned(): Promise<readonly ScheduledNotification[]>;
  schedule(intent: NotificationIntent): Promise<void>;
  cancel(platformId: string): Promise<void>;
}

export type NotificationSyncInput = {
  localDate: string;
  settings: NotificationSettings;
  now: Date;
  hasOpenedMeaningfulUnit: boolean;
  explicitlyEnabledReminders: boolean;
};

export type NotificationSyncResult = {
  permission: NotificationPermissionState;
  status: 'scheduled' | 'silent' | 'permission-deferred' | 'permission-denied';
  scheduled: number;
  cancelled: number;
};

export async function synchronizeDailyNotifications(
  platform: NotificationPlatform,
  input: NotificationSyncInput,
): Promise<NotificationSyncResult> {
  let permission = await platform.getPermission();
  const existing = await platform.listOwned();

  if (input.settings.mode === 'silent') {
    await cancelAll(platform, existing);
    return { permission, status: 'silent', scheduled: 0, cancelled: existing.length };
  }

  if (shouldRequestNotificationPermission({
    permission,
    hasOpenedMeaningfulUnit: input.hasOpenedMeaningfulUnit,
    explicitlyEnabledReminders: input.explicitlyEnabledReminders,
  })) permission = await platform.requestPermission();

  if (permission !== 'granted') {
    if (permission === 'denied') await cancelAll(platform, existing);
    return {
      permission,
      status: permission === 'denied' ? 'permission-denied' : 'permission-deferred',
      scheduled: 0,
      cancelled: permission === 'denied' ? existing.length : 0,
    };
  }

  const desired = planDailyNotifications(input.localDate, input.settings, input.now);
  const desiredIds = new Set(desired.map(({ id }) => id));
  const existingIds = new Set(existing.map(({ intentId }) => intentId));
  const obsolete = existing.filter(({ intentId }) => !desiredIds.has(intentId));
  await cancelAll(platform, obsolete);
  const missing = desired.filter(({ id }) => !existingIds.has(id));
  for (const intent of missing) await platform.schedule(intent);
  return {
    permission,
    status: 'scheduled',
    scheduled: missing.length,
    cancelled: obsolete.length,
  };
}

async function cancelAll(
  platform: NotificationPlatform,
  scheduled: readonly ScheduledNotification[],
): Promise<void> {
  for (const item of scheduled) await platform.cancel(item.platformId);
}
