import { describe, expect, it } from 'vitest';
import { evaluateReleaseReadiness, requiredEvidenceFor, type EvidenceKind, type ReleaseEvidence } from './readiness';

const now = new Date('2026-10-29T12:00:00.000Z');
function evidence(kind: EvidenceKind, overrides: Partial<ReleaseEvidence> = {}): ReleaseEvidence {
  return {
    id: `evidence-${kind}`, kind, status: 'verified', artifactSha256: 'a'.repeat(64),
    artifactUri: `artifact:${kind}`, ownerId: 'accountable-owner',
    reviewedAt: '2026-10-29T10:00:00.000Z', notes: 'Test fixture evidence only.', ...overrides,
  };
}

describe('release readiness', () => {
  it('fails closed and names every missing developer-build artifact', () => {
    expect(evaluateReleaseReadiness('developer-build', [], now)).toEqual({
      target: 'developer-build', ready: false, verified: [],
      blockers: ['quality-ci', 'android-debug-build', 'migration-suite', 'accessibility-automated'],
    });
  });

  it('accepts a target only when every exact requirement has current verified evidence', () => {
    const complete = requiredEvidenceFor('internal-alpha').map((kind) => evidence(kind));
    expect(evaluateReleaseReadiness('internal-alpha', complete, now).ready).toBe(true);
    expect(evaluateReleaseReadiness('public-release', complete, now).ready).toBe(false);
  });

  it('blocks failed, withdrawn, expired, duplicate, and self-asserted evidence', () => {
    const items = requiredEvidenceFor('developer-build').map((kind) => evidence(kind));
    expect(evaluateReleaseReadiness('developer-build', [
      ...items.filter(({ kind }) => kind !== 'quality-ci'),
      evidence('quality-ci', { expiresAt: '2026-10-29T11:00:00.000Z' }),
    ], now).blockers).toContain('quality-ci');
    expect(() => evaluateReleaseReadiness('developer-build', [...items, items[0]!], now)).toThrow('one record per kind');
    expect(() => evaluateReleaseReadiness('developer-build', [{ ...items[0]!, approved: true } as never], now))
      .toThrow('invalid');
    expect(evaluateReleaseReadiness('developer-build', [
      ...items.filter(({ kind }) => kind !== 'quality-ci'),
      evidence('quality-ci', { reviewedAt: '2026-10-29T13:00:00.000Z' }),
    ], now).blockers).toContain('quality-ci');
  });
});
