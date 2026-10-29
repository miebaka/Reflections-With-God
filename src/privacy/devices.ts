import { fromByteArray, toByteArray } from 'base64-js';
import nacl from 'tweetnacl';

import type { RandomBytes } from './crypto';

const encoder = new TextEncoder();
const decoder = new TextDecoder('utf-8', { fatal: true });

export type DeviceKeyPair = { publicKeyBase64: string; secretKeyBase64: string };
export type TrustedDevice = {
  id: string;
  label: string;
  publicKeyBase64: string;
  state: 'active' | 'revoked';
  approvedAt: string;
  revokedAt?: string;
};

export type DeviceWrappedHistoryKey = {
  schemaVersion: 1;
  algorithm: 'X25519-XSalsa20-Poly1305';
  deviceId: string;
  keyVersion: number;
  ephemeralPublicKeyBase64: string;
  nonceBase64: string;
  ciphertextBase64: string;
};

export type DeviceTrustState = {
  keyVersion: number;
  syncState: 'ready' | 'rotation-required';
  devices: readonly TrustedDevice[];
};

export function generateDeviceKeyPair(randomBytes: RandomBytes): DeviceKeyPair {
  const secret = randomBytes(nacl.box.secretKeyLength);
  if (!(secret instanceof Uint8Array) || secret.length !== nacl.box.secretKeyLength) {
    throw new Error('Secure random source failed.');
  }
  const pair = nacl.box.keyPair.fromSecretKey(secret);
  return { publicKeyBase64: fromByteArray(pair.publicKey), secretKeyBase64: fromByteArray(pair.secretKey) };
}

export function wrapHistoryKeyForDevice(
  historyKey: Uint8Array,
  device: TrustedDevice,
  keyVersion: number,
  randomBytes: RandomBytes,
): DeviceWrappedHistoryKey {
  if (device.state !== 'active') throw new Error('A revoked device cannot receive a history key.');
  if (historyKey.length !== 32 || !Number.isSafeInteger(keyVersion) || keyVersion < 1) {
    throw new Error('History key metadata is invalid.');
  }
  const recipientPublicKey = canonicalBase64(device.publicKeyBase64, nacl.box.publicKeyLength);
  const ephemeral = generateDeviceKeyPair(randomBytes);
  const ephemeralSecret = canonicalBase64(ephemeral.secretKeyBase64, nacl.box.secretKeyLength);
  const nonce = randomBytes(nacl.box.nonceLength);
  if (nonce.length !== nacl.box.nonceLength) throw new Error('Secure random source failed.');
  const payload = encoder.encode(JSON.stringify({
    deviceId: device.id, keyVersion, historyKeyBase64: fromByteArray(historyKey),
  }));
  const ciphertext = nacl.box(payload, nonce, recipientPublicKey, ephemeralSecret);
  return {
    schemaVersion: 1,
    algorithm: 'X25519-XSalsa20-Poly1305',
    deviceId: device.id,
    keyVersion,
    ephemeralPublicKeyBase64: ephemeral.publicKeyBase64,
    nonceBase64: fromByteArray(nonce),
    ciphertextBase64: fromByteArray(ciphertext),
  };
}

export function unwrapHistoryKeyForDevice(
  wrapped: DeviceWrappedHistoryKey,
  expectedDeviceId: string,
  deviceSecretKeyBase64: string,
): Uint8Array {
  assertDeviceWrappedHistoryKey(wrapped);
  if (wrapped.deviceId !== expectedDeviceId) throw new Error('Wrapped key belongs to another device.');
  const opened = nacl.box.open(
    canonicalBase64(wrapped.ciphertextBase64),
    canonicalBase64(wrapped.nonceBase64, nacl.box.nonceLength),
    canonicalBase64(wrapped.ephemeralPublicKeyBase64, nacl.box.publicKeyLength),
    canonicalBase64(deviceSecretKeyBase64, nacl.box.secretKeyLength),
  );
  if (!opened) throw new Error('Device key authentication failed.');
  let payload: unknown;
  try { payload = JSON.parse(decoder.decode(opened)); } catch { throw new Error('Device key payload is invalid.'); }
  if (!isRecord(payload) || Object.keys(payload).some((key) => !['deviceId', 'keyVersion', 'historyKeyBase64'].includes(key))
    || payload.deviceId !== wrapped.deviceId || payload.keyVersion !== wrapped.keyVersion
    || typeof payload.historyKeyBase64 !== 'string') throw new Error('Device key metadata authentication failed.');
  return canonicalBase64(payload.historyKeyBase64, 32);
}

export function revokeTrustedDevice(
  state: DeviceTrustState,
  deviceId: string,
  now: Date,
): DeviceTrustState {
  if (Number.isNaN(now.getTime())) throw new Error('A valid revocation time is required.');
  const target = state.devices.find((device) => device.id === deviceId);
  if (!target) throw new Error('Trusted device was not found.');
  if (target.state === 'revoked') return state;
  return {
    ...state,
    syncState: 'rotation-required',
    devices: state.devices.map((device) => device.id === deviceId
      ? { ...device, state: 'revoked' as const, revokedAt: now.toISOString() }
      : device),
  };
}

export function completeDeviceKeyRotation(state: DeviceTrustState, nextKeyVersion: number): DeviceTrustState {
  if (state.syncState !== 'rotation-required' || nextKeyVersion !== state.keyVersion + 1) {
    throw new Error('Device key rotation transition is invalid.');
  }
  if (!state.devices.some(({ state: deviceState }) => deviceState === 'active')) {
    throw new Error('At least one trusted device is required after rotation.');
  }
  return { ...state, keyVersion: nextKeyVersion, syncState: 'ready' };
}

export function assertDeviceWrappedHistoryKey(value: unknown): asserts value is DeviceWrappedHistoryKey {
  if (!isRecord(value) || value.schemaVersion !== 1 || value.algorithm !== 'X25519-XSalsa20-Poly1305'
    || typeof value.deviceId !== 'string' || !value.deviceId.trim()
    || !Number.isSafeInteger(value.keyVersion) || (value.keyVersion as number) < 1
    || typeof value.ephemeralPublicKeyBase64 !== 'string' || typeof value.nonceBase64 !== 'string'
    || typeof value.ciphertextBase64 !== 'string'
    || Object.keys(value).some((key) => !['schemaVersion', 'algorithm', 'deviceId', 'keyVersion',
      'ephemeralPublicKeyBase64', 'nonceBase64', 'ciphertextBase64'].includes(key))) {
    throw new Error('Device-wrapped history key is invalid.');
  }
  canonicalBase64(value.ephemeralPublicKeyBase64, nacl.box.publicKeyLength);
  canonicalBase64(value.nonceBase64, nacl.box.nonceLength);
  canonicalBase64(value.ciphertextBase64);
}

function canonicalBase64(value: string, length?: number): Uint8Array {
  let bytes: Uint8Array;
  try { bytes = toByteArray(value); } catch { throw new Error('Device key encoding is invalid.'); }
  if (fromByteArray(bytes) !== value || (length !== undefined && bytes.length !== length)) {
    throw new Error('Device key encoding is invalid.');
  }
  return bytes;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
