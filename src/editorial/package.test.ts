import { describe, expect, it } from 'vitest';

import { requiredExclusionIds, type EditorialPackageManifest, type ReviewerRole } from './manifest';
import { assessEditorialReadiness, validateEditorialPackage, type EditorialContentPackage } from './package';
import type { EditorialUnit, PrayerBlock, UnitApproval } from './unit';

const now = new Date('2026-10-27T12:00:00.000Z');

function approvals(contentVersion: string): UnitApproval[] {
  const roles: ReviewerRole[] = ['ordained-pastor', 'biblical-scholar', 'safety-reviewer', 'content-editor'];
  return roles.map((role, index) => ({
    reviewerId: `${role}-${index}`, role, approvedAt: '2026-10-26T09:00:00.000Z',
    contentVersion, reason: 'Accountable review complete.',
  }));
}

function manifest(): EditorialPackageManifest {
  const term = { outcome: 'permitted' as const, rationale: 'Written rights review.' };
  return {
    schemaVersion: 1, packageId: 'alpha-core', version: '1.0.0', status: 'approved',
    createdAt: '2026-10-26T00:00:00.000Z', expiresAt: '2027-10-26T00:00:00.000Z',
    translationRights: {
      translationId: 'translation-1', claimedBasis: 'open-source',
      writtenApprovalRecordId: 'rights-1', approvedBy: 'rights-reviewer',
      approvedAt: '2026-10-25T00:00:00.000Z',
      terms: {
        quotation: term, attribution: term, modification: term,
        offlineStorage: term, apiUse: term, redistribution: term,
      },
    },
    constitution: {
      version: '1.0.0', approvedAt: '2026-10-25T00:00:00.000Z',
      exclusionIds: [...requiredExclusionIds],
      approvals: [
        { reviewerId: 'pastor', role: 'ordained-pastor', approvedAt: '2026-10-25T00:00:00.000Z', contentVersion: '1.0.0', reason: 'Approved.' },
        { reviewerId: 'scholar', role: 'biblical-scholar', approvedAt: '2026-10-25T00:00:00.000Z', contentVersion: '1.0.0', reason: 'Approved.' },
      ],
    },
    signature: { algorithm: 'Ed25519', keyId: 'key-1', value: 'metadata-only', verification: 'unverified' },
  };
}

function prayerBlock(id: string, category: PrayerBlock['category'], text: string): PrayerBlock {
  return {
    id, version: '1.0.0', category, text, status: 'approved',
    approvedAt: '2026-10-26T10:00:00.000Z', approvals: approvals(`${id}@1.0.0`),
  };
}

function prayerBlocks(): PrayerBlock[] {
  return [
    prayerBlock('address', 'address', 'Faithful God,'),
    prayerBlock('petition', 'petition', 'help me receive your wisdom.'),
    prayerBlock('closing', 'closing', 'Hold me near, in Jesus’ name. Amen.'),
  ];
}

function unit(id = 'unit-1', passageId = 'Psalm.46.10'): EditorialUnit {
  return {
    id, version: '1.0.0', passageId, reference: 'Psalm 46:10', translationId: 'translation-1',
    scriptureText: 'Approved source fixture.', context: 'Reviewed context.',
    reflectionPrompt: 'A reviewed question?', theologicalPurposes: ['God is refuge.'],
    moodTags: ['anxious'], intensities: ['mild', 'moderate', 'strong'], movements: ['ground'],
    contraindicatedEmotions: [], deliveryClass: 'mood-responsive', difficultText: false,
    groundingFallback: true, prayerBlockIds: ['address', 'petition', 'closing'],
    status: 'approved', approvedAt: '2026-10-26T10:00:00.000Z',
    approvals: approvals(`${id}@1.0.0`),
    auditTrail: [{
      action: 'approved', actorId: 'editor', role: 'content-editor',
      at: '2026-10-26T10:00:00.000Z', reason: 'All reviews complete.',
      contentVersion: `${id}@1.0.0`,
    }],
  };
}

