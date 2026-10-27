import { projectTimeline, type TimelineSummary } from './timeline';
import type { AppSession } from './session';

export type ScreenModel =
  | { screen: 'welcome' | 'check-in' | 'direction' }
  | {
    screen: 'journey';
    timeline: Extract<TimelineSummary, { status: 'active' }>;
    showScripture: boolean;
    notices: readonly string[];
  }
  | { screen: 'day-closed'; title: string; message: string };

export function getScreenModel(session: AppSession, now: Date): ScreenModel {
  if (session.screen === 'day-closed') {
    return {
      screen: 'day-closed',
      title: 'Today’s journey is closed.',
      message: 'Let the day end gently. You can begin again tomorrow without catching up.',
    };
  }
  if (session.screen === 'journey') {
    if (!session.journey) return { screen: 'welcome' };
    const closeAt = session.journey.units.reduce(
      (latest, unit) => unit.scheduledFor > latest ? unit.scheduledFor : latest,
      session.journey.startedAt,
    );
    if (now >= closeAt) {
      return {
        screen: 'day-closed',
        title: 'Today’s journey is closed.',
        message: 'Let the day end gently. You can begin again tomorrow without catching up.',
      };
    }
    const timeline = projectTimeline(session.journey, now);
    if (timeline.status === 'active') {
      const notices = [...new Set(timeline.items.flatMap((item) => [
        ...(item.kind === 'catch-up' ? [item.label] : []),
        ...(item.checkInLabel ? [item.checkInLabel] : []),
      ]))];
      return { screen: 'journey', timeline, showScripture: Boolean(timeline.current), notices };
    }
    return {
      screen: 'day-closed',
      title: 'Today’s journey is closed.',
      message: 'Let the day end gently. You can begin again tomorrow without catching up.',
    };
  }
  return { screen: session.screen };
}
