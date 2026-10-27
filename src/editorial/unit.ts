import type { ArcStage } from '../domain/arc';
import type { Emotion, Intensity } from '../domain/checkIn';
import type { ApprovalRecord, ReviewerRole } from './manifest';

export type UnitApproval = ApprovalRecord;
export type PrayerBlockCategory =
  | 'address' | 'confession' | 'gratitude' | 'petition' | 'surrender' | 'intercession' | 'closing';

export type PrayerBlock = {
  id: string;
  version: string;
  category: PrayerBlockCategory;
  text: string;
  status: 'draft' | 'approved' | 'retired';
  approvedAt?: string;
  approvals: UnitApproval[];
};

export type UnitAuditRecord = {
  action: 'created' | 'revised' | 'approved' | 'rejected' | 'retired' | 'rolled-back';
  actorId: string;
  role: ReviewerRole;
  at: string;
  reason: string;
  contentVersion: string;
};

export type EditorialUnit = {
  id: string;
  version: string;
  passageId: string;
  reference: string;
  translationId: string;
  scriptureText: string;
  context: string;
  reflectionPrompt: string;
  theologicalPurposes: readonly string[];
  moodTags: readonly Emotion[];
  intensities: readonly Intensity[];
  movements: readonly ArcStage[];
  contraindicatedEmotions: readonly Emotion[];
  deliveryClass: 'mood-responsive' | 'structured-study';
  difficultText: boolean;
  groundingFallback: boolean;
  prayerBlockIds: readonly string[];
  status: 'draft' | 'approved' | 'retired';
  approvedAt?: string;
  approvals: UnitApproval[];
  auditTrail: UnitAuditRecord[];
};

export type UnitIssue = {
  code:
    | 'clock-invalid' | 'field-missing' | 'version-invalid' | 'translation-mismatch'
    | 'unit-not-approved' | 'timestamp-invalid' | 'unit-approval-future'
    | 'difficult-text-requires-study' | 'approval-missing' | 'approval-invalid'
    | 'dual-review-not-independent' | 'approval-future' | 'approval-after-unit'
    | 'prayer-block-missing' | 'prayer-block-not-approved' | 'prayer-category-missing'
    | 'prayer-closing-invalid' | 'prohibited-claim' | 'duplicate-metadata'
    | 'contraindication-overlap' | 'audit-missing' | 'audit-invalid';
  field?: string;
  policyId?: string;
};

