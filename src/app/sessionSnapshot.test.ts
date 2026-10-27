import { describe, expect, it } from 'vitest';

import { confirmProposedDirection, selectUnknownMood } from './checkInViewModel';
import { initialAppSession, reduceAppSession } from './session';
import { createSessionSnapshot, restoreSessionSnapshot } from './sessionSnapshot';

const now = new Date(2026, 9, 27, 9, 15, 0, 0);

function activeSession() {
  let session = reduceAppSession(initialAppSession(), { type: 'attest-adult' });
  session = reduceAppSession(session, {
    type: 'update-draft',
    draft: confirmProposedDirection(selectUnknownMood(session.draft)),
  });
  return reduceAppSession(session, { type: 'confirm-direction', now });
}

describe('local session snapshots', () => {
  it('round-trips a same-day journey and restores Date instances', () => {
    const source = activeSession();
    const restored = restoreSessionSnapshot(createSessionSnapshot(source, now), new Date(2026, 9, 27, 12));

    expect(restored).toEqual(source);
    expect(restored?.journey?.startedAt).toBeInstanceOf(Date);
    expect(restored?.journey?.units[0]?.scheduledFor).toBeInstanceOf(Date);
  });

  it('contains structured state but no Scripture fixture body', () => {
    const raw = createSessionSnapshot(activeSession(), now);
    expect(raw).not.toContain('Come to me, all you who are weary');
    expect(raw).not.toContain('scriptureText');
  });

  it.each([
    ['unsupported schema', (value: any) => { value.schemaVersion = 2; }],
    ['malformed nested mood', (value: any) => { value.session.draft.checkIn = { kind: 'known', selections: [{ emotion: 'invented', intensity: 'strong' }] }; }],
    ['malformed unit timestamp', (value: any) => { value.session.journey.units[0].scheduledFor = 'yesterday-ish'; }],
  ])('rejects %s', (_label, mutate) => {
    const value = JSON.parse(createSessionSnapshot(activeSession(), now));
    mutate(value);
    expect(restoreSessionSnapshot(JSON.stringify(value), now)).toBeUndefined();
  });

  it('rejects corrupt JSON', () => {
    expect(restoreSessionSnapshot('{not-json', now)).toBeUndefined();
  });

  it('rejects a snapshot from another local calendar date', () => {
    const raw = createSessionSnapshot(activeSession(), now);
    expect(restoreSessionSnapshot(raw, new Date(2026, 9, 28, 7))).toBeUndefined();
  });

  it('rejects snapshots saved in the future', () => {
    const raw = createSessionSnapshot(activeSession(), now);
    expect(restoreSessionSnapshot(raw, new Date(2026, 9, 27, 9))).toBeUndefined();
  });

  it('rejects snapshots older than 24 hours even if a timezone shift preserves the date string', () => {
    const raw = createSessionSnapshot(activeSession(), now);
    const value = JSON.parse(raw);
    value.savedAt = '2026-10-25T08:00:00.000Z';
    value.localDate = '2026-10-27';
    expect(restoreSessionSnapshot(JSON.stringify(value), now)).toBeUndefined();
  });
});
