import type { ReadinessDecision } from './readiness';

export type RolloutStage = 'staff-only' | 'alpha-5-percent' | 'beta-25-percent' | 'beta-100-percent' | 'public';

export type RolloutHealth = {
  crashFreeSessionsPercent: number;
  unresolvedCriticalContentReports: number;
  unresolvedSafetyIncidents: number;
  privacyIncidentOpen: boolean;
  nigeriaResourcesCurrent: boolean;
  deletionDeadlineBreaches: number;
};

export type RolloutDecision =
  | { action: 'hold'; stage: RolloutStage; reasons: readonly string[] }
  | { action: 'advance'; from: RolloutStage; to: RolloutStage }
  | { action: 'rollback'; from: RolloutStage; to: 'staff-only'; reasons: readonly string[] };

const order: readonly RolloutStage[] = [
  'staff-only', 'alpha-5-percent', 'beta-25-percent', 'beta-100-percent', 'public',
];

export function decideRollout(
  stage: RolloutStage,
  readiness: ReadinessDecision,
  health: RolloutHealth,
): RolloutDecision {
  const reasons = rollbackReasons(health);
  if (reasons.length > 0 && stage !== 'staff-only') return { action: 'rollback', from: stage, to: 'staff-only', reasons };
  if (reasons.length > 0) return { action: 'hold', stage, reasons };
  if (!readiness.ready) return {
    action: 'hold', stage, reasons: readiness.blockers.map((kind) => `missing-evidence:${kind}`),
  };
  const index = order.indexOf(stage);
  const next = order[index + 1];
  return next ? { action: 'advance', from: stage, to: next } : { action: 'hold', stage, reasons: ['maximum-stage'] };
}

export function rollbackReasons(health: RolloutHealth): readonly string[] {
  if (!Number.isFinite(health.crashFreeSessionsPercent) || health.crashFreeSessionsPercent < 0
    || health.crashFreeSessionsPercent > 100
    || !nonNegativeInteger(health.unresolvedCriticalContentReports)
    || !nonNegativeInteger(health.unresolvedSafetyIncidents)
    || !nonNegativeInteger(health.deletionDeadlineBreaches)) {
    throw new Error('Rollout health is invalid.');
  }
  const reasons: string[] = [];
  if (health.crashFreeSessionsPercent < 99) reasons.push('crash-free-sessions-below-99-percent');
  if (health.unresolvedCriticalContentReports > 0) reasons.push('unresolved-critical-content-report');
  if (health.unresolvedSafetyIncidents > 0) reasons.push('unresolved-safety-incident');
  if (health.privacyIncidentOpen) reasons.push('open-privacy-incident');
  if (!health.nigeriaResourcesCurrent) reasons.push('nigeria-resources-stale-or-unverified');
  if (health.deletionDeadlineBreaches > 0) reasons.push('deletion-deadline-breach');
  return reasons;
}

function nonNegativeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0;
}
