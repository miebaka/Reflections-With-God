import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-secure-store', () => ({
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 6,
  getItemAsync: vi.fn(),
  setItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

import { createExpoSecureKeyVault } from './expoSecureKeyVault';

describe('Expo secure key vault', () => {
  it('stores secrets under an isolated namespace and never exposes a storage fallback', async () => {
    const values = new Map<string, string>();
    const vault = createExpoSecureKeyVault({
      async getItemAsync(key) { return values.get(key) ?? null; },
      async setItemAsync(key, value) { values.set(key, value); },
      async deleteItemAsync(key) { values.delete(key); },
    });
    await vault.save('history-key.v1', 'secret');
    expect([...values.keys()]).toEqual(['reflections-with-god.keys.history-key.v1']);
    await expect(vault.load('history-key.v1')).resolves.toBe('secret');
    await vault.remove('history-key.v1');
    await expect(vault.load('history-key.v1')).resolves.toBeUndefined();
  });

  it('rejects unsafe names and empty secrets', async () => {
    const vault = createExpoSecureKeyVault({
      async getItemAsync() { return null; }, async setItemAsync() {}, async deleteItemAsync() {},
    });
    await expect(vault.save('../history', 'secret')).rejects.toThrow('name is invalid');
    await expect(vault.save('history', '')).rejects.toThrow('empty secret');
  });
});
