import { projectTimeline, type TimelineSummary } from './timeline';
import type { AppSession } from './session';

export type ScreenModel =
  | { screen: 'welcome' | 'check-in' | 'direction' }
  | { screen: 'journey'; timeline: Extract<TimelineSummary, { status: 'active' }> }
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
    const timeline = projectTimeline(session.journey, now);
    if (timeline.status === 'active') return { screen: 'journey', timeline };
    return {
      screen: 'day-closed',
      title: 'Today’s journey is closed.',
      message: 'Let the day end gently. You can begin again tomorrow without catching up.',
    };
  }
  return { screen: session.screen };
}
