import { describe, expect, it } from 'vitest';
import { generateHistoryKey, generateRecoverySecret, wrapHistoryKeyForRecovery } from './crypto';
import { generateDeviceKeyPair, type DeviceTrustState } from './devices';
import { accountRecoveryOutcome, assertCloudHistoryMaySync, confirmRecoverySecret, type RecoverySetup } from './recovery';

function random(seed = 1) {
  let value = seed;
  return (length: number) => Uint8Array.from({ length }, () => (value++ % 251) + 1);
}

function setup() {
  const key = generateHistoryKey(random());
  const secret = generateRecoverySecret(random(50));
  const recovery: RecoverySetup = {
    state: 'unconfirmed', keyVersion: 1, wrappedHistoryKey: wrapHistoryKeyForRecovery(key, secret, random(90)),
  };
  const pair = generateDeviceKeyPair(random(120));
  const devices: DeviceTrustState = {
    keyVersion: 1, syncState: 'ready', devices: [{
      id: 'device-a', label: 'Phone', publicKeyBase64: pair.publicKeyBase64,
      state: 'active', approvedAt: '2026-10-29T08:00:00.000Z',
    }],
  };
  return { key, secret, recovery, devices };
}

describe('recovery confirmation gate', () => {
  it('keeps cloud history disabled until the user proves possession of the secret', () => {
    const state = setup();
    expect(() => assertCloudHistoryMaySync(state.recovery, state.devices)).toThrow('must be confirmed');
    const confirmed = confirmRecoverySecret(
      state.recovery, state.secret, state.key, new Date('2026-10-29T09:00:00.000Z'),
    );
    expect(() => assertCloudHistoryMaySync(confirmed, state.devices)).not.toThrow();
  });

  it('suspends sync during device revocation rotation or version disagreement', () => {
    const state = setup();
    const confirmed = confirmRecoverySecret(
      state.recovery, state.secret, state.key, new Date('2026-10-29T09:00:00.000Z'),
    );
    expect(() => assertCloudHistoryMaySync(confirmed, { ...state.devices, syncState: 'rotation-required' }))
      .toThrow('suspended');
    expect(() => assertCloudHistoryMaySync(confirmed, { ...state.devices, keyVersion: 2 }))
      .toThrow('versions do not match');
  });

  it('separates account recovery from private-history recovery', () => {
    expect(accountRecoveryOutcome(false)).toEqual({
      accountAccess: 'restored', privateHistory: 'permanently-unrecoverable',
    });
    expect(accountRecoveryOutcome(true).privateHistory).toBe('recoverable-with-secret');
  });
});
