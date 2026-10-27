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
    | 'approval-record-invalid' | 'signature-metadata-missing' | 'signature-state-invalid';
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
  if (!manifest.packageId.trim()) issues.push({ code: 'package-id-missing' });
  if (!semverPattern.test(manifest.version)) issues.push({ code: 'package-version-invalid' });
  if (manifest.status !== 'approved') issues.push({ code: 'package-not-active' });
  validateTimestamp(manifest.createdAt, 'createdAt', issues);
  validateTimestamp(manifest.expiresAt, 'expiresAt', issues);
  if (isIsoTimestamp(manifest.expiresAt) && new Date(manifest.expiresAt) <= now) {
    issues.push({ code: 'package-expired' });
  }

  validateRights(manifest.translationRights, issues);
  validateConstitution(manifest.constitution, issues);
  if (!manifest.signature.keyId.trim() || !manifest.signature.value.trim()) {
    issues.push({ code: 'signature-metadata-missing' });
  }
  if (manifest.signature.verification !== 'unverified') {
    issues.push({ code: 'signature-state-invalid' });
  }
  return issues;
}

function validateRights(record: TranslationRightsRecord, issues: ManifestIssue[]): void {
  if (!record.writtenApprovalRecordId.trim() || !record.approvedBy.trim()) {
    issues.push({ code: 'rights-approval-missing' });
  }
  validateTimestamp(record.approvedAt, 'translationRights.approvedAt', issues);
  for (const dimension of rightsDimensions) {
    const term = record.terms[dimension];
    if (!term) issues.push({ code: 'rights-term-missing', field: dimension });
    else if (!term.rationale.trim()) issues.push({ code: 'rights-rationale-missing', field: dimension });
  }
}

function validateConstitution(record: EditorialConstitutionRecord, issues: ManifestIssue[]): void {
  if (!semverPattern.test(record.version)) issues.push({ code: 'constitution-version-invalid' });
  validateTimestamp(record.approvedAt, 'constitution.approvedAt', issues);
  for (const exclusionId of requiredExclusionIds) {
    if (!record.exclusionIds.includes(exclusionId)) {
      issues.push({ code: 'required-exclusion-missing', field: exclusionId });
    }
  }

  const pastors = validApprovals(record, 'ordained-pastor', issues);
  const scholars = validApprovals(record, 'biblical-scholar', issues);
  if (pastors.length === 0) issues.push({ code: 'pastor-approval-missing' });
  if (scholars.length === 0) issues.push({ code: 'scholar-approval-missing' });
  if (pastors.some((pastor) => scholars.some((scholar) => scholar.reviewerId === pastor.reviewerId))) {
    issues.push({ code: 'dual-review-not-independent' });
  }
}

function validApprovals(
  constitution: EditorialConstitutionRecord,
  role: ReviewerRole,
  issues: ManifestIssue[],
): ApprovalRecord[] {
  return constitution.approvals.filter((approval) => {
    const valid = approval.role === role
      && Boolean(approval.reviewerId.trim())
      && Boolean(approval.reason.trim())
      && approval.contentVersion === constitution.version
      && isIsoTimestamp(approval.approvedAt);
    if (approval.role === role && !valid) issues.push({ code: 'approval-record-invalid', field: role });
    return valid;
  });
}

function validateTimestamp(value: string, field: string, issues: ManifestIssue[]): void {
  if (!isIsoTimestamp(value)) issues.push({ code: 'timestamp-invalid', field });
}

function isIsoTimestamp(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}
