import { describe, expect, it } from 'vitest';

import type { ArcStage } from '../domain/arc';
import type { Emotion, Intensity } from '../domain/checkIn';
import { simulateCoverage, type CoverageConfiguration } from './coverage';
import type { EditorialUnit } from './unit';

const stages: ArcStage[] = ['ground'];
const intensities: Intensity[] = ['mild', 'moderate', 'strong'];

function coverageUnit(index: number): EditorialUnit {
  return {
    id: `unit-${index}`, version: '1.0.0', passageId: `Psalm.${index + 1}.1`,
    reference: `Psalm ${index + 1}:1`, translationId: 'translation-1', scriptureText: 'text',
    context: 'context', reflectionPrompt: 'prompt', theologicalPurposes: ['purpose'],
    moodTags: ['anxious', 'sad'], intensities, movements: stages, contraindicatedEmotions: [],
    deliveryClass: 'mood-responsive', difficultText: false, groundingFallback: index < 20,
    prayerBlockIds: ['address', 'petition', 'closing'], status: 'approved',
    approvedAt: '2026-10-26T00:00:00.000Z', approvals: [], auditTrail: [],
  };
}

function configuration(overrides: Partial<CoverageConfiguration> = {}): CoverageConfiguration {
  return {
    enabledEmotions: ['anxious', 'sad'],
    applicableMovements: { anxious: stages, sad: stages },
    mixedEmotionCombinations: [['anxious', 'sad']],
    requiredPassagesPerDay: 29,
    minimumCandidatesPerTuple: 3,
    requiredGroundingFallbacks: 20,
    replaySeeds: 100,
    dayMovementSequence: Array.from({ length: 29 }, () => 'ground'),
    ...overrides,
  };
}

describe('editorial coverage simulation', () => {
  it('passes every configured single, tuple, fallback, mixed, and replay gate', () => {
    const report = simulateCoverage(Array.from({ length: 29 }, (_, index) => coverageUnit(index)), configuration());
    expect(report.passed).toBe(true);
    expect(report.issues).toEqual([]);
    expect(report.replayRuns).toBe(1_500);
  });

  it('counts distinct canonical passages rather than unit variants', () => {
    const units = Array.from({ length: 29 }, (_, index) => coverageUnit(index));
    units[28] = { ...units[28]!, passageId: units[27]!.passageId };
    const report = simulateCoverage(units, configuration());
    expect(report.issues).toEqual(expect.arrayContaining([
      { code: 'single-day-insufficient', field: 'anxious.mild', actual: 28, required: 29 },
      { code: 'single-day-insufficient', field: 'sad.strong', actual: 28, required: 29 },
    ]));
    expect(report.issues.some(({ code }) => code === 'replay-failed')).toBe(true);
  });

  it('requires three candidates for every emotion, intensity, and applicable movement tuple', () => {
    const units = Array.from({ length: 29 }, (_, index) => coverageUnit(index));
    for (const candidate of units.slice(2)) candidate.intensities = ['mild', 'moderate'];
    expect(simulateCoverage(units, configuration()).issues).toContainEqual({
      code: 'tuple-insufficient', field: 'anxious.strong.ground', actual: 2, required: 3,
    });
  });

  it('requires twenty distinct broadly appropriate grounding passages', () => {
    const units = Array.from({ length: 29 }, (_, index) => coverageUnit(index));
    units[19] = { ...units[19]!, passageId: units[18]!.passageId };
    expect(simulateCoverage(units, configuration()).issues).toContainEqual({
      code: 'fallback-insufficient', actual: 19, required: 20,
    });
  });

  it('does not count a grounding fallback that is contraindicated for an enabled emotion', () => {
    const units = Array.from({ length: 29 }, (_, index) => coverageUnit(index));
    units[19] = { ...units[19]!, contraindicatedEmotions: ['sad'] };
    expect(simulateCoverage(units, configuration()).issues).toContainEqual({
      code: 'fallback-insufficient', actual: 19, required: 20,
    });
  });

  it('excludes contraindicated content from mixed-emotion simulations', () => {
    const units = Array.from({ length: 29 }, (_, index) => ({
      ...coverageUnit(index), contraindicatedEmotions: ['sad' as Emotion],
    }));
    const report = simulateCoverage(units, configuration());
    expect(report.issues).toContainEqual({
      code: 'mixed-day-insufficient', field: 'anxious+sad', actual: 0, required: 29,
    });
  });

  it('does not count draft, structured-study, or difficult-text units', () => {
    const units = Array.from({ length: 32 }, (_, index) => coverageUnit(index));
    units[29] = { ...units[29]!, status: 'draft' };
    units[30] = { ...units[30]!, deliveryClass: 'structured-study' };
    units[31] = { ...units[31]!, difficultText: true };
    expect(simulateCoverage(units, configuration()).passed).toBe(true);

    expect(simulateCoverage(units.slice(3), configuration()).issues)
      .toContainEqual({ code: 'single-day-insufficient', field: 'anxious.mild', actual: 26, required: 29 });
  });

  it('rejects incomplete or nonsensical simulator configuration', () => {
    const report = simulateCoverage([], configuration({
      replaySeeds: 0, enabledEmotions: [], dayMovementSequence: [],
    }));
    expect(report.issues).toEqual(expect.arrayContaining([
      { code: 'invalid-configuration', field: 'enabledEmotions' },
      { code: 'invalid-configuration', field: 'replaySeeds' },
      { code: 'invalid-configuration', field: 'dayMovementSequence' },
    ]));
    expect(report.replayRuns).toBe(0);
  });

  it('requires an explicit movement contract for every enabled emotion', () => {
    const report = simulateCoverage([], configuration({ applicableMovements: { anxious: [] } }));
    expect(report.issues).toEqual(expect.arrayContaining([
      { code: 'invalid-configuration', field: 'applicableMovements.anxious' },
      { code: 'invalid-configuration', field: 'applicableMovements.sad' },
    ]));
    expect(report.replayRuns).toBe(0);
  });
});
