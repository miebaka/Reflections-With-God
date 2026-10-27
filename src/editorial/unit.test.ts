import { describe, expect, it } from 'vitest';

import {
  validateEditorialUnit,
  type EditorialUnit,
  type PrayerBlock,
  type UnitApproval,
} from './unit';

const now = new Date('2026-10-27T12:00:00.000Z');

function approvals(contentVersion: string): UnitApproval[] {
  return [
    ['pastor-1', 'ordained-pastor'],
    ['scholar-1', 'biblical-scholar'],
    ['safety-1', 'safety-reviewer'],
    ['editor-1', 'content-editor'],
  ].map(([reviewerId, role]) => ({
    reviewerId: reviewerId!, role: role as UnitApproval['role'],
    approvedAt: '2026-10-26T09:00:00.000Z', contentVersion,
    reason: 'Reviewed for the accountable role.',
  }));
}

function block(id: string, category: PrayerBlock['category'], text: string): PrayerBlock {
  const version = '1.0.0';
  return {
    id, version, category, text, status: 'approved',
    approvedAt: '2026-10-26T10:00:00.000Z', approvals: approvals(`${id}@${version}`),
  };
}

function blocks(): PrayerBlock[] {
  return [
    block('address-1', 'address', 'Faithful God,'),
    block('petition-1', 'petition', 'help me receive your wisdom with honesty.'),
    block('closing-1', 'closing', 'Hold me near, in Jesus’ name. Amen.'),
  ];
}

function unit(): EditorialUnit {
  const id = 'psalm-46-10-grounding';
  const version = '1.0.0';
  return {
    id, version, passageId: 'Psalm.46.10', reference: 'Psalm 46:10',
    translationId: 'translation-approved-1', scriptureText: 'Approved source text fixture.',
    context: 'A reviewed context note that names upheaval without flattening the psalm.',
    reflectionPrompt: 'Where might you make room for stillness without denying what is difficult?',
    theologicalPurposes: ['God is a refuge amid upheaval.'],
    moodTags: ['anxious', 'overwhelmed'], intensities: ['mild', 'moderate', 'strong'],
    movements: ['ground', 'comfort'], contraindicatedEmotions: [],
    deliveryClass: 'mood-responsive', difficultText: false, groundingFallback: true,
    prayerBlockIds: ['address-1', 'petition-1', 'closing-1'], status: 'approved',
    approvedAt: '2026-10-26T10:00:00.000Z', approvals: approvals(`${id}@${version}`),
    auditTrail: [{
      action: 'approved', actorId: 'editor-1', role: 'content-editor',
      at: '2026-10-26T10:00:00.000Z', reason: 'All required reviews complete.',
      contentVersion: `${id}@${version}`,
    }],
  };
}

