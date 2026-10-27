import { describe, expect, it } from 'vitest';

import {
  publishableSupportResources,
  researchedNigeriaResourceCandidates,
  validateSupportResourcePackage,
  type SupportResource,
  type SupportResourcePackage,
} from './resources';

const now = new Date('2026-10-27T12:00:00.000Z');

function verifiedResource(overrides: Partial<SupportResource> = {}): SupportResource {
  return {
    id: 'resource-1', name: 'Verified support', kind: 'emergency', region: 'Nigeria',
    contact: { method: 'call', value: '112' }, availability: '24/7', status: 'verified',
    source: { publisher: 'Official provider', url: 'https://example.gov.ng/support', checkedAt: '2026-10-27T08:00:00.000Z' },
    verification: {
      ownerId: 'release-owner-1', method: 'phone-call', verifiedAt: '2026-10-27T09:00:00.000Z',
      expiresAt: '2026-11-03T09:00:00.000Z', result: 'reachable-and-correct', notes: 'Called and confirmed routing.',
    },
    ...overrides,
  };
}

function approvedPackage(resources = [verifiedResource()]): SupportResourcePackage {
  return {
    id: 'ng-support', version: '1.0.0', status: 'approved', resources,
    approvals: [
      { reviewerId: 'adviser-1', role: 'qualified-safety-adviser', approvedAt: '2026-10-27T10:00:00.000Z', packageVersion: '1.0.0', reason: 'Safety review.' },
      { reviewerId: 'operator-1', role: 'release-operator', approvedAt: '2026-10-27T10:30:00.000Z', packageVersion: '1.0.0', reason: 'Release verification.' },
    ],
  };
}

describe('Nigeria support resource package', () => {
  it('publishes only a current, manually verified, dual-approved package', () => {
    const resourcePackage = approvedPackage();
    expect(validateSupportResourcePackage(resourcePackage, now)).toEqual([]);
    expect(publishableSupportResources(resourcePackage, now)).toHaveLength(1);
  });

  it('fails closed for candidates, expired verification, duplicates, or missing approval', () => {
    expect(validateSupportResourcePackage(approvedPackage([
      { ...researchedNigeriaResourceCandidates[0]! },
    ]), now)).toContain('resource-not-verified');
    expect(validateSupportResourcePackage(approvedPackage([
      verifiedResource({ verification: { ...verifiedResource().verification!, expiresAt: '2026-10-27T11:00:00.000Z' } }),
    ]), now)).toContain('resource-verification-invalid');
    expect(validateSupportResourcePackage(approvedPackage([verifiedResource(), verifiedResource()]), now))
      .toEqual(expect.arrayContaining(['resource-id-duplicate', 'resource-contact-duplicate']));
    expect(validateSupportResourcePackage({ ...approvedPackage(), approvals: [] }, now))
      .toContain('approval-missing:qualified-safety-adviser');
  });

  it('keeps researched contacts unavailable until a human verification record exists', () => {
    const draft: SupportResourcePackage = {
      id: 'ng-research', version: '0.1.0', status: 'draft',
      resources: researchedNigeriaResourceCandidates, approvals: [],
    };
    expect(publishableSupportResources(draft, now)).toEqual([]);
  });
});
