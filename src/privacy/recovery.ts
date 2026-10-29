import { unwrapHistoryKeyFromRecovery, type WrappedHistoryKey } from './crypto';
import type { DeviceTrustState } from './devices';

export type RecoverySetup =
  | { state: 'unconfirmed'; wrappedHistoryKey: WrappedHistoryKey; keyVersion: number }
  | { state: 'confirmed'; wrappedHistoryKey: WrappedHistoryKey; keyVersion: number; confirmedAt: string };

export type AccountRecoveryOutcome =
  | { accountAccess: 'restored'; privateHistory: 'recoverable-with-secret' }
  | { accountAccess: 'restored'; privateHistory: 'permanently-unrecoverable' };

export function confirmRecoverySecret(
  setup: RecoverySetup,
  recoverySecret: string,
  expectedHistoryKey: Uint8Array,
  now: Date,
): RecoverySetup {
  if (Number.isNaN(now.getTime())) throw new Error('A valid confirmation time is required.');
  if (setup.state === 'confirmed') return setup;
  const recovered = unwrapHistoryKeyFromRecovery(setup.wrappedHistoryKey, recoverySecret);
  if (!constantTimeEqual(recovered, expectedHistoryKey)) throw new Error('Recovery secret does not match the active history key.');
  return { ...setup, state: 'confirmed', confirmedAt: now.toISOString() };
}

export function assertCloudHistoryMaySync(setup: RecoverySetup, devices: DeviceTrustState): void {
  if (setup.state !== 'confirmed') throw new Error('Recovery secret must be confirmed before cloud history sync.');
  if (setup.keyVersion !== devices.keyVersion) throw new Error('Recovery and device key versions do not match.');
  if (devices.syncState !== 'ready') throw new Error('Cloud history sync is suspended until key rotation completes.');
  if (!devices.devices.some(({ state }) => state === 'active')) throw new Error('An active trusted device is required.');
}

export function accountRecoveryOutcome(hasRecoverySecret: boolean): AccountRecoveryOutcome {
  return hasRecoverySecret
    ? { accountAccess: 'restored', privateHistory: 'recoverable-with-secret' }
    : { accountAccess: 'restored', privateHistory: 'permanently-unrecoverable' };
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index]! ^ right[index]!;
  return difference === 0;
}
