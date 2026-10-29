import { describe, expect, it } from 'vitest';
import { assertDailyRecap, createDailyRecap, neutralMoodComparison } from './recap';

const initial = { kind: 'known' as const, selections: [{ emotion: 'sad' as const, intensity: 'strong' as const }] };
const final = { kind: 'known' as const, selections: [{ emotion: 'peaceful' as const, intensity: 'mild' as const }] };

describe('daily recap', () => {
  it('compares confirmed states neutrally without claiming Scripture caused change', () => {
    const comparison = neutralMoodComparison(initial, final);
    expect(comparison).toContain('sad (strong)');
    expect(comparison).toContain('peaceful (mild)');
    expect(comparison).toContain('does not grade');
    expect(comparison).not.toMatch(/Scripture (changed|fixed|caused)|because of Scripture/i);
  });

  it('keeps only unique encountered passages and accepts an explicit stayed-with choice', () => {
    const recap = createDailyRecap({
      id: 'rwg_AQIDBAUGBwgJCgsMDQ4PEA', localDate: '2026-10-29',
      createdAt: new Date('2026-10-29T22:00:00.000Z'), initialCheckIn: initial, finalCheckIn: final,
      encounteredPassages: [
        { contentId: 'unit-1', reference: 'Psalm 46:10' },
        { contentId: 'unit-1', reference: 'Psalm 46:10' },
      ],
      stayedWithContentId: 'unit-1',
    });
    expect(recap.encounteredPassages).toEqual([{ contentId: 'unit-1', reference: 'Psalm 46:10' }]);
    expect(recap.stayedWithContentId).toBe('unit-1');
  });

  it('never infers a stayed-with passage that was not explicitly encountered', () => {
    expect(() => createDailyRecap({
      id: 'rwg_AQIDBAUGBwgJCgsMDQ4PEA', localDate: '2026-10-29',
      createdAt: new Date('2026-10-29T22:00:00.000Z'), initialCheckIn: initial, finalCheckIn: final,
      encounteredPassages: [], stayedWithContentId: 'unit-1',
    })).toThrow('must have been encountered');
  });

  it('rejects unsupported mood vocabulary when encrypted history is decoded', () => {
    const stored = createDailyRecap({
      id: 'rwg_AQIDBAUGBwgJCgsMDQ4PEA', localDate: '2026-10-29',
      createdAt: new Date('2026-10-29T22:00:00.000Z'), initialCheckIn: initial, finalCheckIn: final,
      encounteredPassages: [],
    });
    expect(() => assertDailyRecap({
      ...stored, finalCheckIn: { kind: 'known', selections: [{ emotion: 'invented', intensity: 'strong' }] },
    })).toThrow('invalid');
  });
});
