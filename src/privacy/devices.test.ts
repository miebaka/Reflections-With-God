import { describe, expect, it } from 'vitest';
import {
  completeDeviceKeyRotation,
  generateDeviceKeyPair,
  revokeTrustedDevice,
  unwrapHistoryKeyForDevice,
  wrapHistoryKeyForDevice,
  type DeviceTrustState,
  type TrustedDevice,
} from './devices';

function random(seed = 1) {
  let value = seed;
  return (length: number) => Uint8Array.from({ length }, () => (value++ % 251) + 1);
}

function fixture() {
  const keys = generateDeviceKeyPair(random(1));
  const device: TrustedDevice = {
    id: 'device-a', label: 'My phone', publicKeyBase64: keys.publicKeyBase64,
    state: 'active', approvedAt: '2026-10-29T08:00:00.000Z',
  };
  return { keys, device };
}

describe('trusted device keys', () => {
  it('wraps the history key only to the approved receiving device', () => {
    const { keys, device } = fixture();
    const historyKey = random(90)(32);
    const wrapped = wrapHistoryKeyForDevice(historyKey, device, 1, random(120));
    expect(unwrapHistoryKeyForDevice(wrapped, device.id, keys.secretKeyBase64)).toEqual(historyKey);
    expect(() => unwrapHistoryKeyForDevice(wrapped, 'device-b', keys.secretKeyBase64)).toThrow('another device');
    expect(() => unwrapHistoryKeyForDevice({ ...wrapped, keyVersion: 2 }, device.id, keys.secretKeyBase64))
      .toThrow('metadata authentication failed');
  });

  it('requires rotation after revocation and blocks invalid completion', () => {
    const { device } = fixture();
    const second = { ...device, id: 'device-b', label: 'Tablet' };
    const state: DeviceTrustState = { keyVersion: 1, syncState: 'ready', devices: [device, second] };
    const revoked = revokeTrustedDevice(state, 'device-a', new Date('2026-10-29T09:00:00.000Z'));
    expect(revoked.syncState).toBe('rotation-required');
    expect(revoked.devices[0]).toMatchObject({ state: 'revoked' });
    expect(() => completeDeviceKeyRotation(revoked, 3)).toThrow('transition is invalid');
    expect(completeDeviceKeyRotation(revoked, 2)).toMatchObject({ keyVersion: 2, syncState: 'ready' });
  });

  it('will not wrap a key to a revoked device', () => {
    const { device } = fixture();
    expect(() => wrapHistoryKeyForDevice(random(2)(32), { ...device, state: 'revoked' }, 1, random()))
      .toThrow('revoked device');
  });
});
