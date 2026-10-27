import { describe, expect, it } from 'vitest';

import type { EditorialContentPackage } from '../editorial/package';
import { emptyPackageRegistry, type RegistryCommit } from '../editorial/lifecycle';
import {
  createAsyncStoragePackageRegistry,
  packageRegistryStorageKey,
} from './asyncStoragePackageRegistry';

function memoryStorage(initial?: string) {
  let value = initial ?? null;
  let lastKey: string | null = null;
  let failWrites = false;
  return {
    port: {
      getItem: async () => value,
      setItem: async (key: string, next: string) => {
        if (failWrites) throw new Error('disk full');
        lastKey = key;
        value = next;
      },
    },
    value: () => value,
    lastKey: () => lastKey,
    failWrites: () => { failWrites = true; },
  };
}

function candidate(id: string): EditorialContentPackage {
  return {
    manifest: {
      packageId: id,
      version: '1.0.0',
      signature: {
        algorithm: 'Ed25519', keyId: 'key-1', value: 'signature', verification: 'unverified',
      },
    } as never,
    units: [], prayerBlocks: [],
  };
}

function commitFor(id: string, revision: number): RegistryCommit {
  const identity = `${id}@1.0.0`;
  return {
    packagesToStore: [candidate(id)],
    registry: {
      schemaVersion: 1, revision, active: identity,
      records: {
        [identity]: {
          identity, packageId: id, version: '1.0.0', state: 'active',
          verifiedByKeyId: 'key-1', algorithm: 'Ed25519', signature: 'signature',
          verifiedAt: '2026-10-27T00:00:00.000Z',
        },
      },
      events: [{
        action: 'activated', identity, actorId: 'release-manager', reason: 'Approved.',
        at: '2026-10-27T00:00:00.000Z',
      }],
    },
  };
}

describe('AsyncStorage package registry', () => {
  it('starts from an empty registry without writing', async () => {
    const storage = memoryStorage();
    const repository = createAsyncStoragePackageRegistry(storage.port);
    await expect(repository.readRegistry()).resolves.toEqual(emptyPackageRegistry());
    expect(storage.value()).toBeNull();
  });

  it('commits registry and packages in one envelope and restores them', async () => {
    const storage = memoryStorage();
    const repository = createAsyncStoragePackageRegistry(storage.port);
    await expect(repository.commit(0, commitFor('package-a', 1))).resolves.toBe(true);

    expect(storage.lastKey()).toBe(packageRegistryStorageKey);
    expect(storage.value()).toContain('package-a');
    expect((await repository.readRegistry()).active).toBe('package-a@1.0.0');
    expect((await repository.loadPackage('package-a@1.0.0'))?.manifest.packageId).toBe('package-a');
  });

  it('serializes concurrent compare-and-swap commits so only one wins', async () => {
    const storage = memoryStorage();
    const repository = createAsyncStoragePackageRegistry(storage.port);
    const results = await Promise.all([
      repository.commit(0, commitFor('package-a', 1)),
      repository.commit(0, commitFor('package-b', 1)),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect((await repository.readRegistry()).revision).toBe(1);
  });

  it('rejects a stale revision without writing the candidate package', async () => {
    const storage = memoryStorage();
    const repository = createAsyncStoragePackageRegistry(storage.port);
    await repository.commit(0, commitFor('package-a', 1));
    const before = storage.value();
    await expect(repository.commit(0, commitFor('package-b', 1))).resolves.toBe(false);
    expect(storage.value()).toBe(before);
    expect(await repository.loadPackage('package-b@1.0.0')).toBeUndefined();
  });

  it('fails closed on corrupt or internally inconsistent envelopes', async () => {
    const corrupt = createAsyncStoragePackageRegistry(memoryStorage('{broken').port);
    await expect(corrupt.readRegistry()).rejects.toThrow('Editorial package registry is corrupt.');

    const inconsistentValue = JSON.stringify({
      schemaVersion: 1, registry: { ...emptyPackageRegistry(), active: 'missing@1.0.0' }, packages: {},
    });
    const inconsistent = createAsyncStoragePackageRegistry(memoryStorage(inconsistentValue).port);
    await expect(inconsistent.readRegistry()).rejects.toThrow('Editorial package registry is corrupt.');
  });

  it('does not expose a new registry when the single-envelope write fails', async () => {
    const storage = memoryStorage();
    const repository = createAsyncStoragePackageRegistry(storage.port);
    storage.failWrites();
    await expect(repository.commit(0, commitFor('package-a', 1))).rejects.toThrow('disk full');
    expect(storage.value()).toBeNull();
  });
});
