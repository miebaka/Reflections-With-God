import { describe, expect, it } from 'vitest';

import { proposeDirection } from './direction';

describe('healthy direction proposal', () => {
  it('begins difficult and mixed states with acknowledgement and grounding', () => {
    expect(proposeDirection({
      kind: 'known',
      selections: [
        { emotion: 'joyful', intensity: 'mild' },
        { emotion: 'sad', intensity: 'strong' },
      ],
    })).toEqual({ id: 'acknowledge-and-ground', requiresConfirmation: true });
  });

  it('sustains a wholly positive state through gratitude', () => {
    expect(proposeDirection({
      kind: 'known',
      selections: [{ emotion: 'joyful', intensity: 'moderate' }],
    })).toEqual({ id: 'sustain-with-gratitude', requiresConfirmation: true });
  });

  it('meets an unknown mood with gentle awareness', () => {
    expect(proposeDirection({ kind: 'unknown' })).toEqual({
      id: 'gentle-awareness',
      requiresConfirmation: true,
    });
  });
});
