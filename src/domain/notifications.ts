export type NotificationMode = 'gentle' | 'rhythm' | 'companion' | 'silent';

export type LocalTime = { hour: number; minute: number };

export type NotificationSettings = {
  mode: NotificationMode;
  timezone: string;
  gentleTime?: LocalTime;
  closingReminder: boolean;
};

export type NotificationKind = 'morning' | 'midday' | 'evening' | 'check-in' | 'closing';

export type NotificationIntent = {
  id: string;
  kind: NotificationKind;
  fireAt: Date;
  title: 'Reflections with God';
  body: string;
  interruptionLevel: 'passive';
  badge: null;
};

export type NotificationPermissionState = 'undetermined' | 'granted' | 'denied';

type PermissionContext = {
  permission: NotificationPermissionState;
  hasOpenedMeaningfulUnit: boolean;
  explicitlyEnabledReminders: boolean;
};

const fixedCopy: Record<NotificationKind, string> = {
  morning: 'A quiet moment is ready when you are.',
  midday: 'A moment to pause is waiting.',
  evening: 'Your evening reflection is ready when you are.',
  'check-in': 'A gentle check-in is available when you are.',
  closing: 'Your day can close whenever you are ready.',
};

export function defaultNotificationSettings(timezone: string): NotificationSettings {
  assertTimezone(timezone);
  return { mode: 'rhythm', timezone, closingReminder: false };
}

export function shouldRequestNotificationPermission(context: PermissionContext): boolean {
  return context.permission === 'undetermined'
    && (context.hasOpenedMeaningfulUnit || context.explicitlyEnabledReminders);
}

export function planDailyNotifications(
  localDate: string,
  settings: NotificationSettings,
  now: Date,
): readonly NotificationIntent[] {
  if (Number.isNaN(now.getTime())) throw new Error('A valid scheduling time is required.');
  assertLocalDate(localDate);
  assertTimezone(settings.timezone);
  const moments = notificationMoments(settings);
  const intents = moments.flatMap(({ kind, time }) => {
    const fireAt = instantForLocalTime(localDate, time, settings.timezone);
    return fireAt && fireAt > now ? [intentFor(localDate, kind, fireAt)] : [];
  });
  return intents.sort((left, right) => left.fireAt.getTime() - right.fireAt.getTime());
}

function notificationMoments(settings: NotificationSettings): { kind: NotificationKind; time: LocalTime }[] {
  if (settings.mode === 'silent') return [];
  const moments: { kind: NotificationKind; time: LocalTime }[] = [];
  if (settings.mode === 'gentle') {
    if (!settings.gentleTime) throw new Error('Gentle mode requires a daily reminder time.');
    assertLocalTime(settings.gentleTime);
    moments.push({ kind: kindForTime(settings.gentleTime), time: settings.gentleTime });
  } else {
    moments.push(
      { kind: 'morning', time: { hour: 8, minute: 0 } },
      { kind: 'midday', time: { hour: 14, minute: 0 } },
      { kind: 'evening', time: { hour: 20, minute: 0 } },
    );
    if (settings.mode === 'companion') {
      for (const hour of [10, 12, 16, 18]) moments.push({ kind: 'check-in', time: { hour, minute: 0 } });
    }
  }
  if (settings.closingReminder) moments.push({ kind: 'closing', time: { hour: 22, minute: 0 } });
  return moments;
}

function intentFor(localDate: string, kind: NotificationKind, fireAt: Date): NotificationIntent {
  return {
    id: `daily:${localDate}:${kind}:${fireAt.toISOString()}`,
    kind,
    fireAt,
    title: 'Reflections with God',
    body: fixedCopy[kind],
    interruptionLevel: 'passive',
    badge: null,
  };
}

function kindForTime(time: LocalTime): NotificationKind {
  if (time.hour < 12) return 'morning';
  if (time.hour < 18) return 'midday';
  return 'evening';
}

export function instantForLocalTime(
  localDate: string,
  time: LocalTime,
  timezone: string,
): Date | undefined {
  assertLocalDate(localDate);
  assertLocalTime(time);
  assertTimezone(timezone);
  const [year, month, day] = localDate.split('-').map(Number) as [number, number, number];
  const target = { year, month, day, hour: time.hour, minute: time.minute };
  let candidate = Date.UTC(year, month - 1, day, time.hour, time.minute);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = zonedParts(new Date(candidate), timezone);
    const represented = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
    const wanted = Date.UTC(year, month - 1, day, time.hour, time.minute);
    const adjustment = wanted - represented;
    candidate += adjustment;
    if (adjustment === 0) break;
  }
  const result = new Date(candidate);
  const actual = zonedParts(result, timezone);
  return sameLocalMinute(actual, target) ? result : undefined;
}

function zonedParts(date: Date, timezone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(date).filter(({ type }) => type !== 'literal').map(({ type, value }) => [type, value]),
  );
  return {
    year: Number(parts.year), month: Number(parts.month), day: Number(parts.day),
    hour: Number(parts.hour), minute: Number(parts.minute),
  };
}

function sameLocalMinute(left: ReturnType<typeof zonedParts>, right: ReturnType<typeof zonedParts>): boolean {
  return left.year === right.year && left.month === right.month && left.day === right.day
    && left.hour === right.hour && left.minute === right.minute;
}

function assertLocalDate(value: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('A canonical local date is required.');
  const [year, month, day] = value.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}` !== value) {
    throw new Error('A real local date is required.');
  }
}

function assertLocalTime(value: LocalTime): void {
  if (!Number.isInteger(value.hour) || value.hour < 0 || value.hour > 23
    || !Number.isInteger(value.minute) || value.minute < 0 || value.minute > 59) {
    throw new Error('A valid local time is required.');
  }
}

function assertTimezone(value: string): void {
  try {
    new Intl.DateTimeFormat('en', { timeZone: value }).format();
  } catch {
    throw new Error('A valid IANA timezone is required.');
  }
}
