import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  assertOutboxItem,
  emptyOfflineOutbox,
  type OfflineOutbox,
  type OfflineOutboxRepository,
} from '../app/offlineOutbox';

export const offlineOutboxStorageKey = '@reflections-with-god/offline-outbox/v1';

type StoragePort = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

export function createAsyncStorageOfflineOutbox(
  storage: StoragePort = AsyncStorage,
): OfflineOutboxRepository {
  let pending: Promise<void> = Promise.resolve();

  async function read(): Promise<OfflineOutbox> {
    const raw = await storage.getItem(offlineOutboxStorageKey);
    if (raw === null) return emptyOfflineOutbox();
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isOfflineOutbox(parsed)) throw new Error('invalid');
      return parsed;
    } catch {
      throw new Error('Offline outbox is corrupt.');
    }
  }

  return {
    read,
    commit(expectedRevision, next) {
      const operation = pending.then(async () => {
        const current = await read();
        if (current.revision !== expectedRevision) return false;
        if (next.revision !== expectedRevision + 1 || !isOfflineOutbox(next)) {
          throw new Error('Offline outbox commit is invalid.');
        }
        await storage.setItem(offlineOutboxStorageKey, JSON.stringify(next));
        return true;
      });
      pending = operation.then(() => undefined, () => undefined);
      return operation;
    },
  };
}

function isOfflineOutbox(value: unknown): value is OfflineOutbox {
  if (!isRecord(value) || value.schemaVersion !== 1 || !Number.isSafeInteger(value.revision)
    || (value.revision as number) < 0 || !Array.isArray(value.items)) return false;
  const ids = new Set<string>();
  let priorOrder = '';
  for (const item of value.items) {
    if (!isRecord(item) || typeof item.id !== 'string' || typeof item.createdAt !== 'string'
      || !isRecord(item.action)) return false;
    try {
      assertOutboxItem(item as never);
    } catch {
      return false;
    }
    if (ids.has(item.id)) return false;
    ids.add(item.id);
    const order = `${item.createdAt}\u0000${item.id}`;
    if (order < priorOrder) return false;
    priorOrder = order;
  }
  return true;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
