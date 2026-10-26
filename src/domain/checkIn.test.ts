import { describe, expect, it } from 'vitest';
import { toggleEmotion, validateCheckIn } from './checkIn';

describe('mood check-in', () => {
  it('accepts an unknown mood without forcing a label', () => expect(validateCheckIn({ kind: 'unknown' })).toEqual([]));
  it('requires one to three distinct emotions', () => {
    expect(validateCheckIn({ kind: 'known', emotions: [], intensity: 'mild' })).toContain('choose-between-one-and-three-emotions');
    expect(validateCheckIn({ kind: 'known', emotions: ['sad', 'sad'], intensity: 'mild' })).toEqual([]);
  });
  it('never adds more than three emotions', () => {
    const current = ['sad', 'tired', 'lonely'] as const;
    expect(toggleEmotion(current, 'anxious')).toEqual(current);
    expect(toggleEmotion(current, 'sad')).toEqual(['tired', 'lonely']);
  });
});
