import type { MoodCheckIn } from '../domain/checkIn';

export type SafetyPolicyApproval = {
  reviewerId: string;
  role: 'qualified-safety-adviser';
  approvedAt: string;
  policyVersion: string;
  reason: string;
};

export type SafetyPolicy = {
  id: string;
  version: string;
  status: 'draft' | 'approved' | 'retired';
  explicitRiskPhrases: readonly string[];
  approvals: readonly SafetyPolicyApproval[];
};

export type SafetyScreeningResult = {
  state: 'clear' | 'explicit-risk';
  policyId: string;
  policyVersion: string;
  screenedAt: string;
};

export type SadnessSupport = 'none' | 'gentle-nudge';

export function screenPrivateText(
  text: string,
  policy: SafetyPolicy,
  now: Date,
): SafetyScreeningResult {
  assertApprovedPolicy(policy, now);
  const normalized = normalize(text);
  const explicitRisk = policy.explicitRiskPhrases.some((phrase) => containsWholePhrase(normalized, normalize(phrase)));
  return {
    state: explicitRisk ? 'explicit-risk' : 'clear',
    policyId: policy.id,
    policyVersion: policy.version,
    screenedAt: now.toISOString(),
  };
}

export function sadnessSupportFor(checkIn: MoodCheckIn): SadnessSupport {
  return checkIn.kind === 'known'
    && checkIn.selections.some(({ emotion, intensity }) => emotion === 'sad' && intensity === 'strong')
    ? 'gentle-nudge'
    : 'none';
}

export function assertSafeForOrdinaryPersistence(result: SafetyScreeningResult | undefined): void {
  if (!result) throw new Error('Private text must be screened on device before persistence.');
  if (result.state === 'explicit-risk') throw new Error('Explicit-risk text must enter the safety interruption.');
}

export function validateSafetyPolicy(policy: SafetyPolicy, now: Date): readonly string[] {
  const issues: string[] = [];
  if (Number.isNaN(now.getTime())) return ['clock-invalid'];
  if (!policy.id.trim() || !/^\d+\.\d+\.\d+$/.test(policy.version)) issues.push('identity-invalid');
  if (policy.status !== 'approved') issues.push('policy-not-approved');
  if (policy.explicitRiskPhrases.length === 0) issues.push('phrases-missing');
  const normalized = policy.explicitRiskPhrases.map(normalize);
  if (normalized.some((phrase) => phrase.length < 12)) issues.push('phrase-too-broad');
  if (new Set(normalized).size !== normalized.length) issues.push('phrase-duplicate');
  const approval = policy.approvals.find(({ role, policyVersion }) => (
    role === 'qualified-safety-adviser' && policyVersion === policy.version
  ));
  if (!approval || !approval.reviewerId.trim() || !approval.reason.trim()
    || !isCanonicalPastTimestamp(approval.approvedAt, now)) issues.push('approval-invalid');
  return [...new Set(issues)];
}

function assertApprovedPolicy(policy: SafetyPolicy, now: Date): void {
  const issues = validateSafetyPolicy(policy, now);
  if (issues.length > 0) throw new Error(`Safety policy is unavailable: ${issues.join(', ')}.`);
}

function normalize(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('en-NG')
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function containsWholePhrase(text: string, phrase: string): boolean {
  if (!phrase) return false;
  return ` ${text} `.includes(` ${phrase} `);
}

function isCanonicalPastTimestamp(value: string, now: Date): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value && date <= now;
}

// Development fixture only. It cannot screen production text until a qualified adviser approves it.
export const developmentSafetyPolicy: SafetyPolicy = {
  id: 'ng-explicit-risk-development',
  version: '0.1.0',
  status: 'draft',
  explicitRiskPhrases: [
    'i am going to kill myself',
    'i plan to end my life',
    'i am about to end my life',
  ],
  approvals: [],
};
