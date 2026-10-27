import AsyncStorage from '@react-native-async-storage/async-storage';

import type { SessionRepository } from '../app/sessionRepository';
import { createSessionSnapshot, restoreSessionSnapshot } from '../app/sessionSnapshot';

export const sessionStorageKey = '@reflections-with-god/current-session/v1';

export type KeyValueStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export function createAsyncStorageSessionRepository(
  storage: KeyValueStorage = AsyncStorage,
): SessionRepository {
  return {
    async load(now) {
      const raw = await storage.getItem(sessionStorageKey);
      if (raw === null) return undefined;
      const restored = restoreSessionSnapshot(raw, now);
      if (!restored) await storage.removeItem(sessionStorageKey);
      return restored;
    },
    async save(session, now) {
      await storage.setItem(sessionStorageKey, createSessionSnapshot(session, now));
    },
    async clear() {
      await storage.removeItem(sessionStorageKey);
    },
  };
}
