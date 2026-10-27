import { describe, expect, it } from 'vitest';

import { createEmotionalArc } from './arc';
import { createDailyJourney } from './journey';
import {
  confirmTimezoneChange,
  declineTimezoneChange,
  observeTimezone,
  reconcileJourneyClock,
  type TimezoneState,
} from './scheduleRecovery';

const checkIn = { kind: 'unknown' as const };
const arc = createEmotionalArc(checkIn, 'gentle-awareness');
const lagos: TimezoneState = {
  selectedTimezone: 'Africa/Lagos', confirmedScheduleTimezone: 'Africa/Lagos',
};

describe('schedule and timezone recovery', () => {
  it('requires confirmation before changing a trusted schedule timezone', () => {
    const observation = observeTimezone(lagos, 'Europe/London');
    expect(observation).toMatchObject({ status: 'confirmation-required', from: 'Africa/Lagos', to: 'Europe/London' });
    expect(observation.state.confirmedScheduleTimezone).toBe('Africa/Lagos');
    expect(declineTimezoneChange(observation.state)).toEqual(lagos);
  });

  it('silently unlocks the latest due moment after a short restart', () => {
    const journey = createDailyJourney(checkIn, arc, new Date(2026, 9, 27, 8, 0));
    const recovered = reconcileJourneyClock(journey, new Date(2026, 9, 27, 8, 35));
    expect(recovered.units.find(({ id }) => id.endsWith('-8-30'))?.state).toBe('available');
  });

  it('collapses several elapsed moments into one catch-up without repeating recovery', () => {
    const journey = createDailyJourney(checkIn, arc, new Date(2026, 9, 27, 8, 0));
    const at = new Date(2026, 9, 27, 10, 5);
    const first = reconcileJourneyClock(journey, at);
    const second = reconcileJourneyClock(first, at);
    expect(first.units.filter(({ kind }) => kind === 'catch-up')).toHaveLength(1);
    expect(second).toEqual(first);
  });

  it('reschedules only unopened future wall-clock moments after confirmation', () => {
    const journey = createDailyJourney(checkIn, arc, new Date(2026, 9, 27, 8, 0));
    const pending = observeTimezone(lagos, 'Europe/London').state;
    const result = confirmTimezoneChange(journey, pending, new Date('2026-10-27T09:05:00.000Z'));
    expect(result.status).toBe('reconciled');
    if (result.status !== 'reconciled') return;
    expect(result.timezone.confirmedScheduleTimezone).toBe('Europe/London');
    expect(result.journey.units.find(({ id }) => id.endsWith('-10-30'))?.scheduledFor.toISOString())
      .toBe('2026-10-27T10:30:00.000Z');
  });

  it('does not relabel an existing journey when travel crosses the local calendar date', () => {
    const journey = createDailyJourney(checkIn, arc, new Date(2026, 9, 27, 8, 0));
    const pending = observeTimezone(lagos, 'Pacific/Auckland').state;
    const result = confirmTimezoneChange(journey, pending, new Date('2026-10-27T12:00:00.000Z'));
    expect(result.status).toBe('new-local-day-required');
    expect(result.journey).toBe(journey);
  });
});
