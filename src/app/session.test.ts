import { describe, expect, it } from 'vitest';

import { confirmProposedDirection, createCheckInDraft, toggleDraftEmotion } from './checkInViewModel';
import { initialAppSession, reduceAppSession } from './session';

function confirmedSadDraft() {
  return confirmProposedDirection(toggleDraftEmotion(createCheckInDraft(), 'sad'));
}

describe('application session reducer', () => {
  it('does not allow mood or journey events before adult attestation', () => {
    const initial = initialAppSession();
    const draft = confirmedSadDraft();
    expect(reduceAppSession(initial, { type: 'update-draft', draft })).toBe(initial);
    expect(reduceAppSession(initial, {
      type: 'confirm-direction', now: new Date(2026, 9, 27, 8, 0),
    })).toBe(initial);
  });

  it('moves an adult into the morning check-in', () => {
    expect(reduceAppSession(initialAppSession(), { type: 'attest-adult' }))
      .toMatchObject({ adultAttested: true, screen: 'check-in' });
  });

  it('creates one active journey from a confirmed valid draft', () => {
    const adult = reduceAppSession(initialAppSession(), { type: 'attest-adult' });
    const withDraft = reduceAppSession(adult, { type: 'update-draft', draft: confirmedSadDraft() });
    const started = reduceAppSession(withDraft, {
      type: 'confirm-direction', now: new Date(2026, 9, 27, 8, 0),
    });
    expect(started).toMatchObject({ screen: 'journey', journey: { status: 'active' } });
    expect(reduceAppSession(started, {
      type: 'confirm-direction', now: new Date(2026, 9, 27, 8, 1),
    })).toBe(started);
  });

  it('routes a journey started at 10 p.m. to the closed-day screen', () => {
    const adult = reduceAppSession(initialAppSession(), { type: 'attest-adult' });
    const withDraft = reduceAppSession(adult, { type: 'update-draft', draft: confirmedSadDraft() });
    expect(reduceAppSession(withDraft, {
      type: 'confirm-direction', now: new Date(2026, 9, 27, 22, 0),
    })).toMatchObject({ screen: 'day-closed', journey: { status: 'closed' } });
  });

  it('resets every in-memory private field', () => {
    const adult = reduceAppSession(initialAppSession(), { type: 'attest-adult' });
    const withDraft = reduceAppSession(adult, { type: 'update-draft', draft: confirmedSadDraft() });
    const started = reduceAppSession(withDraft, {
      type: 'confirm-direction', now: new Date(2026, 9, 27, 8, 0),
    });
    expect(reduceAppSession(started, { type: 'reset-session' })).toEqual(initialAppSession());
  });
});
