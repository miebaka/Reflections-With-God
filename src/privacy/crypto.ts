import { fromByteArray, toByteArray } from 'base64-js';
import nacl from 'tweetnacl';

export type PrivateRecordKind = 'reflection' | 'prayer-edit' | 'mood-history' | 'recap';
export type RetentionPolicy = '24-hours' | '30-days' | '1-year' | 'until-deleted';

export type PrivateRecord = {
  id: string;
  kind: PrivateRecordKind;
  createdAt: string;
  retention: RetentionPolicy;
  content: string;
};

export type EncryptedPrivateRecord = {
  schemaVersion: 1;
  algorithm: 'XSalsa20-Poly1305';
  keyVersion: number;
  recordId: string;
  nonceBase64: string;
  ciphertextBase64: string;
};

export type WrappedHistoryKey = {
  schemaVersion: 1;
  algorithm: 'XSalsa20-Poly1305';
  nonceBase64: string;
  ciphertextBase64: string;
};

export type RandomBytes = (length: number) => Uint8Array;

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });
const recoveryPrefix = 'RWG1-';
const recoveryContext = encoder.encode('reflections-with-god/recovery-wrap/v1');

export function generateHistoryKey(randomBytes: RandomBytes): Uint8Array {
  return exactRandomBytes(randomBytes, nacl.secretbox.keyLength);
}

export function generateRecoverySecret(randomBytes: RandomBytes): string {
  return `${recoveryPrefix}${toBase64Url(exactRandomBytes(randomBytes, 32))}`;
}

export function generatePrivateRecordId(randomBytes: RandomBytes): string {
  return `rwg_${toBase64Url(exactRandomBytes(randomBytes, 16))}`;
}

export function encryptPrivateRecord(
  record: PrivateRecord,
  historyKey: Uint8Array,
  keyVersion: number,
  randomBytes: RandomBytes,
): EncryptedPrivateRecord {
  assertPrivateRecord(record);
  assertHistoryKey(historyKey);
  if (!Number.isSafeInteger(keyVersion) || keyVersion < 1) throw new Error('A positive key version is required.');
  const nonce = exactRandomBytes(randomBytes, nacl.secretbox.nonceLength);
  const plaintext = encoder.encode(JSON.stringify(record));
  const ciphertext = nacl.secretbox(plaintext, nonce, historyKey);
  return {
    schemaVersion: 1,
    algorithm: 'XSalsa20-Poly1305',
    keyVersion,
    recordId: record.id,
    nonceBase64: fromByteArray(nonce),
    ciphertextBase64: fromByteArray(ciphertext),
  };
}

export function decryptPrivateRecord(
  envelope: EncryptedPrivateRecord,
  historyKey: Uint8Array,
): PrivateRecord {
  assertEncryptedPrivateRecord(envelope);
  assertHistoryKey(historyKey);
  const nonce = decodeCanonicalBase64(envelope.nonceBase64, nacl.secretbox.nonceLength);
  const ciphertext = decodeCanonicalBase64(envelope.ciphertextBase64);
  const plaintext = nacl.secretbox.open(ciphertext, nonce, historyKey);
  if (!plaintext) throw new Error('Private record authentication failed.');
  let record: unknown;
  try {
    record = JSON.parse(decoder.decode(plaintext));
  } catch {
    throw new Error('Private record plaintext is invalid.');
  }
  assertPrivateRecord(record);
  if (record.id !== envelope.recordId) {
    throw new Error('Private record metadata authentication failed.');
  }
  return record;
}

export function wrapHistoryKeyForRecovery(
  historyKey: Uint8Array,
  recoverySecret: string,
  randomBytes: RandomBytes,
): WrappedHistoryKey {
  assertHistoryKey(historyKey);
  const wrappingKey = deriveRecoveryWrappingKey(recoverySecret);
  const nonce = exactRandomBytes(randomBytes, nacl.secretbox.nonceLength);
  return {
    schemaVersion: 1,
    algorithm: 'XSalsa20-Poly1305',
    nonceBase64: fromByteArray(nonce),
    ciphertextBase64: fromByteArray(nacl.secretbox(historyKey, nonce, wrappingKey)),
  };
}

export function unwrapHistoryKeyFromRecovery(
  wrapped: WrappedHistoryKey,
  recoverySecret: string,
): Uint8Array {
  assertWrappedHistoryKey(wrapped);
  const nonce = decodeCanonicalBase64(wrapped.nonceBase64, nacl.secretbox.nonceLength);
  const plaintext = nacl.secretbox.open(
    decodeCanonicalBase64(wrapped.ciphertextBase64),
    nonce,
    deriveRecoveryWrappingKey(recoverySecret),
  );
  if (!plaintext || plaintext.length !== nacl.secretbox.keyLength) {
    throw new Error('Recovery secret is incorrect or the wrapped key was changed.');
  }
  return plaintext;
}

