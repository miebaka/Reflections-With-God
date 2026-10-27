import { isPublishable, type ContentUnit } from '../domain/content';
import type { SafetyScreeningResult } from './policy';

export type SafetyInterruptionState =
  | { status: 'clear' }
  | { status: 'paused'; policyId: string; policyVersion: string; interruptedAt: string }
  | { status: 'awaiting-comfort'; confirmedAt: string }
  | { status: 'clear'; resumedAt: string; comfortUnitId: string };

export type SafetyEvent =
  | { type: 'screening-completed'; result: SafetyScreeningResult }
  | { type: 'confirm-safe-enough'; at: Date }
  | { type: 'deliver-comfort'; unit: ContentUnit; at: Date };

export function initialSafetyState(): SafetyInterruptionState {
  return { status: 'clear' };
}

export function reduceSafetyInterruption(
  state: SafetyInterruptionState,
  event: SafetyEvent,
): SafetyInterruptionState {
  if (event.type === 'screening-completed') {
    if (event.result.state === 'clear') return state;
    return {
      status: 'paused',
      policyId: event.result.policyId,
      policyVersion: event.result.policyVersion,
      interruptedAt: event.result.screenedAt,
    };
  }
  if (event.type === 'confirm-safe-enough') {
    if (state.status !== 'paused' || Number.isNaN(event.at.getTime())) return state;
    return { status: 'awaiting-comfort', confirmedAt: event.at.toISOString() };
  }
  if (state.status !== 'awaiting-comfort' || Number.isNaN(event.at.getTime())
    || !isReviewedComfortUnit(event.unit)) return state;
  return { status: 'clear', resumedAt: event.at.toISOString(), comfortUnitId: event.unit.id };
}

export function ordinaryJourneyAllowed(state: SafetyInterruptionState): boolean {
  return state.status === 'clear';
}

export function isReviewedComfortUnit(unit: ContentUnit): boolean {
  return isPublishable(unit) && unit.groundingFallback
    && unit.movements.some((movement) => movement === 'comfort' || movement === 'ground');
}
