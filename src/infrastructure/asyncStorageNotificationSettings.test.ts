import { describe, expect, it } from 'vitest';

import { createAsyncStorageNotificationSettings } from './asyncStorageNotificationSettings';

function memoryStorage(initial: string | null = null) {
  let value = initial;
  return {
    port: {
      async getItem() { return value; },
      async setItem(_key: string, next: string) { value = next; },
    },
  };
}

describe('notification settings persistence', () => {
  it('round-trips an explicit mode and timezone', async () => {
    const repository = createAsyncStorageNotificationSettings(memoryStorage().port);
    const settings = {
      mode: 'gentle' as const, timezone: 'Africa/Lagos',
      gentleTime: { hour: 9, minute: 15 }, closingReminder: true,
    };
    await repository.save(settings);
    await expect(repository.load()).resolves.toEqual(settings);
  });

  it('fails closed on corrupt modes, timezones, or incomplete Gentle settings', async () => {
    for (const value of [
      '{broken',
      JSON.stringify({ mode: 'loud', timezone: 'Africa/Lagos', closingReminder: false }),
      JSON.stringify({ mode: 'rhythm', timezone: 'Not/A_Zone', closingReminder: false }),
      JSON.stringify({ mode: 'gentle', timezone: 'Africa/Lagos', closingReminder: false }),
    ]) {
      await expect(createAsyncStorageNotificationSettings(memoryStorage(value).port).load())
        .rejects.toThrow('Notification settings are corrupt.');
    }
  });
});