const requiredRoles: readonly ReviewerRole[] = [
  'ordained-pastor', 'biblical-scholar', 'safety-reviewer', 'content-editor',
];
const semverPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const jesusNamePattern = /\bin Jesus['’] name(?:[.!])?(?:\s+Amen[.!]?)?$/i;

const prohibitedClaims: ReadonlyArray<{ id: string; pattern: RegExp }> = [
  { id: 'direct-revelation', pattern: /\b(?:God|Jesus|the Lord) (?:told|said) me to tell you\b/i },
  { id: 'weak-faith-shame', pattern: /\b(?:(?:stronger|enough|more) faith|faith (?:were|was|is) (?:stronger|enough))\b.*\b(?:not|never|wouldn't|would not) (?:feel|be)\b|\b(?:sad|anxious|grieving|distressed)\b.*\bweak faith\b/i },
  { id: 'sin-causation', pattern: /\b(?:happened|suffering|pain|illness)\b.*\bbecause of your (?:sin|faith|spiritual status)\b/i },
  { id: 'guaranteed-outcome', pattern: /\b(?:God|Jesus|the Lord) guarantees?\b|\bguaranteed (?:healing|safety|prosperity|answer|improvement)\b/i },
  { id: 'discourage-care', pattern: /\b(?:do not|don't|never) need (?:professional|medical|clinical|mental health) care\b|\bstop (?:therapy|treatment|medication)\b/i },
  { id: 'demonic-causation', pattern: /\b(?:sadness|anxiety|grief|distress|depression)\b.*\b(?:demon|demonic|spirit of)\b|\bcaused by (?:a )?demon\b/i },
  { id: 'replace-community', pattern: /\b(?:this app|the app) (?:is|will be) all (?:you need|the companionship)\b/i },
];

export function validateEditorialUnit(
  unit: EditorialUnit,
  prayerBlocks: readonly PrayerBlock[],
  expectedTranslationId: string,
  now: Date,
): UnitIssue[] {
  if (Number.isNaN(now.getTime())) return [{ code: 'clock-invalid' }];
  const issues: UnitIssue[] = [];
  const contentVersion = `${unit.id}@${unit.version}`;

  requireText(unit.id, 'id', issues);
  requireText(unit.passageId, 'passageId', issues);
  requireText(unit.reference, 'reference', issues);
  requireText(unit.scriptureText, 'scriptureText', issues);
  requireText(unit.context, 'context', issues);
  requireText(unit.reflectionPrompt, 'reflectionPrompt', issues);
  if (!semverPattern.test(unit.version)) issues.push({ code: 'version-invalid', field: 'version' });
  if (unit.translationId !== expectedTranslationId) issues.push({ code: 'translation-mismatch', field: 'translationId' });
  if (unit.status !== 'approved') issues.push({ code: 'unit-not-approved', field: 'status' });
  if (!unit.approvedAt || !isIsoTimestamp(unit.approvedAt)) {
    issues.push({ code: 'timestamp-invalid', field: 'approvedAt' });
  } else if (new Date(unit.approvedAt) > now) {
    issues.push({ code: 'unit-approval-future', field: 'approvedAt' });
  }
  if (unit.difficultText && unit.deliveryClass !== 'structured-study') {
    issues.push({ code: 'difficult-text-requires-study', field: 'deliveryClass' });
  }

  requireNonempty(unit.theologicalPurposes, 'theologicalPurposes', issues);
  requireNonempty(unit.moodTags, 'moodTags', issues);
  requireNonempty(unit.intensities, 'intensities', issues);
  requireNonempty(unit.movements, 'movements', issues);
  requireNonempty(unit.prayerBlockIds, 'prayerBlockIds', issues);
  flagDuplicates(unit.theologicalPurposes, 'theologicalPurposes', issues);
  flagDuplicates(unit.moodTags, 'moodTags', issues);
  flagDuplicates(unit.intensities, 'intensities', issues);
  flagDuplicates(unit.movements, 'movements', issues);
  flagDuplicates(unit.prayerBlockIds, 'prayerBlockIds', issues);
  for (const emotion of new Set(unit.moodTags)) {
    if (unit.contraindicatedEmotions.includes(emotion)) {
      issues.push({ code: 'contraindication-overlap', field: emotion });
    }
  }

  const validApprovals = validateApprovals(unit.approvals, contentVersion, unit.approvedAt, now, issues);
  requireRoles(validApprovals, issues);
  enforceIndependentReview(validApprovals, issues);
  validatePrayerBlocks(unit, prayerBlocks, now, issues);
  validateAudit(unit, contentVersion, now, issues);
  screenText('context', unit.context, issues);
  screenText('reflectionPrompt', unit.reflectionPrompt, issues);
  for (const [index, purpose] of unit.theologicalPurposes.entries()) {
    screenText(`theologicalPurposes.${index}`, purpose, issues);
  }
  for (const block of prayerBlocks.filter(({ id }) => unit.prayerBlockIds.includes(id))) {
    screenText(`prayerBlock.${block.id}`, block.text, issues);
  }
  return issues;
}

function validatePrayerBlocks(
  unit: EditorialUnit,
  prayerBlocks: readonly PrayerBlock[],
  now: Date,
  issues: UnitIssue[],
): void {
  const blocksById = new Map(prayerBlocks.map((block) => [block.id, block]));
  const selected: PrayerBlock[] = [];
  for (const blockId of unit.prayerBlockIds) {
    const block = blocksById.get(blockId);
    if (!block) {
      issues.push({ code: 'prayer-block-missing', field: blockId });
      continue;
    }
    selected.push(block);
    if (block.status !== 'approved') issues.push({ code: 'prayer-block-not-approved', field: blockId });
    if (!block.approvedAt || !isIsoTimestamp(block.approvedAt) || new Date(block.approvedAt) > now) {
      issues.push({ code: 'prayer-block-not-approved', field: blockId });
    }
    const blockIssues: UnitIssue[] = [];
    const valid = validateApprovals(block.approvals, `${block.id}@${block.version}`, block.approvedAt, now, blockIssues);
    requireRoles(valid, blockIssues);
    enforceIndependentReview(valid, blockIssues);
    if (blockIssues.length > 0) issues.push({ code: 'prayer-block-not-approved', field: blockId });
  }

  const categories = new Set(selected.filter(({ status }) => status === 'approved').map(({ category }) => category));
  if (!categories.has('address')) issues.push({ code: 'prayer-category-missing', field: 'address' });
  if (!categories.has('petition') && !categories.has('gratitude')) {
    issues.push({ code: 'prayer-category-missing', field: 'petition-or-gratitude' });
  }
  if (!categories.has('closing')) issues.push({ code: 'prayer-category-missing', field: 'closing' });
  for (const closing of selected.filter(({ category }) => category === 'closing')) {
    if (!jesusNamePattern.test(closing.text.trim())) {
      issues.push({ code: 'prayer-closing-invalid', field: closing.id });
    }
  }
}

function validateApprovals(
  approvals: readonly UnitApproval[],
  contentVersion: string,
  approvedAt: string | undefined,
  now: Date,
  issues: UnitIssue[],
): UnitApproval[] {
  return approvals.filter((approval) => {
    const timestampValid = isIsoTimestamp(approval.approvedAt);
    const valid = Boolean(approval.reviewerId.trim())
      && approval.reviewerId === approval.reviewerId.trim()
      && Boolean(approval.reason.trim())
      && approval.contentVersion === contentVersion
      && timestampValid;
    if (!valid) issues.push({ code: 'approval-invalid', field: approval.role });
    if (timestampValid && new Date(approval.approvedAt) > now) {
      issues.push({ code: 'approval-future', field: approval.role });
    }
    if (timestampValid && approvedAt && isIsoTimestamp(approvedAt)
      && new Date(approval.approvedAt) > new Date(approvedAt)) {
      issues.push({ code: 'approval-after-unit', field: approval.role });
    }
    return valid && new Date(approval.approvedAt) <= now
      && (!approvedAt || !isIsoTimestamp(approvedAt) || new Date(approval.approvedAt) <= new Date(approvedAt));
  });
}

function requireRoles(validApprovals: readonly UnitApproval[], issues: UnitIssue[]): void {
  for (const role of requiredRoles) {
    if (!validApprovals.some((approval) => approval.role === role)) {
      issues.push({ code: 'approval-missing', field: role });
    }
  }
}

function enforceIndependentReview(validApprovals: readonly UnitApproval[], issues: UnitIssue[]): void {
  const pastors = validApprovals.filter(({ role }) => role === 'ordained-pastor');
  const scholars = validApprovals.filter(({ role }) => role === 'biblical-scholar');
  if (pastors.some((pastor) => scholars.some((scholar) => scholar.reviewerId === pastor.reviewerId))) {
    issues.push({ code: 'dual-review-not-independent' });
  }
}

function validateAudit(
  unit: EditorialUnit,
  contentVersion: string,
  now: Date,
  issues: UnitIssue[],
): void {
  if (!unit.auditTrail.some(({ action }) => action === 'approved')) issues.push({ code: 'audit-missing' });
  for (const record of unit.auditTrail) {
    const valid = Boolean(record.actorId.trim())
      && record.actorId === record.actorId.trim()
      && Boolean(record.reason.trim())
      && record.contentVersion === contentVersion
      && isIsoTimestamp(record.at)
      && new Date(record.at) <= now;
    if (!valid) issues.push({ code: 'audit-invalid', field: record.action });
  }
}

function screenText(field: string, value: string, issues: UnitIssue[]): void {
  for (const claim of prohibitedClaims) {
    if (claim.pattern.test(value)) issues.push({ code: 'prohibited-claim', field, policyId: claim.id });
  }
}

function requireText(value: string, field: string, issues: UnitIssue[]): void {
  if (!value.trim()) issues.push({ code: 'field-missing', field });
}

function requireNonempty(values: readonly unknown[], field: string, issues: UnitIssue[]): void {
  if (values.length === 0) issues.push({ code: 'field-missing', field });
}

function flagDuplicates(values: readonly unknown[], field: string, issues: UnitIssue[]): void {
  if (new Set(values).size !== values.length) issues.push({ code: 'duplicate-metadata', field });
}

function isIsoTimestamp(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}
