import { describe, expect, it } from 'vitest';
import { decideRollout, type RolloutHealth } from './rollout';

const healthy: RolloutHealth = {
  crashFreeSessionsPercent: 99.8, unresolvedCriticalContentReports: 0,
  unresolvedSafetyIncidents: 0, privacyIncidentOpen: false,
  nigeriaResourcesCurrent: true, deletionDeadlineBreaches: 0,
};

describe('staged rollout', () => {
  it('advances one stage only when the corresponding readiness decision passes', () => {
    expect(decideRollout('staff-only', {
      target: 'internal-alpha', ready: true, verified: [], blockers: [],
    }, healthy)).toEqual({ action: 'advance', from: 'staff-only', to: 'alpha-5-percent' });
  });

  it('holds rather than treating a successful build as release approval', () => {
    expect(decideRollout('staff-only', {
      target: 'internal-alpha', ready: false, verified: ['quality-ci'], blockers: ['translation-rights'],
    }, healthy)).toEqual({
      action: 'hold', stage: 'staff-only', reasons: ['missing-evidence:translation-rights'],
    });
  });

  it.each([
    [{ privacyIncidentOpen: true }, 'open-privacy-incident'],
    [{ nigeriaResourcesCurrent: false }, 'nigeria-resources-stale-or-unverified'],
    [{ unresolvedCriticalContentReports: 1 }, 'unresolved-critical-content-report'],
    [{ unresolvedSafetyIncidents: 1 }, 'unresolved-safety-incident'],
    [{ crashFreeSessionsPercent: 98.9 }, 'crash-free-sessions-below-99-percent'],
    [{ deletionDeadlineBreaches: 1 }, 'deletion-deadline-breach'],
  ] as const)('rolls an active participant stage back for %o', (change, reason) => {
    expect(decideRollout('beta-25-percent', {
      target: 'nigeria-closed-beta', ready: true, verified: [], blockers: [],
    }, { ...healthy, ...change })).toEqual({
      action: 'rollback', from: 'beta-25-percent', to: 'staff-only', reasons: [reason],
    });
  });

  it('rejects impossible health measurements', () => {
    expect(() => decideRollout('staff-only', {
      target: 'internal-alpha', ready: true, verified: [], blockers: [],
    }, { ...healthy, crashFreeSessionsPercent: 101 })).toThrow('health is invalid');
  });
});
