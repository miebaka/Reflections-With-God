import { createEmotionalArc } from '../domain/arc';
import { createDailyJourney, type DailyJourney } from '../domain/journey';
import {
  canSubmitCheckIn,
  createCheckInDraft,
  type CheckInDraft,
} from './checkInViewModel';

export type AppScreen = 'welcome' | 'check-in' | 'direction' | 'journey' | 'day-closed';

export type AppSession = {
  screen: AppScreen;
  adultAttested: boolean;
  draft: CheckInDraft;
  journey?: DailyJourney;
};

export type AppEvent =
  | { type: 'attest-adult' }
  | { type: 'update-draft'; draft: CheckInDraft }
  | { type: 'show-direction' }
  | { type: 'show-check-in' }
  | { type: 'confirm-direction'; now: Date }
  | { type: 'reset-session' };

export function initialAppSession(): AppSession {
  return { screen: 'welcome', adultAttested: false, draft: createCheckInDraft() };
}

export function reduceAppSession(session: AppSession, event: AppEvent): AppSession {
  if (event.type === 'reset-session') return initialAppSession();
  if (event.type === 'attest-adult') {
    if (session.adultAttested) return session;
    return { ...session, adultAttested: true, screen: 'check-in' };
  }
  if (!session.adultAttested) return session;

  if (event.type === 'update-draft') {
    if (session.journey) return session;
    return { ...session, draft: event.draft };
  }
  if (event.type === 'show-direction') {
    if (!session.draft.proposedDirection || session.journey) return session;
    return { ...session, screen: 'direction' };
  }
  if (event.type === 'show-check-in') {
    if (session.journey) return session;
    return { ...session, screen: 'check-in' };
  }
  if (session.journey || !canSubmitCheckIn(session.draft) || !session.draft.confirmedDirection) {
    return session;
  }

  const journey = createDailyJourney(
    session.draft.checkIn,
    createEmotionalArc(session.draft.checkIn, session.draft.confirmedDirection),
    event.now,
  );
  return { ...session, journey, screen: journey.status === 'closed' ? 'day-closed' : 'journey' };
}
