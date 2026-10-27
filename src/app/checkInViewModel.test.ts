import { describe, expect, it } from 'vitest';

import {
  canSubmitCheckIn,
  confirmProposedDirection,
  createCheckInDraft,
  selectUnknownMood,
  setDraftIntensity,
  toggleDraftEmotion,
} from './checkInViewModel';

describe('check-in view model', () => {
  it('retains an independent intensity for every selected emotion', () => {
    const draft = toggleDraftEmotion(
      toggleDraftEmotion(createCheckInDraft(), 'sad'),
      'tired',
    );
    expect(draft.checkIn).toEqual({
      kind: 'known',
      selections: [
        { emotion: 'sad', intensity: 'moderate' },
        { emotion: 'tired', intensity: 'moderate' },
      ],
    });
  });

  it('changes only the named emotion intensity', () => {
    const selected = toggleDraftEmotion(
      toggleDraftEmotion(createCheckInDraft(), 'sad'),
      'tired',
    );
    expect(setDraftIntensity(selected, 'tired', 'strong').checkIn).toEqual({
      kind: 'known',
      selections: [
        { emotion: 'sad', intensity: 'moderate' },
        { emotion: 'tired', intensity: 'strong' },
      ],
    });
  });

  it('clears emotion selections when the user chooses unknown', () => {
    const selected = toggleDraftEmotion(createCheckInDraft(), 'sad');
    expect(selectUnknownMood(selected).checkIn).toEqual({ kind: 'unknown' });
  });

  it('requires a valid mood and explicit direction confirmation before submission', () => {
    const empty = createCheckInDraft();
    const selected = toggleDraftEmotion(empty, 'joyful');
    const confirmed = confirmProposedDirection(selected);
    expect(canSubmitCheckIn(empty)).toBe(false);
    expect(canSubmitCheckIn(selected)).toBe(false);
    expect(canSubmitCheckIn(confirmed)).toBe(true);
  });

  it('requires direction confirmation for an unknown mood too', () => {
    const unknown = selectUnknownMood(createCheckInDraft());
    expect(canSubmitCheckIn(unknown)).toBe(false);
    expect(canSubmitCheckIn(confirmProposedDirection(unknown))).toBe(true);
  });
});
