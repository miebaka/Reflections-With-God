export type FitReason =
  | 'wrong-emotion' | 'wrong-tone' | 'confusing-context'
  | 'theological-concern' | 'repetition' | 'other';

export type ExplicitLearningSignal = {
  id: string;
  contentId: string;
  judgment: 'fits' | 'not-for-me';
  reason?: FitReason;
  recordedAt: string;
};

export type BehavioralLearningSignal = {
  id: string;
  contentId: string;
  behavior: 'meaningful-open' | 'skip' | 'prayer-edited';
  recordedAt: string;
};

export type PersonalizationProfile = {
  schemaVersion: 1;
  explicit: readonly ExplicitLearningSignal[];
  behavioral: readonly BehavioralLearningSignal[];
  resetAt?: string;
};

export type LearningAdjustment = {
  explicit: number;
  behavioral: number;
  total: number;
};

const behaviorWeight = {
  'meaningful-open': 0.08,
  skip: -0.03,
  'prayer-edited': 0.12,
} as const;

const day = 86_400_000;
const behaviorWindow = 30 * day;

export function emptyPersonalizationProfile(): PersonalizationProfile {
  return { schemaVersion: 1, explicit: [], behavioral: [] };
}

export function recordExplicitSignal(
  profile: PersonalizationProfile,
  signal: ExplicitLearningSignal,
): PersonalizationProfile {
  assertExplicitSignal(signal);
  return {
    ...profile,
    explicit: [...profile.explicit.filter(({ contentId }) => contentId !== signal.contentId), signal],
  };
}

export function recordBehavioralSignal(
  profile: PersonalizationProfile,
  signal: BehavioralLearningSignal,
  now: Date,
): PersonalizationProfile {
  assertBehavioralSignal(signal);
  assertClock(now);
  return {
    ...profile,
    behavioral: [...profile.behavioral, signal].filter(({ recordedAt }) => (
      now.getTime() - new Date(recordedAt).getTime() < behaviorWindow
      && new Date(recordedAt) <= now
    )),
  };
}

export function learningAdjustment(
  profile: PersonalizationProfile,
  contentId: string,
  now: Date,
): LearningAdjustment {
  assertClock(now);
  const explicitSignal = [...profile.explicit].reverse().find((signal) => signal.contentId === contentId);
  const explicit = explicitSignal?.judgment === 'fits' ? 1 : explicitSignal?.judgment === 'not-for-me' ? -1 : 0;
  const behavioral = profile.behavioral
    .filter((signal) => signal.contentId === contentId)
    .reduce((sum, signal) => {
      const age = now.getTime() - new Date(signal.recordedAt).getTime();
      if (age < 0 || age >= behaviorWindow) return sum;
      return sum + behaviorWeight[signal.behavior] * (1 - age / behaviorWindow);
    }, 0);
  const boundedBehavior = Math.max(-0.2, Math.min(0.2, behavioral));
  return { explicit, behavioral: boundedBehavior, total: explicit + boundedBehavior };
}

export function resetPersonalization(_profile: PersonalizationProfile, now: Date): PersonalizationProfile {
  assertClock(now);
  return { schemaVersion: 1, explicit: [], behavioral: [], resetAt: now.toISOString() };
}

export function behavioralSignalMeaning(behavior: BehavioralLearningSignal['behavior']): string {
  switch (behavior) {
    case 'meaningful-open': return 'The unit was opened long enough to be useful as a weak relevance clue.';
    case 'prayer-edited': return 'The prayer was edited; this is a weak interaction clue, not theological approval.';
    case 'skip': return 'The unit was passed over; no reason, rejection, or faith judgment is inferred.';
  }
}

function assertExplicitSignal(signal: ExplicitLearningSignal): void {
  assertCommon(signal);
  if (!onlyKeys(signal, ['id', 'contentId', 'judgment', 'reason', 'recordedAt'])) {
    throw new Error('Explicit learning signal contains unsupported data.');
  }
  if (!['fits', 'not-for-me'].includes(signal.judgment)
    || (signal.reason !== undefined && !['wrong-emotion', 'wrong-tone', 'confusing-context',
      'theological-concern', 'repetition', 'other'].includes(signal.reason))) {
    throw new Error('Explicit learning signal is invalid.');
  }
}

function assertBehavioralSignal(signal: BehavioralLearningSignal): void {
  assertCommon(signal);
  if (!onlyKeys(signal, ['id', 'contentId', 'behavior', 'recordedAt'])) {
    throw new Error('Behavioral learning signal contains unsupported data.');
  }
  if (!['meaningful-open', 'skip', 'prayer-edited'].includes(signal.behavior)) {
    throw new Error('Behavioral learning signal is invalid.');
  }
}

function assertCommon(signal: { id: string; contentId: string; recordedAt: string }): void {
  if (!signal.id.trim() || !signal.contentId.trim() || !canonicalTimestamp(signal.recordedAt)) {
    throw new Error('Learning signal metadata is invalid.');
  }
}

function assertClock(now: Date): void {
  if (Number.isNaN(now.getTime())) throw new Error('A valid learning clock is required.');
}

function canonicalTimestamp(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

function onlyKeys(value: object, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}
