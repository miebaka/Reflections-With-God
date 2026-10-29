export type VersionedPayload = { schemaVersion: number } & Record<string, unknown>;
export type MigrationStep = {
  from: number;
  to: number;
  migrate(payload: Readonly<VersionedPayload>): VersionedPayload;
};

export type MigrationResult =
  | { status: 'current'; payload: VersionedPayload }
  | { status: 'migrated'; payload: VersionedPayload; applied: readonly string[] }
  | { status: 'unsupported'; reason: 'invalid-payload' | 'future-version' | 'path-missing' | 'step-failed' };

export function migratePayload(
  input: unknown,
  currentVersion: number,
  steps: readonly MigrationStep[],
): MigrationResult {
  if (!Number.isSafeInteger(currentVersion) || currentVersion < 1) throw new Error('Current schema version is invalid.');
  assertMigrationRegistry(steps);
  if (!isRecord(input) || !Number.isSafeInteger(input.schemaVersion) || (input.schemaVersion as number) < 1) {
    return { status: 'unsupported', reason: 'invalid-payload' };
  }
  const initial = cloneJson(input);
  if (!initial) return { status: 'unsupported', reason: 'invalid-payload' };
  if ((input.schemaVersion as number) > currentVersion) return { status: 'unsupported', reason: 'future-version' };
  if (input.schemaVersion === currentVersion) return { status: 'current', payload: initial };
  let working = initial;
  const applied: string[] = [];
  while (working.schemaVersion < currentVersion) {
    const step = steps.find(({ from }) => from === working.schemaVersion);
    if (!step || step.to > currentVersion) return { status: 'unsupported', reason: 'path-missing' };
    try {
      const frozen = cloneJson(working);
      if (!frozen) return { status: 'unsupported', reason: 'step-failed' };
      const next = step.migrate(Object.freeze(frozen));
      const clonedNext = cloneJson(next);
      if (!clonedNext || clonedNext.schemaVersion !== step.to) return { status: 'unsupported', reason: 'step-failed' };
      working = clonedNext;
      applied.push(`${step.from}->${step.to}`);
    } catch {
      return { status: 'unsupported', reason: 'step-failed' };
    }
  }
  return { status: 'migrated', payload: working, applied };
}

function assertMigrationRegistry(steps: readonly MigrationStep[]): void {
  const fromVersions = new Set<number>();
  for (const step of steps) {
    if (!Number.isSafeInteger(step.from) || !Number.isSafeInteger(step.to)
      || step.from < 1 || step.to !== step.from + 1 || fromVersions.has(step.from)) {
      throw new Error('Migration registry must contain unique, consecutive one-version steps.');
    }
    fromVersions.add(step.from);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cloneJson(value: unknown): VersionedPayload | undefined {
  try {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) return undefined;
    const cloned: unknown = JSON.parse(serialized);
    return isRecord(cloned) && Number.isSafeInteger(cloned.schemaVersion)
      ? cloned as VersionedPayload : undefined;
  } catch {
    return undefined;
  }
}
