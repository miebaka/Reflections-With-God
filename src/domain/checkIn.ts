export const emotionOptions = [
  'grateful', 'joyful', 'peaceful', 'hopeful', 'sad',
  'anxious', 'angry', 'lonely', 'tired', 'overwhelmed',
] as const;

export type Emotion = (typeof emotionOptions)[number];
export type Intensity = 'mild' | 'moderate' | 'strong';
export type EmotionSelection = { emotion: Emotion; intensity: Intensity };
export type KnownMood = { kind: 'known'; selections: readonly EmotionSelection[]; cause?: string };
export type UnknownMood = { kind: 'unknown' };
export type MoodCheckIn = KnownMood | UnknownMood;
export type CheckInError = 'choose-between-one-and-three-emotions' | 'duplicate-emotion';

export function validateCheckIn(checkIn: MoodCheckIn): readonly CheckInError[] {
  if (checkIn.kind === 'unknown') return [];
  const errors: CheckInError[] = [];
  if (checkIn.selections.length < 1 || checkIn.selections.length > 3) {
    errors.push('choose-between-one-and-three-emotions');
  }
  const distinctEmotions = new Set(checkIn.selections.map(({ emotion }) => emotion));
  if (distinctEmotions.size !== checkIn.selections.length) errors.push('duplicate-emotion');
  return errors;
}

export function toggleEmotionSelection(
  current: readonly EmotionSelection[],
  emotion: Emotion,
  defaultIntensity: Intensity = 'moderate',
  maximum = 3,
): readonly EmotionSelection[] {
  if (current.some((item) => item.emotion === emotion)) {
    return current.filter((item) => item.emotion !== emotion);
  }
  if (current.length >= maximum) return current;
  return [...current, { emotion, intensity: defaultIntensity }];
}

export function updateEmotionIntensity(
  current: readonly EmotionSelection[],
  emotion: Emotion,
  intensity: Intensity,
): readonly EmotionSelection[] {
  return current.map((item) => item.emotion === emotion ? { ...item, intensity } : item);
}
