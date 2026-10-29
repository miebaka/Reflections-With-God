import {
  assertEncryptedPrivateRecord,
  decryptPrivateRecord,
  encryptPrivateRecord,
  type EncryptedPrivateRecord,
  type RandomBytes,
} from './crypto';

export type CiphertextTombstone = {
  schemaVersion: 1;
  recordId: string;
  deletedAt: string;
  reason: 'retention-expired' | 'user-deleted' | 'account-deleted';
};

export type CiphertextSyncBatch = {
  schemaVersion: 1;
  accountId: string;
  deviceId: string;
  baseRevision: number;
  records: readonly EncryptedPrivateRecord[];
  tombstones: readonly CiphertextTombstone[];
};

export type CiphertextSyncResponse = {
  schemaVersion: 1;
  revision: number;
  records: readonly EncryptedPrivateRecord[];
  tombstones: readonly CiphertextTombstone[];
};

export interface CiphertextSyncTransport {
  synchronize(batch: CiphertextSyncBatch): Promise<CiphertextSyncResponse>;
  requestAccountDeletion(accountId: string, requestedAt: string): Promise<{ requestId: string }>;
  confirmAccountDeletion(requestId: string): Promise<{ deletedAt: string }>;
}

export function assertCiphertextSyncBatch(value: unknown): asserts value is CiphertextSyncBatch {
  if (!isRecord(value) || !onlyKeys(value, ['schemaVersion', 'accountId', 'deviceId', 'baseRevision', 'records', 'tombstones'])
    || value.schemaVersion !== 1 || !opaqueId(value.accountId) || !opaqueId(value.deviceId)
    || !Number.isSafeInteger(value.baseRevision) || (value.baseRevision as number) < 0
    || !Array.isArray(value.records) || !Array.isArray(value.tombstones)) {
    throw new Error('Ciphertext sync batch is invalid.');
  }
  value.records.forEach(assertEncryptedPrivateRecord);
  value.tombstones.forEach(assertTombstone);
  assertUniqueIds(value.records, value.tombstones);
}

export function assertCiphertextSyncResponse(value: unknown): asserts value is CiphertextSyncResponse {
  if (!isRecord(value) || !onlyKeys(value, ['schemaVersion', 'revision', 'records', 'tombstones'])
    || value.schemaVersion !== 1 || !Number.isSafeInteger(value.revision) || (value.revision as number) < 0
    || !Array.isArray(value.records) || !Array.isArray(value.tombstones)) {
    throw new Error('Ciphertext sync response is invalid.');
  }
  value.records.forEach(assertEncryptedPrivateRecord);
  value.tombstones.forEach(assertTombstone);
  assertUniqueIds(value.records, value.tombstones);
}

export function retentionDeadline(record: ReturnType<typeof decryptPrivateRecord>): Date | undefined {
  const created = new Date(record.createdAt);
  const milliseconds = record.retention === '24-hours' ? 86_400_000
    : record.retention === '30-days' ? 30 * 86_400_000
      : record.retention === '1-year' ? 365 * 86_400_000 : undefined;
  return milliseconds === undefined ? undefined : new Date(created.getTime() + milliseconds);
}

export function expireRetainedRecords(
  records: readonly EncryptedPrivateRecord[],
  historyKey: Uint8Array,
  now: Date,
): { retained: readonly EncryptedPrivateRecord[]; tombstones: readonly CiphertextTombstone[] } {
  if (Number.isNaN(now.getTime())) throw new Error('A valid retention time is required.');
  const retained: EncryptedPrivateRecord[] = [];
  const tombstones: CiphertextTombstone[] = [];
  for (const record of records) {
    const privateRecord = decryptPrivateRecord(record, historyKey);
    const deadline = retentionDeadline(privateRecord);
    if (deadline && deadline <= now) {
      tombstones.push({
        schemaVersion: 1, recordId: record.recordId, deletedAt: now.toISOString(), reason: 'retention-expired',
      });
    } else retained.push(record);
  }
  return { retained, tombstones };
}

export function rotateEncryptedRecords(
  records: readonly EncryptedPrivateRecord[],
  priorKey: Uint8Array,
  nextKey: Uint8Array,
  nextKeyVersion: number,
  randomBytes: RandomBytes,
): readonly EncryptedPrivateRecord[] {
  if (records.some(({ keyVersion }) => keyVersion >= nextKeyVersion)) {
    throw new Error('Rotation key version must advance every retained record.');
  }
  return records.map((record) => encryptPrivateRecord(
    decryptPrivateRecord(record, priorKey), nextKey, nextKeyVersion, randomBytes,
  ));
}

export function userDeletionTombstone(recordId: string, now: Date): CiphertextTombstone {
  if (!opaqueId(recordId) || Number.isNaN(now.getTime())) throw new Error('Deletion request is invalid.');
  return { schemaVersion: 1, recordId, deletedAt: now.toISOString(), reason: 'user-deleted' };
}

function assertTombstone(value: unknown): asserts value is CiphertextTombstone {
  if (!isRecord(value) || !onlyKeys(value, ['schemaVersion', 'recordId', 'deletedAt', 'reason'])
    || value.schemaVersion !== 1 || !opaqueId(value.recordId) || !canonicalTimestamp(value.deletedAt)
    || !['retention-expired', 'user-deleted', 'account-deleted'].includes(value.reason as string)) {
    throw new Error('Ciphertext tombstone is invalid.');
  }
}

function assertUniqueIds(
  records: readonly EncryptedPrivateRecord[],
  tombstones: readonly CiphertextTombstone[],
): void {
  const ids = [...records.map(({ recordId }) => recordId), ...tombstones.map(({ recordId }) => recordId)];
  if (new Set(ids).size !== ids.length) throw new Error('A sync batch cannot contain conflicting record IDs.');
}

function opaqueId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9][A-Za-z0-9._:-]{2,127}$/.test(value);
}

function canonicalTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

function onlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
