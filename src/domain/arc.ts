import type { MoodCheckIn } from './checkIn';
import type { HealthyDirection } from './direction';

export type ArcStage =
  | 'acknowledge'
  | 'hold'
  | 'awareness'
  | 'stillness'
  | 'ground'
  | 'comfort'
  | 'encourage'
  | 'gratitude'
  | 'worship'
  | 'generosity'
  | 'consolidate'
  | 'close';

export type EmotionalArc = { stages: readonly ArcStage[] };
export type MoodComparison = 'worse' | 'unchanged' | 'better';

const stagesByDirection: Record<HealthyDirection, readonly ArcStage[]> = {
  'acknowledge-and-ground': [
    'acknowledge', 'hold', 'ground', 'comfort', 'encourage', 'consolidate', 'close',
  ],
  'sustain-with-gratitude': ['gratitude', 'worship', 'generosity', 'consolidate', 'close'],
  'gentle-awareness': ['awareness', 'stillness', 'ground', 'encourage', 'consolidate', 'close'],
};

export function createEmotionalArc(
  _checkIn: MoodCheckIn,
  direction: HealthyDirection,
): EmotionalArc {
  return { stages: [...stagesByDirection[direction]] };
}

export function adaptEmotionalArc(
  arc: EmotionalArc,
  comparison: MoodComparison,
): EmotionalArc {
  if (comparison === 'unchanged') return arc;
  if (comparison === 'better') return { stages: ['consolidate', 'close'] };

  return {
    stages: ['acknowledge', 'ground', 'comfort', 'encourage', 'consolidate', 'close'],
  };
}
