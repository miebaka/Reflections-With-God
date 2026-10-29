import { describe, expect, it } from 'vitest';
import type { SecureKeyVault } from './expoSecureKeyVault';
import { createEncryptedPrivateHistoryRepository, privateHistoryStorageKey } from './encryptedPrivateHistoryRepository';
import { createDailyRecap } from '../domain/recap';

function random(seed = 1) {
  let value = seed;
  return (length: number) => Uint8Array.from({ length }, () => (value++ % 251) + 1);
}

function fixture() {
  const values = new Map<string, string>();
  const secrets = new Map<string, string>();
  const vault: SecureKeyVault = {
    async load(name) { return secrets.get(name); },
    async save(name, value) { secrets.set(name, value); },
    async remove(name) { secrets.delete(name); },
  };
  const storage = {
    async getItem(key: string) { return values.get(key) ?? null; },
    async setItem(key: string, value: string) { values.set(key, value); },
  };
  return { repository: createEncryptedPrivateHistoryRepository(vault, random(), storage), values, secrets };
}

function recap(id = 'rwg_AQIDBAUGBwgJCgsMDQ4PEA', date = '2026-10-29') {
  return createDailyRecap({
    id, localDate: date, createdAt: new Date(`${date}T22:00:00.000Z`),
    initialCheckIn: { kind: 'unknown' }, finalCheckIn: { kind: 'unknown' },
    encounteredPassages: [{ contentId: 'unit-1', reference: 'Psalm 46:10' }],
  });
}

describe('encrypted private history repository', () => {
  it('stores only ciphertext in AsyncStorage and the history key in the secure vault', async () => {
    const store = fixture();
    await store.repository.save(recap(), '30-days');
    const raw = store.values.get(privateHistoryStorageKey)!;
    expect(raw).not.toContain('Psalm 46:10');
    expect(raw).not.toContain('without forcing an emotion label');
    expect(store.secrets.has('history-key.v1')).toBe(true);
    await expect(store.repository.list(new Date('2026-10-30T10:00:00.000Z'))).resolves.toEqual([recap()]);
  });

  it('deletes one encrypted recap without affecting the remaining day', async () => {
    const store = fixture();
    await store.repository.save(recap(), 'until-deleted');
    await store.repository.save(recap('rwg_ERITFBUWFxgZGhscHR4fIA', '2026-10-28'), 'until-deleted');
    await store.repository.delete('rwg_AQIDBAUGBwgJCgsMDQ4PEA');
    await expect(store.repository.list(new Date('2026-10-30T10:00:00.000Z')))
      .resolves.toMatchObject([{ id: 'rwg_ERITFBUWFxgZGhscHR4fIA' }]);
  });

  it('serializes concurrent saves so neither encrypted day is lost', async () => {
    const store = fixture();
    await Promise.all([
      store.repository.save(recap(), 'until-deleted'),
      store.repository.save(recap('rwg_ERITFBUWFxgZGhscHR4fIA', '2026-10-28'), 'until-deleted'),
    ]);
    await expect(store.repository.list(new Date('2026-10-30T10:00:00.000Z')))
      .resolves.toHaveLength(2);
  });

  it('expires retained recaps locally and fails closed on corrupt ciphertext', async () => {
    const store = fixture();
    await store.repository.save(recap('rwg_AQIDBAUGBwgJCgsMDQ4PEA', '2026-09-01'), '30-days');
    await expect(store.repository.list(new Date('2026-10-30T10:00:00.000Z'))).resolves.toEqual([]);
    store.values.set(privateHistoryStorageKey, '{"schemaVersion":1,"revision":2,"records":[{}]}');
    await expect(store.repository.list(new Date('2026-10-30T10:00:00.000Z'))).rejects.toThrow('corrupt');
  });
});
