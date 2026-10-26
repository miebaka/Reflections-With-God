import { describe, expect, it } from 'vitest';
import { createDailyJourney, nextHalfHour, supersedeMissedUnits } from './journey';

describe('daily journey', () => {
  it('rounds forward to the next half-hour boundary', () => {
    expect(nextHalfHour(new Date(2026, 9, 26, 8, 12))).toEqual(new Date(2026, 9, 26, 8, 30));
    expect(nextHalfHour(new Date(2026, 9, 26, 8, 42))).toEqual(new Date(2026, 9, 26, 9, 0));
  });
  it('creates 29 moments for an 8 a.m. start including opening and closing', () => {
    const journey = createDailyJourney({ kind: 'unknown' }, new Date(2026, 9, 26, 8, 0));
    expect(journey.units).toHaveLength(29);
    expect(journey.units.filter((unit) => unit.kind === 'check-in')).toHaveLength(6);
    expect(journey.units.at(-1)?.scheduledFor).toEqual(new Date(2026, 9, 26, 22, 0));
  });
  it('starts late without backfilling every missed moment', () => {
    const journey = createDailyJourney({ kind: 'unknown' }, new Date(2026, 9, 26, 11, 10));
    expect(journey.units[0]?.state).toBe('available');
    expect(journey.units[1]?.scheduledFor).toEqual(new Date(2026, 9, 26, 11, 30));
  });
  it('supersedes only unopened scheduled moments', () => {
    const journey = createDailyJourney({ kind: 'unknown' }, new Date(2026, 9, 26, 8, 0));
    const result = supersedeMissedUnits(journey.units, new Date(2026, 9, 26, 9, 10));
    expect(result.find((unit) => unit.scheduledFor.getHours() === 8 && unit.scheduledFor.getMinutes() === 30)?.state).toBe('superseded');
    expect(result[0]?.state).toBe('available');
  });
});
