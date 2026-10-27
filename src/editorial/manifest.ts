export const requiredExclusionIds = [
  'baptismal-disputes', 'communion', 'predestination', 'spiritual-gifts', 'gender-roles',
  'sexuality', 'healing-claims', 'prosperity-teaching', 'deliverance-claims', 'end-times-systems',
] as const;

export type ExclusionId = (typeof requiredExclusionIds)[number];
export type ReviewerRole = 'ordained-pastor' | 'biblical-scholar' | 'content-editor' | 'safety-reviewer';
export type ApprovalRecord = {
  reviewerId: string; role: ReviewerRole; approvedAt: string; contentVersion: string; reason: string;
};
export type RightsDimension =
  | 'quotation' | 'attribution' | 'modification' | 'offlineStorage' | 'apiUse' | 'redistribution';
export type RightsTermReview = {
  outcome: 'permitted' | 'prohibited' | 'not-applicable';
  rationale: string;
};
export type TranslationRightsRecord = {
  translationId: string;
  claimedBasis: 'open-source' | 'public-domain' | 'licensed' | 'other';
  writtenApprovalRecordId: string;
  approvedBy: string;
  approvedAt: string;
  terms: Partial<Record<RightsDimension, RightsTermReview>>;
};
export type EditorialConstitutionRecord = {
  version: string;
  approvedAt: string;
  exclusionIds: readonly string[];
  approvals: ApprovalRecord[];
};
export type EditorialPackageManifest = {
  schemaVersion: 1;
  packageId: string;
  version: string;
  status: 'draft' | 'approved' | 'retired';
  createdAt: string;
  expiresAt: string;
  translationRights: TranslationRightsRecord;
  constitution: EditorialConstitutionRecord;
  signature: {
    algorithm: 'Ed25519';
    keyId: string;
    value: string;
    verification: 'unverified';
  };
};

export type ManifestIssue = {
  code:
    | 'package-id-missing' | 'package-version-invalid' | 'package-not-active' | 'package-expired'
    | 'timestamp-invalid' | 'rights-approval-missing' | 'rights-term-missing'
    | 'rights-rationale-missing' | 'constitution-version-invalid' | 'required-exclusion-missing'
    | 'pastor-approval-missing' | 'scholar-approval-missing' | 'dual-review-not-independent'
    | 'approval-record-invalid' | 'signature-metadata-missing' | 'signature-state-invalid'
    | 'clock-invalid' | 'timestamp-future' | 'approval-after-constitution'
    | 'expiry-not-after-created' | 'translation-id-missing';
  field?: string;
};

const rightsDimensions: readonly RightsDimension[] = [
  'quotation', 'attribution', 'modification', 'offlineStorage', 'apiUse', 'redistribution',
];
const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

export function validateEditorialManifest(
  manifest: EditorialPackageManifest,
  now: Date,
): ManifestIssue[] {
  const issues: ManifestIssue[] = [];
  if (Number.isNaN(now.getTime())) return [{ code: 'clock-invalid' }];

  if (!manifest.packageId.trim()) issues.push({ code: 'package-id-missing' });
  if (!semverPattern.test(manifest.version)) issues.push({ code: 'package-version-invalid' });
  if (manifest.status !== 'approved') issues.push({ code: 'package-not-active' });
  validateTimestamp(manifest.createdAt, 'createdAt', issues, now);
  validateTimestamp(manifest.expiresAt, 'expiresAt', issues);
  if (isIsoTimestamp(manifest.expiresAt) && new Date(manifest.expiresAt) <= now) {
    issues.push({ code: 'package-expired' });
  }
  if (isIsoTimestamp(manifest.createdAt) && isIsoTimestamp(manifest.expiresAt)
    && new Date(manifest.expiresAt) <= new Date(manifest.createdAt)) {
    issues.push({ code: 'expiry-not-after-created' });
  }

  validateRights(manifest.translationRights, issues, now);
  validateConstitution(manifest.constitution, issues, now);
  if (!manifest.signature.keyId.trim() || !manifest.signature.value.trim()) {
    issues.push({ code: 'signature-metadata-missing' });
  }
  if (manifest.signature.verification !== 'unverified') {
    issues.push({ code: 'signature-state-invalid' });
  }
  return issues;
}

function validateRights(record: TranslationRightsRecord, issues: ManifestIssue[], now: Date): void {
  if (!record.translationId.trim()) issues.push({ code: 'translation-id-missing' });
  if (!record.writtenApprovalRecordId.trim() || !record.approvedBy.trim()) {
    issues.push({ code: 'rights-approval-missing' });
  }
  validateTimestamp(record.approvedAt, 'translationRights.approvedAt', issues, now);
  for (const dimension of rightsDimensions) {
    const term = record.terms[dimension];
    if (!term) issues.push({ code: 'rights-term-missing', field: dimension });
    else if (!term.rationale.trim()) issues.push({ code: 'rights-rationale-missing', field: dimension });
  }
}

function validateConstitution(record: EditorialConstitutionRecord, issues: ManifestIssue[], now: Date): void {
  if (!semverPattern.test(record.version)) issues.push({ code: 'constitution-version-invalid' });
  validateTimestamp(record.approvedAt, 'constitution.approvedAt', issues, now);
  for (const exclusionId of requiredExclusionIds) {
    if (!record.exclusionIds.includes(exclusionId)) {
      issues.push({ code: 'required-exclusion-missing', field: exclusionId });
    }
  }

  const valid = record.approvals.filter((approval) => validateApproval(approval, record, issues, now));
  const pastors = valid.filter((approval) => approval.role === 'ordained-pastor');
  const scholars = valid.filter((approval) => approval.role === 'biblical-scholar');
  if (pastors.length === 0) issues.push({ code: 'pastor-approval-missing' });
  if (scholars.length === 0) issues.push({ code: 'scholar-approval-missing' });
  if (pastors.some((pastor) => scholars.some((scholar) => scholar.reviewerId === pastor.reviewerId))) {
    issues.push({ code: 'dual-review-not-independent' });
  }
}

function validateApproval(
  approval: ApprovalRecord,
  constitution: EditorialConstitutionRecord,
  issues: ManifestIssue[],
  now: Date,
): boolean {
  const approvedAtValid = isIsoTimestamp(approval.approvedAt);
  const identityValid = Boolean(approval.reviewerId.trim())
    && approval.reviewerId === approval.reviewerId.trim();
  const valid = identityValid
    && Boolean(approval.reason.trim())
    && approval.contentVersion === constitution.version
    && approvedAtValid;

  if (!valid) issues.push({ code: 'approval-record-invalid', field: approval.role });
  if (approvedAtValid && new Date(approval.approvedAt) > now) {
    issues.push({ code: 'timestamp-future', field: `approval.${approval.role}.approvedAt` });
  }
  if (approvedAtValid && isIsoTimestamp(constitution.approvedAt)
    && new Date(approval.approvedAt) > new Date(constitution.approvedAt)) {
    issues.push({ code: 'approval-after-constitution', field: approval.role });
  }
  return valid;
}

function validateTimestamp(value: string, field: string, issues: ManifestIssue[], now?: Date): void {
  if (!isIsoTimestamp(value)) {
    issues.push({ code: 'timestamp-invalid', field });
  } else if (now && new Date(value) > now) {
    issues.push({ code: 'timestamp-future', field });
  }
}

function isIsoTimestamp(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}
