import { describe, expect, it } from 'vitest';

import { acknowledgeOfflineActions, enqueueOfflineAction } from '../app/offlineOutbox';
import { createAsyncStorageOfflineOutbox } from './asyncStorageOfflineOutbox';

function memoryStorage(initial: string | null = null) {
  let value = initial;
  let failWrites = false;
  return {
    port: {
      async getItem() { return value; },
      async setItem(_key: string, next: string) {
        if (failWrites) throw new Error('disk full');
        value = next;
      },
    },
    value: () => value,
    failWrites: () => { failWrites = true; },
  };
}

function feedback(id: string, createdAt: string) {
  return {
    id, createdAt,
    action: { kind: 'fit-feedback' as const, unitId: 'unit-1', fit: 'fits' as const },
  };
}

describe('AsyncStorage offline outbox', () => {
  it('queues structured actions deterministically and deduplicates retry IDs', async () => {
    const storage = memoryStorage();
    const repository = createAsyncStorageOfflineOutbox(storage.port);
    const later = feedback('later', '2026-10-27T10:00:00.000Z');
    const earlier = feedback('earlier', '2026-10-27T09:00:00.000Z');
    await expect(enqueueOfflineAction(repository, later)).resolves.toBe('queued');
    await expect(enqueueOfflineAction(repository, earlier)).resolves.toBe('queued');
    await expect(enqueueOfflineAction(repository, earlier)).resolves.toBe('duplicate');
    expect((await repository.read()).items.map(({ id }) => id)).toEqual(['earlier', 'later']);
  });

  it('allows only one concurrent compare-and-swap enqueue to win', async () => {
    const repository = createAsyncStorageOfflineOutbox(memoryStorage().port);
    const results = await Promise.all([
      enqueueOfflineAction(repository, feedback('a', '2026-10-27T09:00:00.000Z')),
      enqueueOfflineAction(repository, feedback('b', '2026-10-27T09:00:01.000Z')),
    ]);
    expect(results.sort()).toEqual(['conflict', 'queued']);
    expect((await repository.read()).items).toHaveLength(1);
  });

  it('acknowledges only confirmed IDs in one revision', async () => {
    const repository = createAsyncStorageOfflineOutbox(memoryStorage().port);
    await enqueueOfflineAction(repository, feedback('a', '2026-10-27T09:00:00.000Z'));
    await enqueueOfflineAction(repository, feedback('b', '2026-10-27T09:00:01.000Z'));
    await expect(acknowledgeOfflineActions(repository, ['a'])).resolves.toBe('acknowledged');
    expect((await repository.read()).items.map(({ id }) => id)).toEqual(['b']);
  });

  it('rejects private or malformed action shapes and corrupt persisted values', async () => {
    const repository = createAsyncStorageOfflineOutbox(memoryStorage().port);
    await expect(enqueueOfflineAction(repository, {
      id: 'private', createdAt: '2026-10-27T09:00:00.000Z',
      action: { kind: 'fit-feedback', unitId: 'unit-1', fit: 'fits', reflection: 'private' } as never,
    })).rejects.toThrow();

    const corrupt = createAsyncStorageOfflineOutbox(memoryStorage('{broken').port);
    await expect(corrupt.read()).rejects.toThrow('Offline outbox is corrupt.');
  });

  it('does not expose a new revision after a failed single-value write', async () => {
    const storage = memoryStorage();
    const repository = createAsyncStorageOfflineOutbox(storage.port);
    storage.failWrites();
    await expect(enqueueOfflineAction(repository, feedback('a', '2026-10-27T09:00:00.000Z')))
      .rejects.toThrow('disk full');
    expect(storage.value()).toBeNull();
  });
});
