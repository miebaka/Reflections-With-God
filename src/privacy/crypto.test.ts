import { describe, expect, it } from 'vitest';
import {
  decryptPrivateRecord,
  encryptPrivateRecord,
  generateHistoryKey,
  generatePrivateRecordId,
  generateRecoverySecret,
  unwrapHistoryKeyFromRecovery,
  wrapHistoryKeyForRecovery,
  type PrivateRecord,
  type RandomBytes,
} from './crypto';

function deterministic(seed = 1): RandomBytes {
  let offset = seed;
  return (length) => Uint8Array.from({ length }, () => (offset++ % 251) + 1);
}

const record: PrivateRecord = {
  id: 'rwg_AQIDBAUGBwgJCgsMDQ4PEA', kind: 'reflection', createdAt: '2026-10-29T08:00:00.000Z',
  retention: '30-days', content: 'I am learning to be still.',
};

describe('private record encryption', () => {
  it('round-trips authenticated content without exposing it in the envelope', () => {
    const key = generateHistoryKey(deterministic());
    const envelope = encryptPrivateRecord(record, key, 1, deterministic(20));
    expect(JSON.stringify(envelope)).not.toContain(record.content);
    expect(decryptPrivateRecord(envelope, key)).toEqual(record);
  });

  it('rejects changed ciphertext and substituted outer metadata', () => {
    const key = generateHistoryKey(deterministic());
    const envelope = encryptPrivateRecord(record, key, 1, deterministic(20));
    const changedCiphertext = { ...envelope, ciphertextBase64: `${envelope.ciphertextBase64.slice(0, -4)}AAAA` };
    expect(() => decryptPrivateRecord(changedCiphertext, key)).toThrow(/authentication failed|encoding is invalid/);
    expect(() => decryptPrivateRecord({ ...envelope, recordId: 'rwg_ERITFBUWFxgZGhscHR4fIA' }, key))
      .toThrow('metadata authentication failed');
  });

  it('wraps the history key with a generated recovery secret and rejects the wrong secret', () => {
    const key = generateHistoryKey(deterministic());
    const recovery = generateRecoverySecret(deterministic(40));
    const wrapped = wrapHistoryKeyForRecovery(key, recovery, deterministic(80));
    expect(unwrapHistoryKeyFromRecovery(wrapped, recovery)).toEqual(key);
    expect(() => unwrapHistoryKeyFromRecovery(wrapped, generateRecoverySecret(deterministic(90))))
      .toThrow('Recovery secret is incorrect');
  });

  it('fails closed when randomness or key lengths are invalid', () => {
    expect(() => generateHistoryKey(() => new Uint8Array(2))).toThrow('Secure random source failed');
    expect(() => encryptPrivateRecord(record, new Uint8Array(2), 1, deterministic())).toThrow('256-bit');
  });

  it('generates opaque record identifiers that reveal no record kind or date', () => {
    expect(generatePrivateRecordId(deterministic())).toBe('rwg_AgMEBQYHCAkKCwwNDg8QEQ');
  });
});
