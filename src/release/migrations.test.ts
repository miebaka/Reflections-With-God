import { describe, expect, it } from 'vitest';
import { migratePayload, type MigrationStep } from './migrations';

const steps: readonly MigrationStep[] = [
  { from: 1, to: 2, migrate: (value) => ({ ...value, schemaVersion: 2, notificationMode: 'rhythm' }) },
  { from: 2, to: 3, migrate: (value) => ({ ...value, schemaVersion: 3, retention: '30-days' }) },
];

describe('versioned migration harness', () => {
  it('applies every ordered step without mutating the saved source', () => {
    const source = { schemaVersion: 1, journeyId: 'journey-1' };
    expect(migratePayload(source, 3, steps)).toEqual({
      status: 'migrated', applied: ['1->2', '2->3'],
      payload: { schemaVersion: 3, journeyId: 'journey-1', notificationMode: 'rhythm', retention: '30-days' },
    });
    expect(source).toEqual({ schemaVersion: 1, journeyId: 'journey-1' });
  });

  it('fails closed on future, malformed, missing, or failed migration paths', () => {
    expect(migratePayload({ schemaVersion: 4 }, 3, steps)).toEqual({ status: 'unsupported', reason: 'future-version' });
    expect(migratePayload({ schemaVersion: '1' }, 3, steps)).toEqual({ status: 'unsupported', reason: 'invalid-payload' });
    expect(migratePayload({ schemaVersion: 1 }, 3, steps.slice(0, 1))).toEqual({ status: 'unsupported', reason: 'path-missing' });
    expect(migratePayload({ schemaVersion: 1 }, 2, [{ from: 1, to: 2, migrate: () => { throw new Error('bad'); } }]))
      .toEqual({ status: 'unsupported', reason: 'step-failed' });
  });

  it('rejects ambiguous or skipping registries before touching data', () => {
    expect(() => migratePayload({ schemaVersion: 1 }, 2, [...steps, steps[0]!])).toThrow('unique');
    expect(() => migratePayload({ schemaVersion: 1 }, 3, [{ from: 1, to: 3, migrate: () => ({ schemaVersion: 3 }) }]))
      .toThrow('one-version');
  });

  it('rejects non-JSON storage values instead of depending on platform clone behavior', () => {
    const cyclic: Record<string, unknown> = { schemaVersion: 1 };
    cyclic.self = cyclic;
    expect(migratePayload(cyclic, 2, steps)).toEqual({ status: 'unsupported', reason: 'invalid-payload' });
  });
});
