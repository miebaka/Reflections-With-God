import { describe, expect, it } from 'vitest';
import { encryptPrivateRecord, generateHistoryKey, type PrivateRecord } from './crypto';
import {
  assertCiphertextSyncBatch,
  expireRetainedRecords,
  rotateEncryptedRecords,
  userDeletionTombstone,
} from './sync';

function random(seed = 1) {
  let value = seed;
  return (length: number) => Uint8Array.from({ length }, () => (value++ % 251) + 1);
}

const base: PrivateRecord = {
  id: 'rwg_AQIDBAUGBwgJCgsMDQ4PEA', kind: 'recap', createdAt: '2026-09-01T08:00:00.000Z',
  retention: '30-days', content: 'A private recap.',
};

describe('ciphertext-only sync boundary', () => {
  it('accepts only the allow-listed opaque batch and rejects plaintext-shaped fields', () => {
    const record = encryptPrivateRecord(base, generateHistoryKey(random()), 1, random(40));
    const batch = {
      schemaVersion: 1 as const, accountId: 'account-opaque-1', deviceId: 'device-opaque-1',
      baseRevision: 0, records: [record], tombstones: [],
    };
    expect(() => assertCiphertextSyncBatch(batch)).not.toThrow();
    expect(() => assertCiphertextSyncBatch({ ...batch, reflection: 'plaintext' })).toThrow('invalid');
    expect(JSON.stringify(batch)).not.toContain(base.content);
  });

  it('turns expired ciphertext into tombstones without decrypting it', () => {
    const key = generateHistoryKey(random());
    const expired = encryptPrivateRecord(base, key, 1, random(40));
    const retained = encryptPrivateRecord({ ...base, id: 'rwg_ERITFBUWFxgZGhscHR4fIA', retention: 'until-deleted' }, key, 1, random(80));
    const result = expireRetainedRecords([expired, retained], key, new Date('2026-10-29T08:00:00.000Z'));
    expect(result.retained.map(({ recordId }) => recordId)).toEqual(['rwg_ERITFBUWFxgZGhscHR4fIA']);
    expect(result.tombstones).toEqual([{
      schemaVersion: 1, recordId: 'rwg_AQIDBAUGBwgJCgsMDQ4PEA', deletedAt: '2026-10-29T08:00:00.000Z',
      reason: 'retention-expired',
    }]);
  });

  it('re-encrypts retained records locally under a strictly newer key version', () => {
    const oldKey = generateHistoryKey(random());
    const nextKey = generateHistoryKey(random(80));
    const record = encryptPrivateRecord(base, oldKey, 1, random(40));
    const rotated = rotateEncryptedRecords([record], oldKey, nextKey, 2, random(120));
    expect(rotated[0]?.keyVersion).toBe(2);
    expect(rotated[0]?.ciphertextBase64).not.toBe(record.ciphertextBase64);
    expect(() => rotateEncryptedRecords([record], oldKey, nextKey, 1, random())).toThrow('must advance');
  });

  it('creates canonical user-deletion tombstones', () => {
    expect(userDeletionTombstone('rwg_AQIDBAUGBwgJCgsMDQ4PEA', new Date('2026-10-29T09:00:00.000Z'))).toEqual({
      schemaVersion: 1, recordId: 'rwg_AQIDBAUGBwgJCgsMDQ4PEA', deletedAt: '2026-10-29T09:00:00.000Z', reason: 'user-deleted',
    });
  });
});
