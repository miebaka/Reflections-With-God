import { validateCheckIn, type MoodCheckIn } from '../domain/checkIn';

export type OfflineAction =
  | { kind: 'check-in'; checkIn: MoodCheckIn }
  | { kind: 'fit-feedback'; unitId: string; fit: 'fits' | 'not-for-me'; reasonId?: string };

export type OfflineOutboxItem = {
  id: string;
  createdAt: string;
  action: OfflineAction;
};

export type OfflineOutbox = {
  schemaVersion: 1;
  revision: number;
  items: readonly OfflineOutboxItem[];
};

export interface OfflineOutboxRepository {
  read(): Promise<OfflineOutbox>;
  commit(expectedRevision: number, next: OfflineOutbox): Promise<boolean>;
}

export function emptyOfflineOutbox(): OfflineOutbox {
  return { schemaVersion: 1, revision: 0, items: [] };
}

export async function enqueueOfflineAction(
  repository: OfflineOutboxRepository,
  item: OfflineOutboxItem,
): Promise<'queued' | 'duplicate' | 'conflict'> {
  assertOutboxItem(item);
  const current = await repository.read();
  if (current.items.some(({ id }) => id === item.id)) return 'duplicate';
  const committed = await repository.commit(current.revision, {
    ...current,
    revision: current.revision + 1,
    items: [...current.items, item].sort((left, right) => (
      left.createdAt.localeCompare(right.createdAt) || left.id.localeCompare(right.id)
    )),
  });
  return committed ? 'queued' : 'conflict';
}

export async function acknowledgeOfflineActions(
  repository: OfflineOutboxRepository,
  ids: readonly string[],
): Promise<'acknowledged' | 'unchanged' | 'conflict'> {
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length || ids.some((id) => !id.trim())) {
    throw new Error('Acknowledgement IDs must be unique and nonblank.');
  }
  const current = await repository.read();
  const remaining = current.items.filter(({ id }) => !uniqueIds.has(id));
  if (remaining.length === current.items.length) return 'unchanged';
  const committed = await repository.commit(current.revision, {
    ...current, revision: current.revision + 1, items: remaining,
  });
  return committed ? 'acknowledged' : 'conflict';
}

export function assertOutboxItem(value: OfflineOutboxItem): void {
  if (!hasOnlyKeys(value as unknown as Record<string, unknown>, ['id', 'createdAt', 'action'])) {
    throw new Error('The queued action contains unsupported data.');
  }
  if (!value.id.trim() || value.id !== value.id.trim()) throw new Error('An action ID is required.');
  const date = new Date(value.createdAt);
  if (Number.isNaN(date.getTime()) || date.toISOString() !== value.createdAt) {
    throw new Error('A canonical action timestamp is required.');
  }
  if (value.action.kind === 'check-in') {
    if (!hasOnlyKeys(value.action as unknown as Record<string, unknown>, ['kind', 'checkIn'])) {
      throw new Error('The queued action contains unsupported data.');
    }
    if (!isPrivateSafeMood(value.action.checkIn)
      || validateCheckIn(value.action.checkIn).length > 0) throw new Error('The queued check-in is invalid.');
    return;
  }
  if (!hasOnlyKeys(value.action as unknown as Record<string, unknown>, ['kind', 'unitId', 'fit', 'reasonId'])) {
    throw new Error('The queued action contains unsupported data.');
  }
  if (!value.action.unitId.trim() || value.action.unitId !== value.action.unitId.trim()
    || (value.action.reasonId !== undefined && (!value.action.reasonId.trim()
      || value.action.reasonId !== value.action.reasonId.trim()))) {
    throw new Error('The queued feedback is invalid.');
  }
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function isPrivateSafeMood(value: MoodCheckIn): boolean {
  const record = value as unknown as Record<string, unknown>;
  if (value.kind === 'unknown') return hasOnlyKeys(record, ['kind']);
  return hasOnlyKeys(record, ['kind', 'selections']) && value.selections.every((selection) => (
    hasOnlyKeys(selection as unknown as Record<string, unknown>, ['emotion', 'intensity'])
  ));
}
