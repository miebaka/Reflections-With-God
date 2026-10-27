import { describe, expect, it } from 'vitest';

import { confirmProposedDirection, createCheckInDraft, toggleDraftEmotion } from './checkInViewModel';
import { getScreenModel } from './screenModel';
import { initialAppSession, reduceAppSession } from './session';

function sessionAt(now: Date) {
  const adult = reduceAppSession(initialAppSession(), { type: 'attest-adult' });
  const draft = confirmProposedDirection(toggleDraftEmotion(createCheckInDraft(), 'sad'));
  const ready = reduceAppSession(adult, { type: 'update-draft', draft });
  return reduceAppSession(ready, { type: 'confirm-direction', now });
}

describe('application screen model', () => {
  it('projects the complete adult check-in path into an active journey at 8 a.m.', () => {
    const now = new Date(2026, 9, 27, 8, 0);
    const model = getScreenModel(sessionAt(now), now);
    expect(model).toMatchObject({
      screen: 'journey',
      timeline: { status: 'active', current: { label: 'Scripture for this moment' } },
    });
  });

  it('projects a 10 p.m. start into a calm closed day without Scripture', () => {
    const now = new Date(2026, 9, 27, 22, 0);
    const model = getScreenModel(sessionAt(now), now);
    expect(model).toEqual({
      screen: 'day-closed',
      title: 'Today’s journey is closed.',
      message: 'Let the day end gently. You can begin again tomorrow without catching up.',
    });
    expect('scriptureUnit' in model).toBe(false);
  });

  it('closes an existing morning journey when the clock reaches 10 p.m.', () => {
    const morning = new Date(2026, 9, 27, 8, 0);
    expect(getScreenModel(sessionAt(morning), new Date(2026, 9, 27, 22, 0)))
      .toMatchObject({ screen: 'day-closed' });
  });

  it('waits without showing Scripture before the first 8 a.m. moment', () => {
    const now = new Date(2026, 9, 27, 7, 59);
    const model = getScreenModel(sessionAt(now), now);
    expect(model).toMatchObject({
      screen: 'journey',
      showScripture: false,
      timeline: { nextAvailableAt: new Date(2026, 9, 27, 8, 0) },
    });
    expect(model.screen === 'journey' ? model.timeline.current : 'wrong-screen').toBeUndefined();
  });

  it('surfaces a late-start catch-up and an optional check-in opportunity', () => {
    const late = new Date(2026, 9, 27, 12, 5);
    expect(getScreenModel(sessionAt(late), late)).toMatchObject({
      screen: 'journey',
      notices: ['A gentle catch-up'],
    });

    const boundary = new Date(2026, 9, 27, 10, 0);
    expect(getScreenModel(sessionAt(boundary), boundary)).toMatchObject({
      screen: 'journey',
      notices: expect.arrayContaining(['Optional check-in']),
    });
  });
});
