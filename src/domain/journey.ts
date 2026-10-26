import type { MoodCheckIn } from './checkIn';
import type { EmotionalArc } from './arc';

export type JourneyUnitState = 'scheduled' | 'available' | 'opened' | 'completed' | 'skipped' | 'superseded';
export type JourneyUnit = {
  id: string;
  scheduledFor: Date;
  state: JourneyUnitState;
  kind: 'passage' | 'catch-up';
  checkInOpportunity: boolean;
  reservedContentId?: string;
};
export type SupersessionReason = 'catch-up' | 'schedule-recovery' | 'check-in-recalculation';
export type SupersessionRecord = { unitId: string; at: Date; reason: SupersessionReason };
export type DailyJourney = {
  status: 'active' | 'closed';
  localDate: string;
  startedAt: Date;
  initialCheckIn: MoodCheckIn;
  currentCheckIn: MoodCheckIn;
  arc: EmotionalArc;
  units: readonly JourneyUnit[];
  supersessions: readonly SupersessionRecord[];
};

export type JourneyEvent =
  | { type: 'make-available' | 'open' | 'complete' | 'skip'; unitId: string }
  | { type: 'supersede'; unitId: string; at: Date; reason: SupersessionReason };

const HALF_HOUR_MS = 30 * 60 * 1000;

export function nextHalfHour(date: Date): Date {
  const result = new Date(date);
  result.setSeconds(0, 0);
  if (result.getMinutes() < 30) result.setMinutes(30);
  else { result.setMinutes(0); result.setHours(result.getHours() + 1); }
  return result;
}

export function createDailyJourney(checkIn: MoodCheckIn, arc: EmotionalArc, now: Date): DailyJourney {
  const end = new Date(now);
  end.setHours(22, 0, 0, 0);

  const base = {
    localDate: localDate(now), startedAt: now, initialCheckIn: checkIn, currentCheckIn: checkIn,
    arc, supersessions: [] as readonly SupersessionRecord[],
  };
  if (now >= end) return { ...base, status: 'closed', units: [] };

  const dayStart = new Date(now);
  dayStart.setHours(8, 0, 0, 0);
  const late = now > dayStart;
  const firstMoment = late ? now : dayStart;
  const units: JourneyUnit[] = [makeUnit(`${localDate(now)}-opening`, firstMoment, 'available', 'passage')];
  if (late) {
    units.push(makeUnit(`${localDate(now)}-catch-up`, now, 'available', 'catch-up'));
  }

  for (let cursor = late ? nextHalfHour(now) : new Date(dayStart.getTime() + HALF_HOUR_MS);
    cursor <= end;
    cursor = new Date(cursor.getTime() + HALF_HOUR_MS)) {
    units.push(makeUnit(`${localDate(now)}-${cursor.getHours()}-${cursor.getMinutes()}`, cursor, 'scheduled', 'passage'));
  }
  return { ...base, status: 'active', units };
}

export function advanceJourney(journey: DailyJourney, event: JourneyEvent): DailyJourney {
  const index = journey.units.findIndex(({ id }) => id === event.unitId);
  const current = journey.units[index];
  if (!current) return journey;

  const nextState = stateForEvent(event.type);
  if (!allowedTransitions[current.state].includes(nextState)) return journey;

  const units = journey.units.map((unit, unitIndex) => unitIndex === index ? { ...unit, state: nextState } : unit);
  const supersessions = event.type === 'supersede'
    ? [...journey.supersessions, { unitId: event.unitId, at: event.at, reason: event.reason }]
    : journey.supersessions;
  return { ...journey, units, supersessions };
}

export function applyOptionalCheckIn(
  journey: DailyJourney,
  checkIn: MoodCheckIn,
  arc: EmotionalArc,
  at: Date,
): DailyJourney {
  const units = journey.units.map((unit) => {
    if (unit.scheduledFor.getTime() === at.getTime() && unit.state === 'scheduled') {
      return { ...unit, state: 'available' as const };
    }
    if (unit.scheduledFor > at && unit.state === 'scheduled') return withoutReservation(unit);
    return unit;
  });
  return { ...journey, currentCheckIn: checkIn, arc, units };
}

const allowedTransitions: Record<JourneyUnitState, readonly JourneyUnitState[]> = {
  scheduled: ['available', 'superseded'], available: ['opened', 'skipped', 'superseded'],
  opened: ['completed', 'skipped'], completed: [], skipped: [], superseded: [],
};

function stateForEvent(type: JourneyEvent['type']): JourneyUnitState {
  const states: Record<JourneyEvent['type'], JourneyUnitState> = {
    'make-available': 'available', open: 'opened', complete: 'completed', skip: 'skipped', supersede: 'superseded',
  };
  return states[type];
}

function makeUnit(
  id: string,
  scheduledFor: Date,
  state: JourneyUnitState,
  kind: JourneyUnit['kind'],
): JourneyUnit {
  const minutesSinceEight = (scheduledFor.getHours() - 8) * 60 + scheduledFor.getMinutes();
  return { id, scheduledFor, state, kind, checkInOpportunity: kind === 'passage'
    && minutesSinceEight > 0 && minutesSinceEight < 14 * 60 && minutesSinceEight % 120 === 0 };
}

function withoutReservation(unit: JourneyUnit): JourneyUnit {
  const { reservedContentId: _removed, ...rest } = unit;
  return rest;
}

function localDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
