import { describe, expect, it } from 'vitest';

import { toggleEmotionSelection, updateEmotionIntensity, validateCheckIn } from './checkIn';

describe('confirmed mood check-in', () => {
  it('accepts an unknown mood without forcing a label', () => {
    expect(validateCheckIn({ kind: 'unknown' })).toEqual([]);
  });

  it('rejects repeated emotion selections', () => {
    expect(validateCheckIn({
      kind: 'known',
      selections: [
        { emotion: 'sad', intensity: 'strong' },
        { emotion: 'sad', intensity: 'mild' },
      ],
    })).toEqual(['duplicate-emotion']);
  });

  it('requires between one and three selections', () => {
    expect(validateCheckIn({ kind: 'known', selections: [] })).toEqual([
      'choose-between-one-and-three-emotions',
    ]);
  });

  it('does not add a fourth emotion', () => {
    const current = [
      { emotion: 'sad', intensity: 'strong' },
      { emotion: 'tired', intensity: 'moderate' },
      { emotion: 'lonely', intensity: 'mild' },
    ] as const;
    expect(toggleEmotionSelection(current, 'anxious')).toEqual(current);
  });

  it('updates only the selected emotion intensity', () => {
    const current = [
      { emotion: 'sad', intensity: 'strong' },
      { emotion: 'tired', intensity: 'mild' },
    ] as const;
    expect(updateEmotionIntensity(current, 'tired', 'moderate')).toEqual([
      { emotion: 'sad', intensity: 'strong' },
      { emotion: 'tired', intensity: 'moderate' },
    ]);
  });
});
