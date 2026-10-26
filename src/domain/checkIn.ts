export const emotionOptions = [
  'grateful', 'joyful', 'peaceful', 'hopeful', 'sad',
  'anxious', 'angry', 'lonely', 'tired', 'overwhelmed',
] as const;

export type Emotion = (typeof emotionOptions)[number];
export type Intensity = 'mild' | 'moderate' | 'strong';
export type KnownMood = { kind: 'known'; emotions: readonly Emotion[]; intensity: Intensity; cause?: string };
export type UnknownMood = { kind: 'unknown' };
export type MoodCheckIn = KnownMood | UnknownMood;
export type CheckInError = 'choose-between-one-and-three-emotions' | 'intensity-required';

export function validateCheckIn(checkIn: MoodCheckIn): readonly CheckInError[] {
  if (checkIn.kind === 'unknown') return [];
  const errors: CheckInError[] = [];
  const distinctEmotions = new Set(checkIn.emotions);
  if (distinctEmotions.size < 1 || distinctEmotions.size > 3) errors.push('choose-between-one-and-three-emotions');
  if (!checkIn.intensity) errors.push('intensity-required');
  return errors;
}

export function toggleEmotion(current: readonly Emotion[], emotion: Emotion, maximum = 3): readonly Emotion[] {
  if (current.includes(emotion)) return current.filter((item) => item !== emotion);
  if (current.length >= maximum) return current;
  return [...current, emotion];
}
