import { describe, expect, it } from 'vitest';

import {
  requiredExclusionIds,
  validateEditorialManifest,
  type EditorialPackageManifest,
} from './manifest';

const now = new Date('2026-10-27T00:00:00.000Z');

function validManifest(): EditorialPackageManifest {
  const term = (outcome: 'permitted' | 'prohibited' | 'not-applicable') => ({
    outcome,
    rationale: 'Recorded by the accountable rights reviewer.',
  });
  return {
    schemaVersion: 1,
    packageId: 'nigeria-alpha-core',
    version: '1.0.0',
    status: 'approved',
    createdAt: '2026-10-26T00:00:00.000Z',
    expiresAt: '2027-10-26T00:00:00.000Z',
    translationRights: {
      translationId: 'translation-pending-real-approval',
      claimedBasis: 'open-source',
      writtenApprovalRecordId: 'rights-approval-001',
      approvedBy: 'rights-owner-001',
      approvedAt: '2026-10-25T00:00:00.000Z',
      terms: {
        quotation: term('permitted'), attribution: term('permitted'), modification: term('prohibited'),
        offlineStorage: term('permitted'), apiUse: term('not-applicable'), redistribution: term('permitted'),
      },
    },
    constitution: {
      version: '1.0.0',
      approvedAt: '2026-10-25T00:00:00.000Z',
      exclusionIds: [...requiredExclusionIds],
      approvals: [
        { reviewerId: 'pastor-001', role: 'ordained-pastor', approvedAt: '2026-10-25T00:00:00.000Z', contentVersion: '1.0.0', reason: 'Pastoral review complete.' },
        { reviewerId: 'scholar-001', role: 'biblical-scholar', approvedAt: '2026-10-25T00:00:00.000Z', contentVersion: '1.0.0', reason: 'Textual review complete.' },
      ],
    },
    signature: {
      algorithm: 'Ed25519', keyId: 'editorial-key-001', value: 'base64-signature-placeholder', verification: 'unverified',
    },
  };
}

describe('editorial package manifest validation', () => {
  it('accepts a complete accountable manifest without treating its signature as verified', () => {
    const manifest = validManifest();
    expect(validateEditorialManifest(manifest, now)).toEqual([]);
    expect(manifest.signature.verification).toBe('unverified');
  });

  it('rejects an open-source claim without a written approval record', () => {
    const manifest = validManifest();
    manifest.translationRights.writtenApprovalRecordId = '';
    expect(validateEditorialManifest(manifest, now)).toContainEqual({ code: 'rights-approval-missing' });
  });

  it('requires a reviewed outcome and rationale for every translation-rights dimension', () => {
    const manifest = validManifest();
    delete manifest.translationRights.terms.redistribution;
    manifest.translationRights.terms.quotation = { outcome: 'permitted', rationale: '' };
    expect(validateEditorialManifest(manifest, now)).toEqual(expect.arrayContaining([
      { code: 'rights-term-missing', field: 'redistribution' },
      { code: 'rights-rationale-missing', field: 'quotation' },
    ]));
  });

  it('requires distinct pastor and scholar reviewers', () => {
    const manifest = validManifest();
    manifest.constitution.approvals[1] = { ...manifest.constitution.approvals[1]!, reviewerId: 'pastor-001' };
    expect(validateEditorialManifest(manifest, now)).toContainEqual({ code: 'dual-review-not-independent' });
  });

  it('requires every stable contentious-doctrine exclusion ID', () => {
    const manifest = validManifest();
    manifest.constitution.exclusionIds = manifest.constitution.exclusionIds.filter((id) => id !== 'prosperity-teaching');
    expect(validateEditorialManifest(manifest, now)).toContainEqual({
      code: 'required-exclusion-missing', field: 'prosperity-teaching',
    });
  });

  it.each([
    ['invalid package version', (manifest: EditorialPackageManifest) => { manifest.version = 'version one'; }, 'package-version-invalid'],
    ['invalid timestamp', (manifest: EditorialPackageManifest) => { manifest.createdAt = 'yesterday'; }, 'timestamp-invalid'],
    ['retired package', (manifest: EditorialPackageManifest) => { manifest.status = 'retired'; }, 'package-not-active'],
    ['expired package', (manifest: EditorialPackageManifest) => { manifest.expiresAt = '2026-10-26T00:00:00.000Z'; }, 'package-expired'],
  ])('rejects %s', (_label, mutate, code) => {
    const manifest = validManifest();
    mutate(manifest);
    expect(validateEditorialManifest(manifest, now).map((issue) => issue.code)).toContain(code);
  });

  it('rejects any claim that signature metadata was already verified', () => {
    const manifest = validManifest();
    manifest.signature.verification = 'verified' as never;
    expect(validateEditorialManifest(manifest, now)).toContainEqual({ code: 'signature-state-invalid' });
  });
});
