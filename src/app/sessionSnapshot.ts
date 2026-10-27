import { emotionOptions, validateCheckIn, type EmotionSelection, type MoodCheckIn } from '../domain/checkIn';
import type { DailyJourney, JourneyUnit, JourneyUnitState, SupersessionRecord } from '../domain/journey';
import type { ArcStage } from '../domain/arc';
import type { HealthyDirection } from '../domain/direction';
import type { CheckInDraft } from './checkInViewModel';
import type { AppScreen, AppSession } from './session';

const SNAPSHOT_SCHEMA_VERSION = 1;
const MAX_SESSION_AGE_MS = 24 * 60 * 60 * 1000;

const screens: readonly AppScreen[] = ['welcome', 'check-in', 'direction', 'journey', 'day-closed'];
const directions: readonly HealthyDirection[] = [
  'acknowledge-and-ground', 'sustain-with-gratitude', 'gentle-awareness',
];
const intensities = ['mild', 'moderate', 'strong'] as const;
const unitStates: readonly JourneyUnitState[] = [
  'scheduled', 'available', 'opened', 'completed', 'skipped', 'superseded',
];
const arcStages: readonly ArcStage[] = [
  'acknowledge', 'hold', 'awareness', 'stillness', 'ground', 'comfort', 'encourage',
  'gratitude', 'worship', 'generosity', 'consolidate', 'close',
];
const supersessionReasons: readonly SupersessionRecord['reason'][] = [
  'catch-up', 'schedule-recovery', 'check-in-recalculation',
];

type JsonJourneyUnit = Omit<JourneyUnit, 'scheduledFor'> & { scheduledFor: string };
type JsonSupersession = Omit<SupersessionRecord, 'at'> & { at: string };
type JsonJourney = Omit<DailyJourney, 'startedAt' | 'units' | 'supersessions'> & {
  startedAt: string;
  units: JsonJourneyUnit[];
  supersessions: JsonSupersession[];
};
type JsonSession = Omit<AppSession, 'journey'> & { journey?: JsonJourney };

type SessionSnapshot = {
  schemaVersion: typeof SNAPSHOT_SCHEMA_VERSION;
  savedAt: string;
  localDate: string;
  session: JsonSession;
};

export function createSessionSnapshot(session: AppSession, now: Date): string {
  if (Number.isNaN(now.getTime())) throw new Error('A valid snapshot time is required.');
  const snapshot: SessionSnapshot = {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    savedAt: now.toISOString(),
    localDate: toLocalDate(now),
    session: encodeSession(session),
  };
  return JSON.stringify(snapshot);
}

export function restoreSessionSnapshot(raw: string, now: Date): AppSession | undefined {
  if (Number.isNaN(now.getTime())) return undefined;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return undefined;
  }
  if (!isRecord(value) || value.schemaVersion !== SNAPSHOT_SCHEMA_VERSION
    || !isCanonicalTimestamp(value.savedAt) || typeof value.localDate !== 'string'
    || !isRecord(value.session)) return undefined;

  const savedAt = new Date(value.savedAt);
  if (savedAt > now || now.getTime() - savedAt.getTime() > MAX_SESSION_AGE_MS) return undefined;
  if (value.localDate !== toLocalDate(now) || value.localDate !== toLocalDate(savedAt)) return undefined;
  return decodeSession(value.session, value.localDate);
}

function encodeSession(session: AppSession): JsonSession {
  return {
    screen: session.screen,
    adultAttested: session.adultAttested,
    draft: encodeDraft(session.draft),
    ...(session.journey ? { journey: {
      ...session.journey,
      initialCheckIn: encodeMood(session.journey.initialCheckIn),
      currentCheckIn: encodeMood(session.journey.currentCheckIn),
      startedAt: session.journey.startedAt.toISOString(),
      units: session.journey.units.map((unit) => ({
        ...unit, scheduledFor: unit.scheduledFor.toISOString(),
      })),
      supersessions: session.journey.supersessions.map((item) => ({
        ...item, at: item.at.toISOString(),
      })),
    } } : {}),
  };
}

function encodeDraft(draft: CheckInDraft): CheckInDraft {
  return { ...draft, checkIn: encodeMood(draft.checkIn) };
}

function encodeMood(checkIn: MoodCheckIn): MoodCheckIn {
  if (checkIn.kind === 'unknown') return { kind: 'unknown' };
  return { kind: 'known', selections: checkIn.selections.map((item) => ({ ...item })) };
}