export function assertEncryptedPrivateRecord(value: unknown): asserts value is EncryptedPrivateRecord {
  if (!isRecord(value) || !hasOnlyKeys(value, [
    'schemaVersion', 'algorithm', 'keyVersion', 'recordId', 'nonceBase64', 'ciphertextBase64',
  ]) || value.schemaVersion !== 1 || value.algorithm !== 'XSalsa20-Poly1305'
    || !Number.isSafeInteger(value.keyVersion) || (value.keyVersion as number) < 1
    || typeof value.recordId !== 'string' || !isOpaqueRecordId(value.recordId)
    || typeof value.nonceBase64 !== 'string' || typeof value.ciphertextBase64 !== 'string') {
    throw new Error('Encrypted private record is invalid.');
  }
  decodeCanonicalBase64(value.nonceBase64, nacl.secretbox.nonceLength);
  decodeCanonicalBase64(value.ciphertextBase64);
}

export function assertPrivateRecord(value: unknown): asserts value is PrivateRecord {
  if (!isRecord(value) || !hasOnlyKeys(value, ['id', 'kind', 'createdAt', 'retention', 'content'])
    || typeof value.id !== 'string' || !isOpaqueRecordId(value.id) || !isPrivateRecordKind(value.kind)
    || !isCanonicalTimestamp(value.createdAt) || !isRetentionPolicy(value.retention)
    || typeof value.content !== 'string' || !value.content.trim()) throw new Error('Private record is invalid.');
}

function assertWrappedHistoryKey(value: unknown): asserts value is WrappedHistoryKey {
  if (!isRecord(value) || !hasOnlyKeys(value, ['schemaVersion', 'algorithm', 'nonceBase64', 'ciphertextBase64'])
    || value.schemaVersion !== 1 || value.algorithm !== 'XSalsa20-Poly1305'
    || typeof value.nonceBase64 !== 'string' || typeof value.ciphertextBase64 !== 'string') {
    throw new Error('Wrapped history key is invalid.');
  }
  decodeCanonicalBase64(value.nonceBase64, nacl.secretbox.nonceLength);
  decodeCanonicalBase64(value.ciphertextBase64);
}

function deriveRecoveryWrappingKey(secret: string): Uint8Array {
  if (!secret.startsWith(recoveryPrefix)) throw new Error('Recovery secret format is invalid.');
  const raw = fromBase64Url(secret.slice(recoveryPrefix.length));
  if (raw.length !== 32) throw new Error('Recovery secret format is invalid.');
  const input = new Uint8Array(recoveryContext.length + raw.length);
  input.set(recoveryContext);
  input.set(raw, recoveryContext.length);
  return nacl.hash(input).slice(0, nacl.secretbox.keyLength);
}

function assertHistoryKey(key: Uint8Array): void {
  if (!(key instanceof Uint8Array) || key.length !== nacl.secretbox.keyLength) {
    throw new Error('A 256-bit history key is required.');
  }
}

function exactRandomBytes(source: RandomBytes, length: number): Uint8Array {
  const value = source(length);
  if (!(value instanceof Uint8Array) || value.length !== length) throw new Error('Secure random source failed.');
  return value;
}

function decodeCanonicalBase64(value: string, length?: number): Uint8Array {
  let decoded: Uint8Array;
  try { decoded = toByteArray(value); } catch { throw new Error('Ciphertext encoding is invalid.'); }
  if (fromByteArray(decoded) !== value || (length !== undefined && decoded.length !== length)) {
    throw new Error('Ciphertext encoding is invalid.');
  }
  return decoded;
}

function toBase64Url(value: Uint8Array): string {
  return fromByteArray(value).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function fromBase64Url(value: string): Uint8Array {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Recovery secret format is invalid.');
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  const decoded = toByteArray(padded);
  if (toBase64Url(decoded) !== value) throw new Error('Recovery secret format is invalid.');
  return decoded;
}

function isPrivateRecordKind(value: unknown): value is PrivateRecordKind {
  return ['reflection', 'prayer-edit', 'mood-history', 'recap'].includes(value as string);
}

function isRetentionPolicy(value: unknown): value is RetentionPolicy {
  return ['24-hours', '30-days', '1-year', 'until-deleted'].includes(value as string);
}

function isCanonicalTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

function isOpaqueRecordId(value: string): boolean {
  return /^rwg_[A-Za-z0-9_-]{22}$/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}
