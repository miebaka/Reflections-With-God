import { describe, expect, it } from 'vitest';

import {
  assertSafeForOrdinaryPersistence,
  sadnessSupportFor,
  screenPrivateText,
  validateSafetyPolicy,
  type SafetyPolicy,
} from './policy';

const now = new Date('2026-10-27T12:00:00.000Z');
const approvedPolicy: SafetyPolicy = {
  id: 'ng-explicit-risk', version: '1.0.0', status: 'approved',
  explicitRiskPhrases: [
    'i am going to kill myself',
    'i plan to end my life',
    'i am about to end my life',
  ],
  approvals: [{
    reviewerId: 'qualified-adviser-1', role: 'qualified-safety-adviser',
    approvedAt: '2026-10-26T12:00:00.000Z', policyVersion: '1.0.0', reason: 'Approved test policy.',
  }],
};

describe('on-device safety policy', () => {
  it('returns only a minimal explicit-risk state without echoing private text', () => {
    const result = screenPrivateText('I am going to kill myself.', approvedPolicy, now);
    expect(result).toEqual({
      state: 'explicit-risk', policyId: 'ng-explicit-risk', policyVersion: '1.0.0',
      screenedAt: now.toISOString(),
    });
    expect(JSON.stringify(result)).not.toContain('kill myself');
  });

  it('does not turn sadness, historical discussion, or negated intent into an interruption', () => {
    for (const text of [
      'I feel deeply sad today.',
      'Last year I had thoughts that frightened me.',
      'I am not going to kill myself.',
      'A friend said they plan to end their life.',
    ]) expect(screenPrivateText(text, approvedPolicy, now).state).toBe('clear');
  });

  it('offers a nudge for strong sadness without classifying it as emergency risk', () => {
    expect(sadnessSupportFor({
      kind: 'known', selections: [{ emotion: 'sad', intensity: 'strong' }],
    })).toBe('gentle-nudge');
    expect(sadnessSupportFor({
      kind: 'known', selections: [{ emotion: 'sad', intensity: 'moderate' }],
    })).toBe('none');
  });

  it('blocks unscreened and explicit-risk text from ordinary persistence', () => {
    expect(() => assertSafeForOrdinaryPersistence(undefined)).toThrow('screened on device');
    expect(() => assertSafeForOrdinaryPersistence(screenPrivateText(
      'I plan to end my life', approvedPolicy, now,
    ))).toThrow('safety interruption');
    expect(() => assertSafeForOrdinaryPersistence(screenPrivateText(
      'I need a quiet moment', approvedPolicy, now,
    ))).not.toThrow();
  });

  it('refuses draft, stale, future, broad, duplicate, or unapproved policies', () => {
    expect(validateSafetyPolicy({ ...approvedPolicy, status: 'draft' }, now)).toContain('policy-not-approved');
    expect(validateSafetyPolicy({ ...approvedPolicy, explicitRiskPhrases: ['end it'] }, now)).toContain('phrase-too-broad');
    expect(validateSafetyPolicy({
      ...approvedPolicy, explicitRiskPhrases: ['i plan to end my life', 'I PLAN TO END MY LIFE'],
    }, now)).toContain('phrase-duplicate');
    expect(validateSafetyPolicy({
      ...approvedPolicy,
      approvals: [{ ...approvedPolicy.approvals[0]!, approvedAt: '2026-10-28T00:00:00.000Z' }],
    }, now)).toContain('approval-invalid');
  });
});
