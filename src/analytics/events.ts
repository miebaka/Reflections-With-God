export type AnalyticsEvent = {
  schemaVersion: 1;
  pseudonymousId: string;
  day: string;
  hourBucket: 0 | 6 | 12 | 18;
} & (
  | { type: 'day-started' }
  | { type: 'unit-opened'; contentId: string }
  | { type: 'fit-feedback'; contentId: string; fit: 'fits' | 'not-for-me'; reason?: AnalyticsFitReason }
  | { type: 'notification-mode-changed'; mode: 'gentle' | 'rhythm' | 'companion' | 'silent' }
  | { type: 'comprehension-responded'; answered: boolean; clarity?: 'clear' | 'unsure' | 'confusing' }
  | { type: 'deletion-status'; status: 'requested' | 'confirmed' | 'failed' }
);

export type AnalyticsFitReason =
  | 'wrong-emotion' | 'wrong-tone' | 'confusing-context'
  | 'theological-concern' | 'repetition' | 'other';

const common = ['schemaVersion', 'pseudonymousId', 'day', 'hourBucket', 'type'] as const;

export function encodeAnalyticsEvent(value: unknown): string {
  assertAnalyticsEvent(value);
  return JSON.stringify(value);
}

export function assertAnalyticsEvent(value: unknown): asserts value is AnalyticsEvent {
  if (!isRecord(value) || value.schemaVersion !== 1 || !/^[A-Za-z0-9_-]{16,80}$/.test(`${value.pseudonymousId ?? ''}`)
    || typeof value.day !== 'string' || !canonicalDay(value.day)
    || ![0, 6, 12, 18].includes(value.hourBucket as number) || typeof value.type !== 'string') {
    throw new Error('Analytics event metadata is invalid.');
  }
  switch (value.type) {
    case 'day-started':
      assertOnlyKeys(value, common);
      return;
    case 'unit-opened':
      assertOnlyKeys(value, [...common, 'contentId']);
      assertContentId(value.contentId);
      return;
    case 'fit-feedback':
      assertOnlyKeys(value, [...common, 'contentId', 'fit', 'reason']);
      assertContentId(value.contentId);
      if (!['fits', 'not-for-me'].includes(value.fit as string)
        || (value.reason !== undefined && !['wrong-emotion', 'wrong-tone', 'confusing-context',
          'theological-concern', 'repetition', 'other'].includes(value.reason as string))) invalid();
      return;
    case 'notification-mode-changed':
      assertOnlyKeys(value, [...common, 'mode']);
      if (!['gentle', 'rhythm', 'companion', 'silent'].includes(value.mode as string)) invalid();
      return;
    case 'comprehension-responded':
      assertOnlyKeys(value, [...common, 'answered', 'clarity']);
      if (typeof value.answered !== 'boolean'
        || (value.clarity !== undefined && !['clear', 'unsure', 'confusing'].includes(value.clarity as string))) invalid();
      return;
    case 'deletion-status':
      assertOnlyKeys(value, [...common, 'status']);
      if (!['requested', 'confirmed', 'failed'].includes(value.status as string)) invalid();
      return;
    default:
      throw new Error('Analytics event type is not allow-listed.');
  }
}

export function coarseHourBucket(date: Date): 0 | 6 | 12 | 18 {
  if (Number.isNaN(date.getTime())) throw new Error('A valid analytics time is required.');
  const hour = date.getUTCHours();
  return hour < 6 ? 0 : hour < 12 ? 6 : hour < 18 ? 12 : 18;
}

function assertOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): void {
  if (Object.keys(value).some((key) => !keys.includes(key))) invalid();
}

function assertContentId(value: unknown): void {
  if (typeof value !== 'string' || !/^[A-Za-z0-9._:-]{3,100}$/.test(value)) invalid();
}

function canonicalDay(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function invalid(): never {
  throw new Error('Analytics event contains unsupported or invalid data.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
