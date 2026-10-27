import type { DailyJourney, JourneyUnitState } from '../domain/journey';

export type TimelineItem = {
  id: string;
  kind: 'passage' | 'catch-up';
  state: Exclude<JourneyUnitState, 'scheduled' | 'superseded'>;
  label: string;
  scheduledFor: Date;
  checkInOpportunity: boolean;
  checkInLabel?: 'Optional check-in';
};

export type TimelineSummary =
  | { status: 'closed'; items: readonly [] }
  | {
    status: 'active';
    items: readonly TimelineItem[];
    current?: TimelineItem;
    nextAvailableAt?: Date;
  };

export function projectTimeline(journey: DailyJourney, now: Date): TimelineSummary {
  if (journey.status === 'closed') return { status: 'closed', items: [] };

  const items = journey.units
    .filter((unit) => unit.state !== 'scheduled' && unit.state !== 'superseded')
    .map((unit): TimelineItem => {
      const item: TimelineItem = {
        id: unit.id,
        kind: unit.kind,
        state: unit.state as TimelineItem['state'],
        label: unit.kind === 'catch-up' ? 'A gentle catch-up' : 'Scripture for this moment',
        scheduledFor: unit.scheduledFor,
        checkInOpportunity: unit.checkInOpportunity,
      };
      return unit.checkInOpportunity ? { ...item, checkInLabel: 'Optional check-in' } : item;
    });
  const current = items.find((item) => item.state === 'available');
  const next = journey.units
    .filter((unit) => unit.state === 'scheduled' && unit.scheduledFor > now)
    .sort((left, right) => left.scheduledFor.getTime() - right.scheduledFor.getTime())[0];

  return {
    status: 'active',
    items,
    ...(current ? { current } : {}),
    ...(next ? { nextAvailableAt: next.scheduledFor } : {}),
  };
}
