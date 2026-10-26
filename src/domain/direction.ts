import type { Emotion, MoodCheckIn } from './checkIn';

export type HealthyDirection =
  | 'acknowledge-and-ground'
  | 'sustain-with-gratitude'
  | 'gentle-awareness';

export type DirectionProposal = {
  id: HealthyDirection;
  requiresConfirmation: true;
};

const positiveEmotions: ReadonlySet<Emotion> = new Set([
  'grateful',
  'joyful',
  'peaceful',
  'hopeful',
]);

export function proposeDirection(checkIn: MoodCheckIn): DirectionProposal {
  if (checkIn.kind === 'unknown') {
    return { id: 'gentle-awareness', requiresConfirmation: true };
  }

  const isWhollyPositive = checkIn.selections.every(({ emotion }) => positiveEmotions.has(emotion));
  return {
    id: isWhollyPositive ? 'sustain-with-gratitude' : 'acknowledge-and-ground',
    requiresConfirmation: true,
  };
}
