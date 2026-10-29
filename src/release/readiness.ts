export type ReleaseTarget = 'developer-build' | 'internal-alpha' | 'nigeria-closed-beta' | 'public-release';

export type EvidenceKind =
  | 'quality-ci' | 'android-debug-build' | 'migration-suite' | 'performance-baseline'
  | 'translation-rights' | 'editorial-dual-review' | 'content-coverage'
  | 'safety-policy-review' | 'nigeria-resources-verified' | 'safety-scenario-suite'
  | 'privacy-legal-review' | 'cryptographic-review' | 'deletion-verification'
  | 'analytics-privacy-review' | 'accessibility-automated' | 'accessibility-manual'
  | 'midrange-android-matrix' | 'intermittent-network-matrix' | 'ios-device-matrix'
  | 'penetration-test' | 'incident-rollback-drill' | 'production-signing'
  | 'adult-consent-review' | 'beta-product-fit' | 'public-safety-threshold-review';

export type ReleaseEvidence = {
  id: string;
  kind: EvidenceKind;
  status: 'verified' | 'failed' | 'withdrawn';
  artifactSha256: string;
  artifactUri: string;
  ownerId: string;
  reviewedAt: string;
  expiresAt?: string;
  notes: string;
};

export type ReadinessDecision = {
  target: ReleaseTarget;
  ready: boolean;
  verified: readonly EvidenceKind[];
  blockers: readonly EvidenceKind[];
};

const requirements: Record<ReleaseTarget, readonly EvidenceKind[]> = {
  'developer-build': ['quality-ci', 'android-debug-build', 'migration-suite', 'accessibility-automated'],
  'internal-alpha': [
    'quality-ci', 'android-debug-build', 'migration-suite', 'accessibility-automated',
    'translation-rights', 'editorial-dual-review', 'content-coverage', 'safety-policy-review',
    'nigeria-resources-verified', 'safety-scenario-suite', 'privacy-legal-review',
    'cryptographic-review', 'analytics-privacy-review', 'adult-consent-review',
  ],
  'nigeria-closed-beta': [
    'quality-ci', 'android-debug-build', 'migration-suite', 'performance-baseline', 'translation-rights',
    'editorial-dual-review', 'content-coverage', 'safety-policy-review',
    'nigeria-resources-verified', 'safety-scenario-suite', 'privacy-legal-review',
    'cryptographic-review', 'deletion-verification', 'analytics-privacy-review',
    'accessibility-automated', 'accessibility-manual', 'midrange-android-matrix',
    'intermittent-network-matrix', 'adult-consent-review', 'incident-rollback-drill',
  ],
  'public-release': [
    'quality-ci', 'migration-suite', 'performance-baseline', 'translation-rights',
    'editorial-dual-review', 'content-coverage', 'safety-policy-review',
    'nigeria-resources-verified', 'safety-scenario-suite', 'privacy-legal-review',
    'cryptographic-review', 'deletion-verification', 'analytics-privacy-review',
    'accessibility-automated', 'accessibility-manual', 'midrange-android-matrix',
    'intermittent-network-matrix', 'ios-device-matrix', 'penetration-test',
    'incident-rollback-drill', 'production-signing', 'adult-consent-review',
    'beta-product-fit', 'public-safety-threshold-review',
  ],
};

export function evaluateReleaseReadiness(
  target: ReleaseTarget,
  evidence: readonly ReleaseEvidence[],
  now: Date,
): ReadinessDecision {
  if (Number.isNaN(now.getTime())) throw new Error('A valid readiness clock is required.');
  evidence.forEach((item) => assertReleaseEvidence(item));
  const duplicateKinds = evidence.map(({ kind }) => kind).filter((kind, index, all) => all.indexOf(kind) !== index);
  if (duplicateKinds.length > 0) throw new Error('Release evidence must contain at most one record per kind.');
  const verified = requirements[target].filter((kind) => {
    const item = evidence.find((candidate) => candidate.kind === kind);
    if (!item || item.status !== 'verified' || new Date(item.reviewedAt) > now) return false;
    return item.expiresAt === undefined || new Date(item.expiresAt) > now;
  });
  const blockers = requirements[target].filter((kind) => !verified.includes(kind));
  return { target, ready: blockers.length === 0, verified, blockers };
}

export function requiredEvidenceFor(target: ReleaseTarget): readonly EvidenceKind[] {
  return requirements[target];
}

export function assertReleaseEvidence(value: unknown): asserts value is ReleaseEvidence {
  if (!isRecord(value) || !onlyKeys(value, [
    'id', 'kind', 'status', 'artifactSha256', 'artifactUri', 'ownerId', 'reviewedAt', 'expiresAt', 'notes',
  ]) || typeof value.id !== 'string' || !value.id.trim() || !isEvidenceKind(value.kind)
    || !['verified', 'failed', 'withdrawn'].includes(value.status as string)
    || typeof value.artifactSha256 !== 'string' || !/^[a-f0-9]{64}$/.test(value.artifactSha256)
    || typeof value.artifactUri !== 'string' || !/^(https:\/\/|artifact:)[^\s]+$/.test(value.artifactUri)
    || typeof value.ownerId !== 'string' || !value.ownerId.trim()
    || typeof value.reviewedAt !== 'string' || !canonicalTimestamp(value.reviewedAt)
    || (value.expiresAt !== undefined && (typeof value.expiresAt !== 'string' || !canonicalTimestamp(value.expiresAt)))
    || typeof value.notes !== 'string' || !value.notes.trim()) throw new Error('Release evidence is invalid.');
  if (value.expiresAt !== undefined && new Date(value.expiresAt) <= new Date(value.reviewedAt)) {
    throw new Error('Release evidence expiry must follow its review.');
  }
}

function isEvidenceKind(value: unknown): value is EvidenceKind {
  return Object.values(requirements).flat().includes(value as EvidenceKind);
}

function canonicalTimestamp(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

function onlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
