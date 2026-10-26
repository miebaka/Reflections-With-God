import { describe, expect, it } from 'vitest';
import { advanceJourney, applyOptionalCheckIn, createDailyJourney, nextHalfHour } from './journey';

const unknownMood = { kind: 'unknown' } as const;
const awarenessArc = { stages: ['awareness', 'stillness', 'ground', 'encourage', 'consolidate', 'close'] } as const;

describe('daily journey', () => {
  it('rounds forward to the next half-hour boundary', () => {
    expect(nextHalfHour(new Date(2026, 9, 26, 8, 12))).toEqual(new Date(2026, 9, 26, 8, 30));
    expect(nextHalfHour(new Date(2026, 9, 26, 8, 42))).toEqual(new Date(2026, 9, 26, 9, 0));
  });
  it('creates 29 moments for an 8 a.m. start including opening and closing', () => {
    const journey = createDailyJourney(unknownMood, awarenessArc, new Date(2026, 9, 26, 8, 0));
    expect(journey.status).toBe('active');
    expect(journey.units).toHaveLength(29);
    expect(journey.units.every((unit) => unit.kind === 'passage')).toBe(true);
    expect(journey.units.filter((unit) => unit.checkInOpportunity)).toHaveLength(6);
    expect(journey.units.at(-1)?.scheduledFor).toEqual(new Date(2026, 9, 26, 22, 0));
  });

  it('starts late with an opening, one catch-up, and the next half-hour boundary', () => {
    const journey = createDailyJourney(unknownMood, awarenessArc, new Date(2026, 9, 26, 11, 10));
    expect(journey.units[0]?.state).toBe('available');
    expect(journey.units[0]?.kind).toBe('passage');
    expect(journey.units[1]?.kind).toBe('catch-up');
    expect(journey.units[2]?.scheduledFor).toEqual(new Date(2026, 9, 26, 11, 30));
  });

  it('returns a closed journey when the day starts at 10 p.m. or later', () => {
    const journey = createDailyJourney(unknownMood, awarenessArc, new Date(2026, 9, 26, 22, 0));
    expect(journey).toMatchObject({ status: 'closed', units: [] });
  });

  it('enforces allowed unit state transitions without mutating invalid attempts', () => {
    const journey = createDailyJourney(unknownMood, awarenessArc, new Date(2026, 9, 26, 8, 0));
    const opened = advanceJourney(journey, { type: 'open', unitId: journey.units[0]!.id });
    expect(opened.units[0]?.state).toBe('opened');

    const invalid = advanceJourney(opened, { type: 'make-available', unitId: journey.units[0]!.id });
    expect(invalid).toBe(opened);
  });

  it('records only audit-safe fields when a unit is superseded', () => {
    const journey = createDailyJourney(unknownMood, awarenessArc, new Date(2026, 9, 26, 8, 0));
    const unit = journey.units[1]!;
    const result = advanceJourney(journey, {
      type: 'supersede', unitId: unit.id, at: new Date(2026, 9, 26, 9, 10), reason: 'catch-up',
    });
    expect(result.supersessions).toEqual([{
      unitId: unit.id, at: new Date(2026, 9, 26, 9, 10), reason: 'catch-up',
    }]);
    expect(Object.keys(result.supersessions[0]!).sort()).toEqual(['at', 'reason', 'unitId']);
  });

  it('preserves the unit available at a check-in boundary and clears future reservations', () => {
    const base = createDailyJourney(unknownMood, awarenessArc, new Date(2026, 9, 26, 8, 0));
    const withReservations = {
      ...base,
      units: base.units.map((unit) => ({ ...unit, reservedContentId: `reserved-${unit.id}` })),
    };
    const at = new Date(2026, 9, 26, 10, 0);
    const updated = applyOptionalCheckIn(withReservations, unknownMood, awarenessArc, at);
    const boundary = updated.units.find((unit) => unit.scheduledFor.getTime() === at.getTime());
    const future = updated.units.find((unit) => unit.scheduledFor > at);
    expect(boundary).toMatchObject({ state: 'available', reservedContentId: expect.any(String) });
    expect(future?.reservedContentId).toBeUndefined();
  });
});
