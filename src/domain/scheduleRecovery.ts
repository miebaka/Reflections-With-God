import { instantForLocalTime } from './notifications';
import { recoverMissedMoments, type DailyJourney, type JourneyUnit } from './journey';

export type TimezoneState = {
  selectedTimezone: string;
  confirmedScheduleTimezone: string;
  pendingTimezone?: string;
};

export type TimezoneObservation =
  | { status: 'unchanged'; state: TimezoneState }
  | { status: 'confirmation-required'; from: string; to: string; state: TimezoneState };

export type ScheduleRecoveryResult =
  | { status: 'reconciled'; journey: DailyJourney; timezone: TimezoneState }
  | { status: 'new-local-day-required'; journey: DailyJourney; timezone: TimezoneState };

export function observeTimezone(state: TimezoneState, observedTimezone: string): TimezoneObservation {
  assertTimezone(observedTimezone);
  if (observedTimezone === state.confirmedScheduleTimezone) {
    return { status: 'unchanged', state: withoutPending(state) };
  }
  return {
    status: 'confirmation-required',
    from: state.confirmedScheduleTimezone,
    to: observedTimezone,
    state: { ...state, pendingTimezone: observedTimezone },
  };
}

export function declineTimezoneChange(state: TimezoneState): TimezoneState {
  return withoutPending(state);
}

export function confirmTimezoneChange(
  journey: DailyJourney,
  state: TimezoneState,
  now: Date,
): ScheduleRecoveryResult {
  if (!state.pendingTimezone) throw new Error('No timezone change is awaiting confirmation.');
  if (Number.isNaN(now.getTime())) throw new Error('A valid recovery time is required.');
  const timezone = {
    selectedTimezone: state.pendingTimezone,
    confirmedScheduleTimezone: state.pendingTimezone,
  };
  if (localDateInTimezone(now, state.pendingTimezone) !== journey.localDate) {
    return { status: 'new-local-day-required', journey, timezone };
  }
  return {
    status: 'reconciled',
    journey: reconcileJourneyClock(rescheduleRemaining(journey, state.pendingTimezone, now), now),
    timezone,
  };
}

export function reconcileJourneyClock(journey: DailyJourney, now: Date): DailyJourney {
  if (Number.isNaN(now.getTime()) || journey.status === 'closed') return journey;
  const recovered = recoverMissedMoments(journey, now);
  const due = recovered.units
    .filter(({ kind, state, scheduledFor }) => kind === 'passage' && state === 'scheduled' && scheduledFor <= now)
    .sort((left, right) => right.scheduledFor.getTime() - left.scheduledFor.getTime())[0];
  if (!due) return recovered;
  return {
    ...recovered,
    units: recovered.units.map((unit) => unit.id === due.id ? { ...unit, state: 'available' as const } : unit),
  };
}

function rescheduleRemaining(journey: DailyJourney, timezone: string, now: Date): DailyJourney {
  return {
    ...journey,
    units: journey.units.map((unit) => rescheduleUnit(unit, journey.localDate, timezone, now)),
  };
}

function rescheduleUnit(unit: JourneyUnit, localDate: string, timezone: string, now: Date): JourneyUnit {
  if (unit.state !== 'scheduled' || unit.kind !== 'passage') return unit;
  const match = unit.id.match(/-(\d{1,2})-(\d{1,2})$/);
  if (!match) return unit;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const rescheduled = instantForLocalTime(localDate, { hour, minute }, timezone);
  if (!rescheduled || rescheduled <= now) return unit;
  return { ...unit, scheduledFor: rescheduled };
}

function localDateInTimezone(date: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).filter(({ type }) => type !== 'literal').map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function withoutPending(state: TimezoneState): TimezoneState {
  return {
    selectedTimezone: state.selectedTimezone,
    confirmedScheduleTimezone: state.confirmedScheduleTimezone,
  };
}

function assertTimezone(value: string): void {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format();
  } catch {
    throw new Error('A valid IANA timezone is required.');
  }
}
