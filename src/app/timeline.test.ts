import { describe, expect, it } from 'vitest';

import { createEmotionalArc } from '../domain/arc';
import { createDailyJourney, recoverMissedMoments } from '../domain/journey';
import { projectTimeline } from './timeline';

const mood = { kind: 'unknown' } as const;
const arc = createEmotionalArc(mood, 'gentle-awareness');

describe('calm timeline projection', () => {
  it('exposes the available passage and next scheduled time', () => {
    const journey = createDailyJourney(mood, arc, new Date(2026, 9, 27, 8, 0));
    const timeline = projectTimeline(journey, new Date(2026, 9, 27, 8, 5));
    expect(timeline).toMatchObject({
      status: 'active',
      current: { kind: 'passage', label: 'Scripture for this moment' },
      nextAvailableAt: new Date(2026, 9, 27, 8, 30),
    });
  });

  it('shows one calm catch-up and excludes superseded moments', () => {
    const journey = createDailyJourney(mood, arc, new Date(2026, 9, 27, 8, 0));
    const recovered = recoverMissedMoments(journey, new Date(2026, 9, 27, 12, 5));
    const timeline = projectTimeline(recovered, new Date(2026, 9, 27, 12, 5));
    const supersededIds = recovered.units
      .filter((unit) => unit.state === 'superseded')
      .map((unit) => unit.id);
    expect(timeline.items.filter((item) => item.kind === 'catch-up')).toHaveLength(1);
    expect(timeline.items.some((item) => supersededIds.includes(item.id))).toBe(false);
    expect(timeline.items.find((item) => item.kind === 'catch-up')?.label).toBe('A gentle catch-up');
  });

  it('describes check-ins as optional opportunities', () => {
    const journey = createDailyJourney(mood, arc, new Date(2026, 9, 27, 8, 0));
    const atTen = {
      ...journey,
      units: journey.units.map((unit) => unit.scheduledFor.getHours() === 10
        ? { ...unit, state: 'available' as const }
        : unit),
    };
    const item = projectTimeline(atTen, new Date(2026, 9, 27, 10, 0)).items
      .find((candidate) => candidate.checkInOpportunity);
    expect(item?.checkInLabel).toBe('Optional check-in');
  });

  it('returns a closed projection without an opening unit', () => {
    const journey = createDailyJourney(mood, arc, new Date(2026, 9, 27, 22, 0));
    expect(projectTimeline(journey, new Date(2026, 9, 27, 22, 0)))
      .toEqual({ status: 'closed', items: [] });
  });
});
