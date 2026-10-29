import { describe, expect, it } from 'vitest';
import type { SafetyScreeningResult } from '../safety/policy';
import {
  analysisAvailability,
  confirmAnalysisConsent,
  prepareAnalysisConsent,
  revokeAnalysisConsent,
  submitReflectionForAnalysis,
  type AnalysisConsent,
  type AnalysisConsentRepository,
  type AnalysisProviderAssurance,
} from './consent';

const now = new Date('2026-10-29T12:00:00.000Z');
const assurance: AnalysisProviderAssurance = {
  providerId: 'provider-reviewed-1', status: 'active',
  validFrom: '2026-10-01T00:00:00.000Z', validUntil: '2026-11-01T00:00:00.000Z',
  zeroTraining: true, zeroPersistentRetention: true, payloadLoggingDisabled: true,
  contractVersion: '1.0.0', technicalVerificationId: 'verification-report-1',
  securityReviewerId: 'security-reviewer', privacyReviewerId: 'privacy-reviewer',
};
const clear: SafetyScreeningResult = {
  state: 'clear', policyId: 'policy', policyVersion: '1.0.0', screenedAt: now.toISOString(),
};
const clearScreener = { screen() { return clear; } };

function repository(initial: AnalysisConsent): AnalysisConsentRepository {
  let value = initial;
  return {
    async load(id) { return value.id === id ? value : undefined; },
    async save(next) { value = next; },
    async claimConfirmed(id, submittedAt) {
      if (value.id !== id || value.state !== 'confirmed') return undefined;
      value = { ...value, state: 'submitted', submittedAt };
      return value;
    },
  };
}

function confirmed(): AnalysisConsent {
  return confirmAnalysisConsent(
    prepareAnalysisConsent('analysis-1', 'rwg_AQIDBAUGBwgJCgsMDQ4PEA', '1.0.0', now), now,
  );
}

describe('single-reflection deeper analysis', () => {
  it('is unavailable by default and when provider assurances are expired', () => {
    expect(analysisAvailability(undefined, now)).toEqual({ available: false, reason: 'provider-not-configured' });
    expect(analysisAvailability({ ...assurance, validUntil: now.toISOString() }, now))
      .toEqual({ available: false, reason: 'assurance-invalid' });
  });

  it('allows revocation until submission and never reuses consent', async () => {
    expect(revokeAnalysisConsent(confirmed(), now).state).toBe('revoked');
    const store = repository(confirmed());
    const provider = { async analyze() { return { observation: 'A transient observation.' }; } };
    await expect(submitReflectionForAnalysis({
      consentId: 'analysis-1', reflectionText: 'One chosen private reflection.',
      reflectionId: 'rwg_AQIDBAUGBwgJCgsMDQ4PEA', safetyScreener: clearScreener,
      assurance, repository: store, provider, now,
    })).resolves.toMatchObject({ persistence: 'none', observation: 'A transient observation.' });
    await expect(submitReflectionForAnalysis({
      consentId: 'analysis-1', reflectionText: 'One chosen private reflection.',
      reflectionId: 'rwg_AQIDBAUGBwgJCgsMDQ4PEA', safetyScreener: clearScreener,
      assurance, repository: store, provider, now,
    })).rejects.toThrow('single-use');
  });

  it('never transmits when safety is interrupted or assurances are unavailable', async () => {
    let calls = 0;
    const provider = { async analyze() { calls += 1; return { observation: 'unused' }; } };
    await expect(submitReflectionForAnalysis({
      consentId: 'analysis-1', reflectionId: 'rwg_AQIDBAUGBwgJCgsMDQ4PEA', reflectionText: 'private',
      safetyScreener: { screen() { return { ...clear, state: 'explicit-risk' as const }; } },
      assurance, repository: repository(confirmed()), provider, now,
    })).rejects.toThrow('safety interruption');
    await expect(submitReflectionForAnalysis({
      consentId: 'analysis-1', reflectionId: 'rwg_AQIDBAUGBwgJCgsMDQ4PEA', reflectionText: 'private',
      safetyScreener: clearScreener,
      assurance: undefined, repository: repository(confirmed()), provider, now,
    })).rejects.toThrow('unavailable');
    expect(calls).toBe(0);
  });
});
