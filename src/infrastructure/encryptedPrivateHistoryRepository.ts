import AsyncStorage from '@react-native-async-storage/async-storage';
import { fromByteArray, toByteArray } from 'base64-js';

import type { PrivateHistoryRepository } from '../app/privateHistoryRepository';
import { assertDailyRecap, type DailyRecap } from '../domain/recap';
import {
  assertEncryptedPrivateRecord,
  decryptPrivateRecord,
  encryptPrivateRecord,
  generateHistoryKey,
  type EncryptedPrivateRecord,
  type RandomBytes,
  type RetentionPolicy,
} from '../privacy/crypto';
import { expireRetainedRecords } from '../privacy/sync';
import type { SecureKeyVault } from './expoSecureKeyVault';

export const privateHistoryStorageKey = '@reflections-with-god/private-history/v1';
const historyKeyName = 'history-key.v1';

type StoragePort = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

type HistoryRegistry = {
  schemaVersion: 1;
  revision: number;
  records: readonly EncryptedPrivateRecord[];
};

export function createEncryptedPrivateHistoryRepository(
  vault: SecureKeyVault,
  randomBytes: RandomBytes,
  storage: StoragePort = AsyncStorage,
): PrivateHistoryRepository {
  let pending: Promise<unknown> = Promise.resolve();

  async function historyKey(): Promise<Uint8Array> {
    const saved = await vault.load(historyKeyName);
    if (saved) {
      const decoded = canonicalBase64(saved);
      if (decoded.length !== 32) throw new Error('Private history key is invalid.');
      return decoded;
    }
    const generated = generateHistoryKey(randomBytes);
    await vault.save(historyKeyName, fromByteArray(generated));
    return generated;
  }

  async function readRegistry(): Promise<HistoryRegistry> {
    const raw = await storage.getItem(privateHistoryStorageKey);
    if (raw === null) return { schemaVersion: 1, revision: 0, records: [] };
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { throw new Error('Private history is corrupt.'); }
    if (!isRecord(parsed) || !onlyKeys(parsed, ['schemaVersion', 'revision', 'records'])
      || parsed.schemaVersion !== 1 || !Number.isSafeInteger(parsed.revision)
      || (parsed.revision as number) < 0 || !Array.isArray(parsed.records)) {
      throw new Error('Private history is corrupt.');
    }
    try { parsed.records.forEach(assertEncryptedPrivateRecord); } catch { throw new Error('Private history is corrupt.'); }
    const ids = parsed.records.map(({ recordId }) => recordId);
    if (new Set(ids).size !== ids.length) throw new Error('Private history is corrupt.');
    return parsed as HistoryRegistry;
  }

  function enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const run = pending.then(operation, operation);
    pending = run.catch(() => undefined);
    return run;
  }

  return {
    list(now) {
      return enqueue(async () => {
        const key = await historyKey();
        const current = await readRegistry();
        const expired = expireRetainedRecords(current.records, key, now);
        if (expired.tombstones.length > 0) {
          await storage.setItem(privateHistoryStorageKey, JSON.stringify({
            schemaVersion: 1, revision: current.revision + 1, records: expired.retained,
          }));
        }
        return expired.retained.map((record) => {
          const privateRecord = decryptPrivateRecord(record, key);
          if (privateRecord.kind !== 'recap') throw new Error('Private history contains an unsupported record.');
          let recap: unknown;
          try { recap = JSON.parse(privateRecord.content); } catch { throw new Error('Stored recap is invalid.'); }
          assertDailyRecap(recap);
          if (recap.id !== privateRecord.id || recap.createdAt !== privateRecord.createdAt) {
            throw new Error('Stored recap metadata is invalid.');
          }
          return recap;
        }).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
      });
    },
    save(recap, retention: RetentionPolicy) {
      return enqueue(async () => {
        assertDailyRecap(recap);
        const key = await historyKey();
        const current = await readRegistry();
        if (current.records.some(({ recordId }) => recordId === recap.id)) return;
        const encrypted = encryptPrivateRecord({
          id: recap.id, kind: 'recap', createdAt: recap.createdAt, retention,
          content: JSON.stringify(recap),
        }, key, 1, randomBytes);
        await storage.setItem(privateHistoryStorageKey, JSON.stringify({
          schemaVersion: 1, revision: current.revision + 1, records: [...current.records, encrypted],
        }));
      });
    },
    delete(recapId) {
      return enqueue(async () => {
        if (!/^rwg_[A-Za-z0-9_-]{22}$/.test(recapId)) throw new Error('Recap identifier is invalid.');
        const current = await readRegistry();
        const records = current.records.filter(({ recordId }) => recordId !== recapId);
        if (records.length === current.records.length) return;
        await storage.setItem(privateHistoryStorageKey, JSON.stringify({
          schemaVersion: 1, revision: current.revision + 1, records,
        }));
      });
    },
  };
}

function canonicalBase64(value: string): Uint8Array {
  let decoded: Uint8Array;
  try { decoded = toByteArray(value); } catch { throw new Error('Private history key is invalid.'); }
  if (fromByteArray(decoded) !== value) throw new Error('Private history key is invalid.');
  return decoded;
}

function onlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
