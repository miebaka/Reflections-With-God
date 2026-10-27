import { describe, expect, it } from 'vitest';

import { initialAppSession, reduceAppSession } from '../app/session';
import { createAsyncStorageSessionRepository, sessionStorageKey } from './asyncStorageSessionRepository';

function memoryStorage(initial?: Record<string, string>) {
  const values = new Map(Object.entries(initial ?? {}));
  return {
    values,
    port: {
      getItem: async (key: string) => values.get(key) ?? null,
      setItem: async (key: string, value: string) => { values.set(key, value); },
      removeItem: async (key: string) => { values.delete(key); },
    },
  };
}

describe('AsyncStorage session repository', () => {
  const now = new Date(2026, 9, 27, 9, 0);

  it('saves and restores the current structured session under one isolated key', async () => {
    const storage = memoryStorage({ unrelated: 'keep-me' });
    const repository = createAsyncStorageSessionRepository(storage.port);
    const session = reduceAppSession(initialAppSession(), { type: 'attest-adult' });

    await repository.save(session, now);

    expect(await repository.load(now)).toEqual(session);
    expect(storage.values.get('unrelated')).toBe('keep-me');
    expect(storage.values.has(sessionStorageKey)).toBe(true);
  });

  it('replaces the previous snapshot and clears only its own key', async () => {
    const storage = memoryStorage({ unrelated: 'keep-me' });
    const repository = createAsyncStorageSessionRepository(storage.port);
    await repository.save(initialAppSession(), now);
    await repository.save(reduceAppSession(initialAppSession(), { type: 'attest-adult' }), now);

    expect((await repository.load(now))?.screen).toBe('check-in');
    await repository.clear();
    expect(storage.values.has(sessionStorageKey)).toBe(false);
    expect(storage.values.get('unrelated')).toBe('keep-me');
  });

  it('removes an invalid snapshot after failing closed', async () => {
    const storage = memoryStorage({ [sessionStorageKey]: '{broken' });
    const repository = createAsyncStorageSessionRepository(storage.port);

    expect(await repository.load(now)).toBeUndefined();
    expect(storage.values.has(sessionStorageKey)).toBe(false);
  });

  it('does not hide storage failures', async () => {
    const failure = new Error('device storage unavailable');
    const repository = createAsyncStorageSessionRepository({
      getItem: async () => { throw failure; },
      setItem: async () => { throw failure; },
      removeItem: async () => { throw failure; },
    });

    await expect(repository.load(now)).rejects.toBe(failure);
    await expect(repository.save(initialAppSession(), now)).rejects.toBe(failure);
    await expect(repository.clear()).rejects.toBe(failure);
  });
});
