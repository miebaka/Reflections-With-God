import type { ArcStage } from '../domain/arc';
import type { Emotion, Intensity } from '../domain/checkIn';
import type { EditorialUnit } from './unit';

export type CoverageConfiguration = {
  enabledEmotions: readonly Emotion[];
  applicableMovements: Partial<Record<Emotion, readonly ArcStage[]>>;
  mixedEmotionCombinations: ReadonlyArray<readonly Emotion[]>;
  requiredPassagesPerDay: number;
  minimumCandidatesPerTuple: number;
  requiredGroundingFallbacks: number;
  replaySeeds: number;
  dayMovementSequence: readonly ArcStage[];
};

export type CoverageIssue = {
  code:
    | 'invalid-configuration' | 'single-day-insufficient' | 'tuple-insufficient'
    | 'fallback-insufficient' | 'mixed-day-insufficient' | 'replay-failed';
  field?: string;
  actual?: number;
  required?: number;
};

export type CoverageReport = {
  passed: boolean;
  issues: readonly CoverageIssue[];
  replayRuns: number;
};

const intensityValues: readonly Intensity[] = ['mild', 'moderate', 'strong'];

export function simulateCoverage(
  units: readonly EditorialUnit[],
  configuration: CoverageConfiguration,
): CoverageReport {
  const issues = validateConfiguration(configuration);
  if (issues.length > 0) return { passed: false, issues, replayRuns: 0 };

  const eligibleUnits = units.filter(isOrdinaryEligible);
  let replayRuns = 0;
  const replayStates: Array<{ field: string; units: EditorialUnit[] }> = [];

  for (const emotion of configuration.enabledEmotions) {
    for (const intensity of intensityValues) {
      const candidates = eligibleUnits.filter((unit) => unit.moodTags.includes(emotion)
        && unit.intensities.includes(intensity)
        && !unit.contraindicatedEmotions.includes(emotion));
      const distinct = distinctPassageCount(candidates);
      if (distinct < configuration.requiredPassagesPerDay) {
        issues.push({
          code: 'single-day-insufficient', field: `${emotion}.${intensity}`,
          actual: distinct, required: configuration.requiredPassagesPerDay,
        });
      }
      replayStates.push({ field: `${emotion}.${intensity}`, units: candidates });
      for (const movement of configuration.applicableMovements[emotion] ?? []) {
        const tupleCandidates = candidates.filter((unit) => unit.intensities.includes(intensity)
          && unit.movements.includes(movement));
        const tupleCount = distinctPassageCount(tupleCandidates);
        if (tupleCount < configuration.minimumCandidatesPerTuple) {
          issues.push({
            code: 'tuple-insufficient', field: `${emotion}.${intensity}.${movement}`,
            actual: tupleCount, required: configuration.minimumCandidatesPerTuple,
          });
        }
      }
    }
  }

  const fallbackCount = distinctPassageCount(eligibleUnits.filter(({ groundingFallback }) => groundingFallback));
  if (fallbackCount < configuration.requiredGroundingFallbacks) {
    issues.push({
      code: 'fallback-insufficient', actual: fallbackCount,
      required: configuration.requiredGroundingFallbacks,
    });
  }

  for (const combination of configuration.mixedEmotionCombinations) {
    const field = combination.join('+');
    const candidates = eligibleUnits.filter((unit) => combination.some((emotion) => unit.moodTags.includes(emotion))
      && combination.every((emotion) => !unit.contraindicatedEmotions.includes(emotion)));
    const distinct = distinctPassageCount(candidates);
    if (distinct < configuration.requiredPassagesPerDay) {
      issues.push({
        code: 'mixed-day-insufficient', field,
        actual: distinct, required: configuration.requiredPassagesPerDay,
      });
    }
    for (const assignment of intensityAssignments(combination)) {
      const assignedCandidates = candidates.filter((unit) => assignment.some(({ emotion, intensity }) => (
        unit.moodTags.includes(emotion) && unit.intensities.includes(intensity)
      )));
      replayStates.push({
        field: assignment.map(({ emotion, intensity }) => `${emotion}:${intensity}`).join('+'),
        units: assignedCandidates,
      });
    }
  }

  for (const state of replayStates) {
    let failed = false;
    for (let seed = 0; seed < configuration.replaySeeds; seed += 1) {
      replayRuns += 1;
      if (!simulateDistinctDay(state.units, configuration.dayMovementSequence, seed)) failed = true;
    }
    if (failed) {
      issues.push({
        code: 'replay-failed', field: state.field,
        actual: distinctPassageCount(state.units), required: configuration.requiredPassagesPerDay,
      });
    }
  }

  return { passed: issues.length === 0, issues, replayRuns };
}

function validateConfiguration(configuration: CoverageConfiguration): CoverageIssue[] {
  const issues: CoverageIssue[] = [];
  if (configuration.enabledEmotions.length === 0
    || new Set(configuration.enabledEmotions).size !== configuration.enabledEmotions.length) {
    issues.push({ code: 'invalid-configuration', field: 'enabledEmotions' });
  }
  for (const combination of configuration.mixedEmotionCombinations) {
    if (combination.length < 2 || combination.length > 3
      || new Set(combination).size !== combination.length
      || combination.some((emotion) => !configuration.enabledEmotions.includes(emotion))) {
      issues.push({ code: 'invalid-configuration', field: 'mixedEmotionCombinations' });
      break;
    }
  }
  for (const field of [
    'requiredPassagesPerDay', 'minimumCandidatesPerTuple', 'requiredGroundingFallbacks', 'replaySeeds',
  ] as const) {
    const value = configuration[field];
    if (!Number.isSafeInteger(value) || value <= 0) {
      issues.push({ code: 'invalid-configuration', field });
    }
  }
  if (configuration.dayMovementSequence.length !== configuration.requiredPassagesPerDay) {
    issues.push({ code: 'invalid-configuration', field: 'dayMovementSequence' });
  }
  return issues;
}

function isOrdinaryEligible(unit: EditorialUnit): boolean {
  return unit.status === 'approved'
    && unit.deliveryClass === 'mood-responsive'
    && !unit.difficultText;
}

function distinctPassageCount(units: readonly EditorialUnit[]): number {
  return new Set(units.map(({ passageId }) => passageId)).size;
}

function simulateDistinctDay(
  units: readonly EditorialUnit[],
  movementSequence: readonly ArcStage[],
  seed: number,
): boolean {
  const ordered = [...units].sort((left, right) => {
    const leftRank = deterministicRank(`${seed}:${left.id}:${left.version}`);
    const rightRank = deterministicRank(`${seed}:${right.id}:${right.version}`);
    return leftRank - rightRank || left.id.localeCompare(right.id);
  });
  const selected = new Set<string>();
  for (const movement of movementSequence) {
    const next = ordered.find((unit) => !selected.has(unit.passageId) && unit.movements.includes(movement));
    if (!next) return false;
    selected.add(next.passageId);
  }
  return true;
}

function intensityAssignments(emotions: readonly Emotion[]): Array<Array<{ emotion: Emotion; intensity: Intensity }>> {
  let assignments: Array<Array<{ emotion: Emotion; intensity: Intensity }>> = [[]];
  for (const emotion of emotions) {
    assignments = assignments.flatMap((assignment) => intensityValues.map((intensity) => [
      ...assignment, { emotion, intensity },
    ]));
  }
  return assignments;
}

function deterministicRank(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
