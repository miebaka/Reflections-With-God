import type { MoodCheckIn } from './checkIn';

export type JourneyUnitState = 'scheduled' | 'available' | 'opened' | 'completed' | 'skipped' | 'superseded';
export type JourneyUnit = {
  id: string;
  scheduledFor: Date;
  state: JourneyUnitState;
  kind: 'opening' | 'scripture' | 'check-in' | 'closing';
};
export type DailyJourney = {
  localDate: string;
  startedAt: Date;
  initialCheckIn: MoodCheckIn;
  units: readonly JourneyUnit[];
};

const HALF_HOUR_MS = 30 * 60 * 1000;

export function nextHalfHour(date: Date): Date {
  const result = new Date(date);
  result.setSeconds(0, 0);
  if (result.getMinutes() < 30) result.setMinutes(30);
  else { result.setMinutes(0); result.setHours(result.getHours() + 1); }
  return result;
}

export function createDailyJourney(checkIn: MoodCheckIn, now: Date): DailyJourney {
  const end = new Date(now);
  end.setHours(22, 0, 0, 0);
  const units: JourneyUnit[] = [
    { id: `${localDate(now)}-opening`, scheduledFor: now, state: 'available', kind: 'opening' },
  ];
  for (let cursor = nextHalfHour(now); cursor < end; cursor = new Date(cursor.getTime() + HALF_HOUR_MS)) {
    const minutesSinceEight = (cursor.getHours() - 8) * 60 + cursor.getMinutes();
    const isCheckIn = minutesSinceEight > 0 && minutesSinceEight % 120 === 0;
    units.push({
      id: `${localDate(now)}-${cursor.getHours()}-${cursor.getMinutes()}`,
      scheduledFor: cursor,
      state: 'scheduled',
      kind: isCheckIn ? 'check-in' : 'scripture',
    });
  }
  if (now < end) units.push({ id: `${localDate(now)}-closing`, scheduledFor: end, state: 'scheduled', kind: 'closing' });
  return { localDate: localDate(now), startedAt: now, initialCheckIn: checkIn, units };
}

export function supersedeMissedUnits(units: readonly JourneyUnit[], currentTime: Date): readonly JourneyUnit[] {
  return units.map((unit) => unit.state === 'scheduled' && unit.scheduledFor < currentTime
    ? { ...unit, state: 'superseded' }
    : unit);
}

function localDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