function contentPackage(): EditorialContentPackage {
  return { manifest: manifest(), units: [unit()], prayerBlocks: prayerBlocks() };
}

describe('editorial content package validation', () => {
  it('accepts a structurally complete package without claiming cryptographic activation', () => {
    const result = validateEditorialPackage(contentPackage(), now);
    expect(result).toEqual([]);
    expect(contentPackage().manifest.signature.verification).toBe('unverified');
  });

  it('surfaces manifest and unit failures with their owning record', () => {
    const candidate = contentPackage();
    candidate.manifest.status = 'draft';
    candidate.units[0]!.translationId = 'wrong-translation';
    expect(validateEditorialPackage(candidate, now)).toEqual(expect.arrayContaining([
      { code: 'manifest-invalid', field: 'package-not-active' },
      { code: 'unit-invalid', field: 'unit-1.translation-mismatch.translationId' },
    ]));
  });

  it('rejects duplicate active identities and duplicate prayer blocks', () => {
    const candidate = contentPackage();
    candidate.units.push(unit());
    candidate.prayerBlocks.push(prayerBlock('address', 'address', 'Another address'));
    expect(validateEditorialPackage(candidate, now)).toEqual(expect.arrayContaining([
      { code: 'duplicate-unit-id', field: 'unit-1' },
      { code: 'duplicate-unit-version', field: 'unit-1@1.0.0' },
      { code: 'duplicate-prayer-block-id', field: 'address' },
    ]));
  });

  it('rejects conflicting source text for one canonical passage identifier', () => {
    const candidate = contentPackage();
    const conflict = unit('unit-2', 'Psalm.46.10');
    conflict.scriptureText = 'A conflicting source string.';
    candidate.units.push(conflict);
    expect(validateEditorialPackage(candidate, now))
      .toContainEqual({ code: 'canonical-passage-conflict', field: 'Psalm.46.10' });
  });

  it('requires at least one unit and one prayer block', () => {
    const candidate = contentPackage();
    candidate.units = [];
    candidate.prayerBlocks = [];
    expect(validateEditorialPackage(candidate, now)).toEqual(expect.arrayContaining([
      { code: 'package-content-missing', field: 'units' },
      { code: 'package-content-missing', field: 'prayerBlocks' },
    ]));
  });

  it('requires package validation and coverage before advancing to cryptographic verification', () => {
    const candidate = contentPackage();
    candidate.units = Array.from({ length: 29 }, (_, index) => {
      const next = unit(`unit-${index}`, `Psalm.${index + 1}.1`);
      next.reference = `Psalm ${index + 1}:1`;
      next.approvals = approvals(`${next.id}@1.0.0`);
      next.auditTrail[0] = { ...next.auditTrail[0]!, contentVersion: `${next.id}@1.0.0` };
      return next;
    });
    const report = assessEditorialReadiness(candidate, {
      enabledEmotions: ['anxious'], applicableMovements: { anxious: ['ground'] },
      mixedEmotionCombinations: [], requiredPassagesPerDay: 29,
      minimumCandidatesPerTuple: 3, requiredGroundingFallbacks: 20, replaySeeds: 100,
    }, now);
    expect(report.readyForCryptographicVerification).toBe(true);
    expect(report.coverage?.replayRuns).toBe(100);
    expect(candidate.manifest.signature.verification).toBe('unverified');
  });

  it('does not run coverage against a structurally invalid package', () => {
    const candidate = contentPackage();
    candidate.units[0]!.status = 'draft';
    const report = assessEditorialReadiness(candidate, {
      enabledEmotions: ['anxious'], applicableMovements: { anxious: ['ground'] },
      mixedEmotionCombinations: [], requiredPassagesPerDay: 29,
      minimumCandidatesPerTuple: 3, requiredGroundingFallbacks: 20, replaySeeds: 100,
    }, now);
    expect(report.readyForCryptographicVerification).toBe(false);
    expect(report.coverage).toBeUndefined();
  });
});