function decodeSession(value: Record<string, unknown>, expectedLocalDate: string): AppSession | undefined {
  if (!isOneOf(value.screen, screens) || typeof value.adultAttested !== 'boolean'
    || !isRecord(value.draft)) return undefined;
  const draft = decodeDraft(value.draft);
  if (!draft) return undefined;

  const journey = value.journey === undefined ? undefined : decodeJourney(value.journey, expectedLocalDate);
  if (value.journey !== undefined && !journey) return undefined;
  if ((value.screen === 'journey' || value.screen === 'day-closed') !== Boolean(journey)) return undefined;
  if (!value.adultAttested && value.screen !== 'welcome') return undefined;
  return { screen: value.screen, adultAttested: value.adultAttested, draft, ...(journey ? { journey } : {}) };
}

function decodeDraft(value: Record<string, unknown>): CheckInDraft | undefined {
  const checkIn = decodeMood(value.checkIn);
  if (!checkIn || !isOptionalOneOf(value.proposedDirection, directions)
    || !isOptionalOneOf(value.confirmedDirection, directions)) return undefined;
  if (value.confirmedDirection !== undefined && value.confirmedDirection !== value.proposedDirection) return undefined;
  return {
    checkIn,
    ...(value.proposedDirection ? { proposedDirection: value.proposedDirection } : {}),
    ...(value.confirmedDirection ? { confirmedDirection: value.confirmedDirection } : {}),
  };
}

function decodeMood(value: unknown): MoodCheckIn | undefined {
  if (!isRecord(value)) return undefined;
  if (value.kind === 'unknown') return { kind: 'unknown' };
  if (value.kind !== 'known' || !Array.isArray(value.selections)) return undefined;
  const selections: EmotionSelection[] = [];
  for (const item of value.selections) {
    if (!isRecord(item) || !isOneOf(item.emotion, emotionOptions)
      || !isOneOf(item.intensity, intensities)) return undefined;
    selections.push({ emotion: item.emotion, intensity: item.intensity });
  }
  const checkIn: MoodCheckIn = { kind: 'known', selections };
  return validateCheckIn(checkIn).length === 0 || selections.length === 0 ? checkIn : undefined;
}

function decodeJourney(value: unknown, expectedLocalDate: string): DailyJourney | undefined {
  if (!isRecord(value) || (value.status !== 'active' && value.status !== 'closed')
    || value.localDate !== expectedLocalDate || !isCanonicalTimestamp(value.startedAt)
    || !isRecord(value.arc) || !Array.isArray(value.arc.stages)
    || !value.arc.stages.every((stage) => isOneOf(stage, arcStages))
    || !Array.isArray(value.units) || !Array.isArray(value.supersessions)) return undefined;
  const initialCheckIn = decodeMood(value.initialCheckIn);
  const currentCheckIn = decodeMood(value.currentCheckIn);
  if (!initialCheckIn || !currentCheckIn) return undefined;

  const units = value.units.map(decodeUnit);
  const supersessions = value.supersessions.map(decodeSupersession);
  if (units.some((unit) => !unit) || supersessions.some((item) => !item)) return undefined;
  return {
    status: value.status,
    localDate: value.localDate,
    startedAt: new Date(value.startedAt),
    initialCheckIn,
    currentCheckIn,
    arc: { stages: [...value.arc.stages] as ArcStage[] },
    units: units as JourneyUnit[],
    supersessions: supersessions as SupersessionRecord[],
  };
}

function decodeUnit(value: unknown): JourneyUnit | undefined {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id.trim()
    || !isCanonicalTimestamp(value.scheduledFor) || !isOneOf(value.state, unitStates)
    || (value.kind !== 'passage' && value.kind !== 'catch-up')
    || typeof value.checkInOpportunity !== 'boolean'
    || (value.reservedContentId !== undefined && typeof value.reservedContentId !== 'string')) return undefined;
  return {
    id: value.id,
    scheduledFor: new Date(value.scheduledFor),
    state: value.state,
    kind: value.kind,
    checkInOpportunity: value.checkInOpportunity,
    ...(value.reservedContentId ? { reservedContentId: value.reservedContentId } : {}),
  };
}

function decodeSupersession(value: unknown): SupersessionRecord | undefined {
  if (!isRecord(value) || typeof value.contentId !== 'string' || !value.contentId.trim()
    || !isCanonicalTimestamp(value.at) || !isOneOf(value.reason, supersessionReasons)) return undefined;
  return { contentId: value.contentId, at: new Date(value.at), reason: value.reason };
}

function isCanonicalTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOneOf<T extends string>(value: unknown, options: readonly T[]): value is T {
  return typeof value === 'string' && options.includes(value as T);
}

function isOptionalOneOf<T extends string>(value: unknown, options: readonly T[]): value is T | undefined {
  return value === undefined || isOneOf(value, options);
}

function toLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
