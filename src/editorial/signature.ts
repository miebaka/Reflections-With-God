import { fromByteArray, toByteArray } from 'base64-js';
import { canonicalize } from 'json-canonicalize';
import nacl from 'tweetnacl';

import type { EditorialContentPackage } from './package';

export type TrustedSigningKey = {
  keyId: string;
  algorithm: 'Ed25519';
  publicKeyBase64: string;
  status: 'active' | 'revoked';
  validFrom: string;
  validUntil: string;
};

export type SignatureVerificationResult =
  | { verified: true; keyId: string; algorithm: 'Ed25519' }
  | {
    verified: false;
    code:
      | 'clock-invalid' | 'algorithm-unsupported' | 'key-unknown' | 'key-ambiguous'
      | 'key-revoked' | 'key-window-invalid' | 'key-not-yet-valid' | 'key-expired'
      | 'key-encoding-invalid' | 'signature-encoding-invalid' | 'signature-invalid'
      | 'payload-invalid';
  };

export function canonicalEditorialPayload(contentPackage: EditorialContentPackage): string {
  const { signature: _signature, ...unsignedManifest } = contentPackage.manifest;
  return canonicalize({
    manifest: unsignedManifest,
    units: contentPackage.units,
    prayerBlocks: contentPackage.prayerBlocks,
  });
}

export function verifyEditorialPackageSignature(
  contentPackage: EditorialContentPackage,
  trustedKeys: readonly TrustedSigningKey[],
  now: Date,
): SignatureVerificationResult {
  if (Number.isNaN(now.getTime())) return { verified: false, code: 'clock-invalid' };
  if (contentPackage.manifest.signature.algorithm !== 'Ed25519') {
    return { verified: false, code: 'algorithm-unsupported' };
  }

  const matchingKeys = trustedKeys.filter(({ keyId }) => keyId === contentPackage.manifest.signature.keyId);
  if (matchingKeys.length === 0) return { verified: false, code: 'key-unknown' };
  if (matchingKeys.length !== 1) return { verified: false, code: 'key-ambiguous' };
  const key = matchingKeys[0]!;
  if (key.algorithm !== 'Ed25519') return { verified: false, code: 'algorithm-unsupported' };
  if (key.status === 'revoked') return { verified: false, code: 'key-revoked' };
  if (!isIsoTimestamp(key.validFrom) || !isIsoTimestamp(key.validUntil)
    || new Date(key.validUntil) <= new Date(key.validFrom)) {
    return { verified: false, code: 'key-window-invalid' };
  }
  if (now < new Date(key.validFrom)) return { verified: false, code: 'key-not-yet-valid' };
  if (now >= new Date(key.validUntil)) return { verified: false, code: 'key-expired' };

  const publicKey = decodeCanonicalBase64(key.publicKeyBase64, nacl.sign.publicKeyLength);
  if (!publicKey) return { verified: false, code: 'key-encoding-invalid' };
  const signature = decodeCanonicalBase64(
    contentPackage.manifest.signature.value,
    nacl.sign.signatureLength,
  );
  if (!signature) return { verified: false, code: 'signature-encoding-invalid' };

  let payload: string;
  try {
    payload = canonicalEditorialPayload(contentPackage);
  } catch {
    return { verified: false, code: 'payload-invalid' };
  }
  const verified = nacl.sign.detached.verify(
    new TextEncoder().encode(payload),
    signature,
    publicKey,
  );
  return verified
    ? { verified: true, keyId: key.keyId, algorithm: 'Ed25519' }
    : { verified: false, code: 'signature-invalid' };
}

function decodeCanonicalBase64(value: string, expectedLength: number): Uint8Array | undefined {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
    return undefined;
  }
  try {
    const bytes = toByteArray(value);
    return bytes.length === expectedLength && fromByteArray(bytes) === value ? bytes : undefined;
  } catch {
    return undefined;
  }
}

function isIsoTimestamp(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}
