import type { SafetyScreeningResult } from '../safety/policy';

export type AnalysisProviderAssurance = {
  providerId: string;
  status: 'active' | 'suspended' | 'expired';
  validFrom: string;
  validUntil: string;
  zeroTraining: true;
  zeroPersistentRetention: true;
  payloadLoggingDisabled: true;
  contractVersion: string;
  technicalVerificationId: string;
  securityReviewerId: string;
  privacyReviewerId: string;
};

export type AnalysisConsent = {
  id: string;
  reflectionId: string;
  disclosureVersion: string;
  createdAt: string;
} & (
  | { state: 'prepared' }
  | { state: 'confirmed'; confirmedAt: string }
  | { state: 'revoked'; revokedAt: string }
  | { state: 'submitted'; submittedAt: string }
);

export type AnalysisAvailability =
  | { available: true; providerId: string }
  | { available: false; reason: 'provider-not-configured' | 'assurance-invalid' };

export type TransientAnalysisResult = {
  requestId: string;
  observation: string;
  processedAt: string;
  persistence: 'none';
};

export interface AnalysisConsentRepository {
  load(id: string): Promise<AnalysisConsent | undefined>;
  save(consent: AnalysisConsent): Promise<void>;
  claimConfirmed(id: string, submittedAt: string): Promise<AnalysisConsent | undefined>;
}

export interface ZeroRetentionAnalysisProvider {
  analyze(request: { requestId: string; reflectionText: string }): Promise<{ observation: string }>;
}

export interface ExactTextSafetyScreener {
  screen(text: string, now: Date): SafetyScreeningResult;
}

export function prepareAnalysisConsent(
  id: string,
  reflectionId: string,
  disclosureVersion: string,
  now: Date,
): AnalysisConsent {
  if (!id.trim() || !/^rwg_[A-Za-z0-9_-]{22}$/.test(reflectionId)
    || !/^\d+\.\d+\.\d+$/.test(disclosureVersion)) invalidConsent();
  assertClock(now);
  return { id, reflectionId, disclosureVersion, createdAt: now.toISOString(), state: 'prepared' };
}

export function confirmAnalysisConsent(consent: AnalysisConsent, now: Date): AnalysisConsent {
  assertClock(now);
  if (consent.state !== 'prepared') throw new Error('Only a prepared analysis consent can be confirmed.');
  return { ...consent, state: 'confirmed', confirmedAt: now.toISOString() };
}

export function revokeAnalysisConsent(consent: AnalysisConsent, now: Date): AnalysisConsent {
  assertClock(now);
  if (consent.state === 'submitted') throw new Error('Submitted analysis consent can no longer be revoked.');
  if (consent.state === 'revoked') return consent;
  const { state: _state, ...rest } = consent;
  return { ...rest, state: 'revoked', revokedAt: now.toISOString() };
}

export function analysisAvailability(
  assurance: AnalysisProviderAssurance | undefined,
  now: Date,
): AnalysisAvailability {
  if (!assurance) return { available: false, reason: 'provider-not-configured' };
  return validateProviderAssurance(assurance, now)
    ? { available: true, providerId: assurance.providerId }
    : { available: false, reason: 'assurance-invalid' };
}

export async function submitReflectionForAnalysis(input: {
  consentId: string;
  reflectionId: string;
  reflectionText: string;
  safetyScreener: ExactTextSafetyScreener;
  assurance: AnalysisProviderAssurance | undefined;
  repository: AnalysisConsentRepository;
  provider: ZeroRetentionAnalysisProvider | undefined;
  now: Date;
}): Promise<TransientAnalysisResult> {
  assertClock(input.now);
  if (!input.reflectionText.trim()) throw new Error('A specific reflection is required.');
  const safety = input.safetyScreener.screen(input.reflectionText, input.now);
  if (safety.state !== 'clear') throw new Error('Analysis is unavailable during a safety interruption.');
  const availability = analysisAvailability(input.assurance, input.now);
  if (!availability.available || !input.provider) throw new Error('Verified zero-retention analysis is unavailable.');
  const consent = await input.repository.load(input.consentId);
  if (!consent || consent.state !== 'confirmed') throw new Error('Confirmed single-use consent is required.');
  if (consent.reflectionId !== input.reflectionId) throw new Error('Consent belongs to another reflection.');
  const submittedAt = input.now.toISOString();
  const claimed = await input.repository.claimConfirmed(input.consentId, submittedAt);
  if (!claimed || claimed.state !== 'submitted') throw new Error('Analysis consent was already used or revoked.');
  const response = await input.provider.analyze({ requestId: consent.id, reflectionText: input.reflectionText });
  if (!response.observation.trim()) throw new Error('Analysis provider returned an invalid response.');
  return {
    requestId: consent.id,
    observation: response.observation,
    processedAt: submittedAt,
    persistence: 'none',
  };
}

export function validateProviderAssurance(assurance: AnalysisProviderAssurance, now: Date): boolean {
  if (Number.isNaN(now.getTime()) || assurance.status !== 'active' || !assurance.providerId.trim()
    || !assurance.securityReviewerId.trim() || !assurance.privacyReviewerId.trim()
    || !/^\d+\.\d+\.\d+$/.test(assurance.contractVersion) || !assurance.technicalVerificationId.trim()
    || assurance.zeroTraining !== true || assurance.zeroPersistentRetention !== true
    || assurance.payloadLoggingDisabled !== true) return false;
  const validFrom = canonicalDate(assurance.validFrom);
  const validUntil = canonicalDate(assurance.validUntil);
  return validFrom !== undefined && validUntil !== undefined && validFrom < validUntil
    && validFrom <= now && now < validUntil;
}

function canonicalDate(value: string): Date | undefined {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value ? date : undefined;
}

function assertClock(now: Date): void {
  if (Number.isNaN(now.getTime())) throw new Error('A valid analysis clock is required.');
}

function invalidConsent(): never {
  throw new Error('Analysis consent metadata is invalid.');
}
