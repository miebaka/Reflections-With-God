import { emotionOptions, validateCheckIn, type MoodCheckIn } from './checkIn';

export type EncounteredPassage = { contentId: string; reference: string };

export type DailyRecap = {
  schemaVersion: 1;
  id: string;
  localDate: string;
  createdAt: string;
  initialCheckIn: MoodCheckIn;
  finalCheckIn: MoodCheckIn;
  comparison: string;
  encounteredPassages: readonly EncounteredPassage[];
  stayedWithContentId?: string;
};

export function createDailyRecap(input: {
  id: string;
  localDate: string;
  createdAt: Date;
  initialCheckIn: MoodCheckIn;
  finalCheckIn: MoodCheckIn;
  encounteredPassages: readonly EncounteredPassage[];
  stayedWithContentId?: string;
}): DailyRecap {
  if (!/^rwg_[A-Za-z0-9_-]{22}$/.test(input.id) || Number.isNaN(input.createdAt.getTime())
    || !canonicalDay(input.localDate) || validateCheckIn(input.initialCheckIn).length > 0
    || validateCheckIn(input.finalCheckIn).length > 0) throw new Error('Recap input is invalid.');
  const passages = uniquePassages(input.encounteredPassages);
  if (input.stayedWithContentId !== undefined
    && !passages.some(({ contentId }) => contentId === input.stayedWithContentId)) {
    throw new Error('The passage that stayed with the user must have been encountered.');
  }
  return {
    schemaVersion: 1,
    id: input.id,
    localDate: input.localDate,
    createdAt: input.createdAt.toISOString(),
    initialCheckIn: copyMood(input.initialCheckIn),
    finalCheckIn: copyMood(input.finalCheckIn),
    comparison: neutralMoodComparison(input.initialCheckIn, input.finalCheckIn),
    encounteredPassages: passages,
    ...(input.stayedWithContentId ? { stayedWithContentId: input.stayedWithContentId } : {}),
  };
}

export function neutralMoodComparison(initial: MoodCheckIn, final: MoodCheckIn): string {
  const beginning = describeMood(initial);
  const ending = describeMood(final);
  return `You began the day ${beginning}. You closed it ${ending}. This records what you noticed; it does not grade the day or claim what caused a change.`;
}

export function assertDailyRecap(value: unknown): asserts value is DailyRecap {
  if (!isRecord(value) || !onlyKeys(value, [
    'schemaVersion', 'id', 'localDate', 'createdAt', 'initialCheckIn', 'finalCheckIn',
    'comparison', 'encounteredPassages', 'stayedWithContentId',
  ]) || value.schemaVersion !== 1 || typeof value.id !== 'string'
    || !/^rwg_[A-Za-z0-9_-]{22}$/.test(value.id) || typeof value.localDate !== 'string'
    || !canonicalDay(value.localDate) || typeof value.createdAt !== 'string'
    || !canonicalTimestamp(value.createdAt) || !isMood(value.initialCheckIn) || !isMood(value.finalCheckIn)
    || typeof value.comparison !== 'string' || !value.comparison.trim()
    || !Array.isArray(value.encounteredPassages)) throw new Error('Stored recap is invalid.');
  const passages = uniquePassages(value.encounteredPassages);
  if (passages.length !== value.encounteredPassages.length
    || (value.stayedWithContentId !== undefined && (typeof value.stayedWithContentId !== 'string'
      || !passages.some(({ contentId }) => contentId === value.stayedWithContentId)))) {
    throw new Error('Stored recap is invalid.');
  }
}

function uniquePassages(value: readonly unknown[]): EncounteredPassage[] {
  const result: EncounteredPassage[] = [];
  for (const item of value) {
    if (!isRecord(item) || !onlyKeys(item, ['contentId', 'reference'])
      || typeof item.contentId !== 'string' || !item.contentId.trim()
      || typeof item.reference !== 'string' || !item.reference.trim()) throw new Error('Recap passage is invalid.');
    if (!result.some(({ contentId }) => contentId === item.contentId)) {
      result.push({ contentId: item.contentId, reference: item.reference });
    }
  }
  return result;
}

function describeMood(mood: MoodCheckIn): string {
  if (mood.kind === 'unknown') return 'without forcing an emotion label';
  return `noticing ${mood.selections.map(({ emotion, intensity }) => `${emotion} (${intensity})`).join(', ')}`;
}

function copyMood(mood: MoodCheckIn): MoodCheckIn {
  return mood.kind === 'unknown' ? { kind: 'unknown' } : {
    kind: 'known', selections: mood.selections.map((selection) => ({ ...selection })),
  };
}

function isMood(value: unknown): value is MoodCheckIn {
  if (!isRecord(value)) return false;
  if (value.kind === 'unknown') return onlyKeys(value, ['kind']);
  if (value.kind !== 'known' || !Array.isArray(value.selections) || !onlyKeys(value, ['kind', 'selections'])) return false;
  const mood = { kind: 'known' as const, selections: value.selections } as MoodCheckIn;
  return validateCheckIn(mood).length === 0 && value.selections.every((item) => (
    isRecord(item) && onlyKeys(item, ['emotion', 'intensity'])
    && emotionOptions.includes(item.emotion as never)
    && ['mild', 'moderate', 'strong'].includes(item.intensity as string)
  ));
}

function canonicalDay(value: string): boolean {
  const date = new Date(`${value}T00:00:00.000Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(date.getTime())
    && date.toISOString().slice(0, 10) === value;
}

function canonicalTimestamp(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

function onlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
