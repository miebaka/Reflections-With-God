import AsyncStorage from '@react-native-async-storage/async-storage';

import type { NotificationSettings } from '../domain/notifications';

export const notificationSettingsStorageKey = '@reflections-with-god/notification-settings/v1';

type StoragePort = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

export type NotificationSettingsRepository = {
  load(): Promise<NotificationSettings | undefined>;
  save(settings: NotificationSettings): Promise<void>;
};

export function createAsyncStorageNotificationSettings(
  storage: StoragePort = AsyncStorage,
): NotificationSettingsRepository {
  return {
    async load() {
      const raw = await storage.getItem(notificationSettingsStorageKey);
      if (raw === null) return undefined;
      try {
        const value: unknown = JSON.parse(raw);
        if (!isNotificationSettings(value)) throw new Error('invalid');
        return value;
      } catch {
        throw new Error('Notification settings are corrupt.');
      }
    },
    async save(settings) {
      if (!isNotificationSettings(settings)) throw new Error('Notification settings are invalid.');
      await storage.setItem(notificationSettingsStorageKey, JSON.stringify(settings));
    },
  };
}

function isNotificationSettings(value: unknown): value is NotificationSettings {
  if (!isRecord(value) || !['gentle', 'rhythm', 'companion', 'silent'].includes(String(value.mode))
    || typeof value.timezone !== 'string' || typeof value.closingReminder !== 'boolean') return false;
  try {
    new Intl.DateTimeFormat('en', { timeZone: value.timezone }).format();
  } catch {
    return false;
  }
  if (value.gentleTime !== undefined) {
    if (!isRecord(value.gentleTime) || !Number.isInteger(value.gentleTime.hour)
      || (value.gentleTime.hour as number) < 0 || (value.gentleTime.hour as number) > 23
      || !Number.isInteger(value.gentleTime.minute) || (value.gentleTime.minute as number) < 0
      || (value.gentleTime.minute as number) > 59) return false;
  }
  return value.mode !== 'gentle' || value.gentleTime !== undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