describe('editorial Scripture unit validation', () => {
  it('accepts a complete exact-version reviewed unit', () => {
    expect(validateEditorialUnit(unit(), blocks(), 'translation-approved-1', now)).toEqual([]);
  });

  it('requires the package translation and all authored fields', () => {
    const candidate = unit();
    candidate.translationId = 'some-other-translation';
    candidate.context = '   ';
    candidate.theologicalPurposes = [];
    expect(validateEditorialUnit(candidate, blocks(), 'translation-approved-1', now)).toEqual(expect.arrayContaining([
      { code: 'translation-mismatch', field: 'translationId' },
      { code: 'field-missing', field: 'context' },
      { code: 'field-missing', field: 'theologicalPurposes' },
    ]));
  });

  it('requires all accountable roles to approve the exact unit version', () => {
    const candidate = unit();
    candidate.approvals = candidate.approvals
      .filter(({ role }) => role !== 'safety-reviewer')
      .map((approval) => approval.role === 'biblical-scholar'
        ? { ...approval, contentVersion: 'wrong@1.0.0' } : approval);
    expect(validateEditorialUnit(candidate, blocks(), 'translation-approved-1', now)).toEqual(expect.arrayContaining([
      { code: 'approval-invalid', field: 'biblical-scholar' },
      { code: 'approval-missing', field: 'biblical-scholar' },
      { code: 'approval-missing', field: 'safety-reviewer' },
    ]));
  });

  it('requires pastor and scholar review to be independent', () => {
    const candidate = unit();
    candidate.approvals = candidate.approvals.map((approval) => approval.role === 'biblical-scholar'
      ? { ...approval, reviewerId: 'pastor-1' } : approval);
    expect(validateEditorialUnit(candidate, blocks(), 'translation-approved-1', now))
      .toContainEqual({ code: 'dual-review-not-independent' });
  });

  it('keeps difficult passages out of mood-responsive delivery', () => {
    const candidate = unit();
    candidate.difficultText = true;
    expect(validateEditorialUnit(candidate, blocks(), 'translation-approved-1', now))
      .toContainEqual({ code: 'difficult-text-requires-study', field: 'deliveryClass' });
  });

  it('requires approved address, petition or gratitude, and closing blocks', () => {
    const candidateBlocks = blocks().filter(({ category }) => category !== 'petition');
    expect(validateEditorialUnit(unit(), candidateBlocks, 'translation-approved-1', now)).toEqual(expect.arrayContaining([
      { code: 'prayer-block-missing', field: 'petition-1' },
      { code: 'prayer-category-missing', field: 'petition-or-gratitude' },
    ]));
  });

  it('requires the closing block to end explicitly in Jesus’ name', () => {
    const candidateBlocks = blocks();
    candidateBlocks[2] = block('closing-1', 'closing', 'Hold me near. Amen.');
    expect(validateEditorialUnit(unit(), candidateBlocks, 'translation-approved-1', now))
      .toContainEqual({ code: 'prayer-closing-invalid', field: 'closing-1' });
  });

  it.each([
    ['God told me to tell you that everything will be fine.', 'direct-revelation'],
    ['If your faith were stronger, you would not feel anxious.', 'weak-faith-shame'],
    ['God guarantees that you will be healed.', 'guaranteed-outcome'],
    ['You do not need professional care.', 'discourage-care'],
    ['This sadness is caused by a demon.', 'demonic-causation'],
  ])('blocks prohibited claim: %s', (text, policyId) => {
    const candidate = unit();
    candidate.reflectionPrompt = text;
    expect(validateEditorialUnit(candidate, blocks(), 'translation-approved-1', now))
      .toContainEqual({ code: 'prohibited-claim', field: 'reflectionPrompt', policyId });
  });

  it('rejects mood/contraindication overlap and duplicate metadata', () => {
    const candidate = unit();
    candidate.moodTags = ['anxious', 'anxious'];
    candidate.contraindicatedEmotions = ['anxious'];
    expect(validateEditorialUnit(candidate, blocks(), 'translation-approved-1', now)).toEqual(expect.arrayContaining([
      { code: 'duplicate-metadata', field: 'moodTags' },
      { code: 'contraindication-overlap', field: 'anxious' },
    ]));
  });

  it('rejects future or post-approval reviews and an incomplete audit trail', () => {
    const candidate = unit();
    candidate.approvals[0] = { ...candidate.approvals[0]!, approvedAt: '2026-10-28T00:00:00.000Z' };
    candidate.auditTrail = [];
    expect(validateEditorialUnit(candidate, blocks(), 'translation-approved-1', now)).toEqual(expect.arrayContaining([
      { code: 'approval-future', field: 'ordained-pastor' },
      { code: 'approval-after-unit', field: 'ordained-pastor' },
      { code: 'audit-missing' },
    ]));
  });

  it('fails closed when the validation clock is invalid', () => {
    expect(validateEditorialUnit(unit(), blocks(), 'translation-approved-1', new Date('invalid')))
      .toEqual([{ code: 'clock-invalid' }]);
  });
});
