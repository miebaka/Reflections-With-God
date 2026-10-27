import { describe, expect, it } from 'vitest';

import type { ContentUnit } from '../domain/content';
import {
  initialSafetyState,
  ordinaryJourneyAllowed,
  reduceSafetyInterruption,
} from './interruption';

const at = new Date('2026-10-27T12:00:00.000Z');
const riskResult = {
  state: 'explicit-risk' as const, policyId: 'policy-1', policyVersion: '1.0.0',
  screenedAt: at.toISOString(),
};

function comfortUnit(overrides: Partial<ContentUnit> = {}): ContentUnit {
  return {
    id: 'comfort-1', version: 1, passageId: 'Psalm.46.1', reference: 'Psalm 46:1',
    translationId: 'approved', scriptureText: 'fixture', context: 'fixture',
    reflectionPrompt: 'fixture', prayer: 'fixture', moodTags: ['sad'], intensities: ['strong'],
    movements: ['ground', 'comfort'], contraindicatedEmotions: [], deliveryClass: 'mood-responsive',
    groundingFallback: true, status: 'approved', approvedAt: '2026-10-26T00:00:00.000Z',
    approvals: { pastor: true, scholar: true, safety: true, final: true },
    ...overrides,
  };
}

describe('safety interruption state', () => {
  it('pauses ordinary delivery after explicit risk and ignores clear re-screening as a bypass', () => {
    const paused = reduceSafetyInterruption(initialSafetyState(), { type: 'screening-completed', result: riskResult });
    expect(paused.status).toBe('paused');
    expect(ordinaryJourneyAllowed(paused)).toBe(false);
    expect(reduceSafetyInterruption(paused, {
      type: 'screening-completed', result: { ...riskResult, state: 'clear' },
    })).toEqual(paused);
  });

  it('requires explicit safety confirmation and then a reviewed comfort unit', () => {
    const paused = reduceSafetyInterruption(initialSafetyState(), { type: 'screening-completed', result: riskResult });
    const awaiting = reduceSafetyInterruption(paused, { type: 'confirm-safe-enough', at });
    expect(awaiting.status).toBe('awaiting-comfort');
    expect(ordinaryJourneyAllowed(awaiting)).toBe(false);

    expect(reduceSafetyInterruption(awaiting, {
      type: 'deliver-comfort', unit: comfortUnit({ groundingFallback: false }), at,
    })).toEqual(awaiting);
    expect(reduceSafetyInterruption(awaiting, {
      type: 'deliver-comfort', unit: comfortUnit({ status: 'draft' }), at,
    })).toEqual(awaiting);

    const resumed = reduceSafetyInterruption(awaiting, { type: 'deliver-comfort', unit: comfortUnit(), at });
    expect(resumed).toMatchObject({ status: 'clear', comfortUnitId: 'comfort-1' });
    expect(ordinaryJourneyAllowed(resumed)).toBe(true);
  });

  it('does not allow confirmation before an interruption', () => {
    expect(reduceSafetyInterruption(initialSafetyState(), { type: 'confirm-safe-enough', at }))
      .toEqual(initialSafetyState());
  });
});
