import { fromByteArray } from 'base64-js';
import nacl from 'tweetnacl';
import { describe, expect, it } from 'vitest';

import type { EditorialContentPackage } from './package';
import {
  canonicalEditorialPayload,
  verifyEditorialPackageSignature,
  type TrustedSigningKey,
} from './signature';

const now = new Date('2026-10-27T12:00:00.000Z');
const keyPair = nacl.sign.keyPair.fromSeed(Uint8Array.from({ length: 32 }, (_, index) => index + 1));

function unsignedPackage(): EditorialContentPackage {
  return {
    manifest: {
      schemaVersion: 1, packageId: 'alpha-core', version: '1.0.0', status: 'approved',
      createdAt: '2026-10-26T00:00:00.000Z', expiresAt: '2027-10-26T00:00:00.000Z',
      translationRights: {
        translationId: 'translation-1', claimedBasis: 'open-source',
        writtenApprovalRecordId: 'rights-1', approvedBy: 'rights-reviewer',
        approvedAt: '2026-10-25T00:00:00.000Z', terms: {},
      },
      constitution: {
        version: '1.0.0', approvedAt: '2026-10-25T00:00:00.000Z',
        exclusionIds: [], approvals: [],
      },
      signature: {
        algorithm: 'Ed25519', keyId: 'key-1', value: '', verification: 'unverified',
      },
    },
    units: [{ id: 'unit-1', passageId: 'Psalm.1.1' } as never],
    prayerBlocks: [{ id: 'prayer-1', text: 'Faithful God' } as never],
  };
}

function trustedKey(overrides: Partial<TrustedSigningKey> = {}): TrustedSigningKey {
  return {
    keyId: 'key-1', algorithm: 'Ed25519', publicKeyBase64: fromByteArray(keyPair.publicKey),
    status: 'active', validFrom: '2026-01-01T00:00:00.000Z',
    validUntil: '2027-01-01T00:00:00.000Z', ...overrides,
  };
}

function signedPackage(): EditorialContentPackage {
  const contentPackage = unsignedPackage();
  const signature = nacl.sign.detached(
    new TextEncoder().encode(canonicalEditorialPayload(contentPackage)),
    keyPair.secretKey,
  );
  contentPackage.manifest.signature.value = fromByteArray(signature);
  return contentPackage;
}

describe('editorial package signatures', () => {
  it('verifies a canonical package with an active trusted Ed25519 key', () => {
    expect(verifyEditorialPackageSignature(signedPackage(), [trustedKey()], now)).toEqual({
      verified: true, keyId: 'key-1', algorithm: 'Ed25519',
    });
  });

  it('does not mutate signature metadata into a verified claim', () => {
    const contentPackage = signedPackage();
    verifyEditorialPackageSignature(contentPackage, [trustedKey()], now);
    expect(contentPackage.manifest.signature.verification).toBe('unverified');
  });

  it.each([
    ['manifest', (candidate: EditorialContentPackage) => { candidate.manifest.version = '1.0.1'; }],
    ['unit', (candidate: EditorialContentPackage) => { candidate.units[0]!.passageId = 'Psalm.1.2'; }],
    ['prayer block', (candidate: EditorialContentPackage) => { candidate.prayerBlocks[0]!.text = 'Changed'; }],
    ['array order', (candidate: EditorialContentPackage) => { candidate.units.push({ id: 'unit-2' } as never); candidate.units.reverse(); }],
  ])('rejects tampering with %s', (_label, mutate) => {
    const candidate = signedPackage();
    mutate(candidate);
    expect(verifyEditorialPackageSignature(candidate, [trustedKey()], now))
      .toEqual({ verified: false, code: 'signature-invalid' });
  });

  it.each([
    ['unknown key', [] as TrustedSigningKey[], 'key-unknown'],
    ['revoked key', [trustedKey({ status: 'revoked' })], 'key-revoked'],
    ['future key', [trustedKey({ validFrom: '2026-10-28T00:00:00.000Z' })], 'key-not-yet-valid'],
    ['expired key', [trustedKey({ validUntil: '2026-10-27T11:59:59.000Z' })], 'key-expired'],
  ])('rejects an %s', (_label, keys, code) => {
    expect(verifyEditorialPackageSignature(signedPackage(), keys, now))
      .toEqual({ verified: false, code });
  });

  it('rejects malformed key and signature encodings', () => {
    const badSignature = signedPackage();
    badSignature.manifest.signature.value = 'not base64!';
    expect(verifyEditorialPackageSignature(badSignature, [trustedKey()], now))
      .toEqual({ verified: false, code: 'signature-encoding-invalid' });

    expect(verifyEditorialPackageSignature(signedPackage(), [trustedKey({ publicKeyBase64: 'YQ==' })], now))
      .toEqual({ verified: false, code: 'key-encoding-invalid' });
  });

  it('rejects duplicate key identifiers and malformed key validity windows', () => {
    expect(verifyEditorialPackageSignature(signedPackage(), [trustedKey(), trustedKey()], now))
      .toEqual({ verified: false, code: 'key-ambiguous' });
    expect(verifyEditorialPackageSignature(signedPackage(), [trustedKey({ validFrom: 'someday' })], now))
      .toEqual({ verified: false, code: 'key-window-invalid' });
  });

  it('fails closed for an invalid clock or unsupported signature algorithm', () => {
    expect(verifyEditorialPackageSignature(signedPackage(), [trustedKey()], new Date('invalid')))
      .toEqual({ verified: false, code: 'clock-invalid' });
    const candidate = signedPackage();
    candidate.manifest.signature.algorithm = 'RSA' as never;
    expect(verifyEditorialPackageSignature(candidate, [trustedKey()], now))
      .toEqual({ verified: false, code: 'algorithm-unsupported' });
  });
});
