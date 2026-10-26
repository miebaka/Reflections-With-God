import { describe, expect, it } from 'vitest';

import { adaptEmotionalArc, createEmotionalArc } from './arc';

describe('emotional arc', () => {
  it('starts a difficult or mixed state by acknowledging it', () => {
    const arc = createEmotionalArc({
      kind: 'known',
      selections: [
        { emotion: 'joyful', intensity: 'mild' },
        { emotion: 'sad', intensity: 'strong' },
      ],
    }, 'acknowledge-and-ground');

    expect(arc.stages).toEqual([
      'acknowledge', 'hold', 'ground', 'comfort', 'encourage', 'consolidate', 'close',
    ]);
  });

  it('starts a wholly positive state with gratitude', () => {
    const arc = createEmotionalArc({
      kind: 'known',
      selections: [{ emotion: 'joyful', intensity: 'moderate' }],
    }, 'sustain-with-gratitude');

    expect(arc.stages).toEqual(['gratitude', 'worship', 'generosity', 'consolidate', 'close']);
  });

  it('starts an unknown state with gentle awareness', () => {
    const arc = createEmotionalArc({ kind: 'unknown' }, 'gentle-awareness');
    expect(arc.stages).toEqual(['awareness', 'stillness', 'ground', 'encourage', 'consolidate', 'close']);
  });

  it('slows future movement when the user feels worse', () => {
    const adapted = adaptEmotionalArc({ stages: ['encourage', 'consolidate', 'close'] }, 'worse');
    expect(adapted.stages).toEqual([
      'acknowledge', 'ground', 'comfort', 'encourage', 'consolidate', 'close',
    ]);
  });

  it('consolidates improvement without losing the closing stage', () => {
    const adapted = adaptEmotionalArc({
      stages: ['hold', 'ground', 'comfort', 'encourage', 'consolidate', 'close'],
    }, 'better');
    expect(adapted.stages).toEqual(['consolidate', 'close']);
  });

  it('leaves the remaining sequence unchanged when the state is unchanged', () => {
    const arc = { stages: ['ground', 'comfort', 'close'] } as const;
    expect(adaptEmotionalArc(arc, 'unchanged')).toEqual(arc);
  });
});
