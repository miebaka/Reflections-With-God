import { describe, expect, it } from 'vitest';

import type { EditorialContentPackage } from './package';
import {
  createEditorialPackageLifecycle,
  emptyPackageRegistry,
  packageIdentity,
  type LifecycleGate,
  type PackageRegistry,
  type PackageRegistryRepository,
  type RegistryCommit,
} from './lifecycle';

const now = new Date('2026-10-27T12:00:00.000Z');

function contentPackage(id: string, version = '1.0.0'): EditorialContentPackage {
  return {
    manifest: {
      packageId: id, version,
      signature: { algorithm: 'Ed25519', keyId: 'key-1', value: `signature-${id}`, verification: 'unverified' },
    } as never,
    units: [], prayerBlocks: [],
  };
}

function gate(rejected = new Set<string>()): LifecycleGate {
  return {
    evaluate(candidate) {
      const identity = packageIdentity(candidate);
      return rejected.has(identity)
        ? { accepted: false, code: 'package-not-ready' }
        : { accepted: true, keyId: 'key-1', algorithm: 'Ed25519' };
    },
  };
}

function memoryRepository(initial = emptyPackageRegistry()) {
  let registry = initial;
  const packages = new Map<string, EditorialContentPackage>();
  let conflict = false;
  let failure = false;
  const repository: PackageRegistryRepository = {
    async readRegistry() {
      if (failure) throw new Error('storage failed');
      return registry;
    },
    async loadPackage(identity) {
      if (failure) throw new Error('storage failed');
      return packages.get(identity);
    },
    async commit(expectedRevision, commit: RegistryCommit) {
      if (failure) throw new Error('storage failed');
      if (conflict || registry.revision !== expectedRevision) return false;
      for (const candidate of commit.packagesToStore) packages.set(packageIdentity(candidate), candidate);
      registry = commit.registry;
      return true;
    },
  };
  return {
    repository,
    registry: () => registry,
    package: (identity: string) => packages.get(identity),
    setConflict: (value: boolean) => { conflict = value; },
    setFailure: (value: boolean) => { failure = value; },
  };
}

const actor = { actorId: 'release-manager-1', reason: 'Approved release operation.' };

describe('editorial package lifecycle', () => {
  it('atomically stores and activates a package that passes the injected readiness and trust gate', async () => {
    const store = memoryRepository();
    const service = createEditorialPackageLifecycle(store.repository, gate());
    const candidate = contentPackage('package-a');

    await expect(service.activate(candidate, actor, now)).resolves.toEqual({
      ok: true, action: 'activated', identity: 'package-a@1.0.0', revision: 1,
    });
    expect(store.registry().active).toBe('package-a@1.0.0');
    expect(store.registry().records['package-a@1.0.0']?.state).toBe('active');
    expect(store.package('package-a@1.0.0')).toBe(candidate);
  });

  it('preserves the active package when readiness or signature verification fails', async () => {
    const store = memoryRepository();
    const service = createEditorialPackageLifecycle(store.repository, gate(new Set(['package-b@1.0.0'])));
    await service.activate(contentPackage('package-a'), actor, now);
    const before = store.registry();

    await expect(service.activate(contentPackage('package-b'), actor, now)).resolves.toEqual({
      ok: false, code: 'package-not-ready', identity: 'package-b@1.0.0',
    });
    expect(store.registry()).toBe(before);
    expect(store.package('package-b@1.0.0')).toBeUndefined();
  });

  it('fails closed when the trust gate is unavailable', async () => {
    const store = memoryRepository();
    const service = createEditorialPackageLifecycle(store.repository, {
      evaluate() {
        throw new Error('trust store unavailable');
      },
    });

    await expect(service.activate(contentPackage('package-a'), actor, now)).resolves.toEqual({
      ok: false, code: 'gate-unavailable', identity: 'package-a@1.0.0',
    });
    expect(store.registry()).toEqual(emptyPackageRegistry());
  });

  it('retains the previous verified package as standby when activating a replacement', async () => {
    const store = memoryRepository();
    const service = createEditorialPackageLifecycle(store.repository, gate());
    await service.activate(contentPackage('package-a'), actor, now);
    await service.activate(contentPackage('package-b'), actor, now);

    expect(store.registry().active).toBe('package-b@1.0.0');
    expect(store.registry().previous).toBe('package-a@1.0.0');
    expect(store.registry().records['package-a@1.0.0']?.state).toBe('standby');
  });

  it('quarantines a failed active package and rolls back to the still-verified previous package', async () => {
    const store = memoryRepository();
    const service = createEditorialPackageLifecycle(store.repository, gate());
    await service.activate(contentPackage('package-a'), actor, now);
    await service.activate(contentPackage('package-b'), actor, now);

    await expect(service.rollback('package-b@1.0.0', undefined, actor, now)).resolves.toEqual({
      ok: true, action: 'rolled-back', identity: 'package-a@1.0.0', revision: 3,
    });
    expect(store.registry().active).toBe('package-a@1.0.0');
    expect(store.registry().previous).toBeUndefined();
    expect(store.registry().records['package-b@1.0.0']?.state).toBe('quarantined');
  });

  it('uses a configured verified fallback when the previous package no longer passes the gate', async () => {
    const store = memoryRepository();
    const mutableRejected = new Set<string>();
    const service = createEditorialPackageLifecycle(store.repository, gate(mutableRejected));
    await service.activate(contentPackage('fallback'), actor, now);
    await service.activate(contentPackage('package-a'), actor, now);
    await service.activate(contentPackage('package-b'), actor, now);
    mutableRejected.add('package-a@1.0.0');

    await expect(service.rollback('package-b@1.0.0', 'fallback@1.0.0', actor, now)).resolves.toMatchObject({
      ok: true, action: 'rolled-back', identity: 'fallback@1.0.0',
    });
    expect(store.registry().active).toBe('fallback@1.0.0');
  });

  it('fails closed without mutating state when no verified rollback target exists', async () => {
    const store = memoryRepository();
    const rejected = new Set<string>();
    const service = createEditorialPackageLifecycle(store.repository, gate(rejected));
    await service.activate(contentPackage('package-a'), actor, now);
    await service.activate(contentPackage('package-b'), actor, now);
    rejected.add('package-a@1.0.0');
    const before = store.registry();

    await expect(service.rollback('package-b@1.0.0', 'missing@1.0.0', actor, now)).resolves.toEqual({
      ok: false, code: 'no-verified-rollback-target', identity: 'package-b@1.0.0',
    });
    expect(store.registry()).toBe(before);
  });

  it('retires an inactive package, but requires an atomic verified replacement for an active package', async () => {
    const store = memoryRepository();
    const service = createEditorialPackageLifecycle(store.repository, gate());
    await service.activate(contentPackage('package-a'), actor, now);
    await service.activate(contentPackage('package-b'), actor, now);
    await expect(service.retire('package-a@1.0.0', undefined, actor, now)).resolves.toMatchObject({
      ok: true, action: 'retired', identity: 'package-a@1.0.0',
    });
    await expect(service.retire('package-b@1.0.0', undefined, actor, now)).resolves.toEqual({
      ok: false, code: 'replacement-required', identity: 'package-b@1.0.0',
    });
  });

  it('atomically replaces and retires an active package', async () => {
    const store = memoryRepository();
    const service = createEditorialPackageLifecycle(store.repository, gate());
    await service.activate(contentPackage('package-a'), actor, now);
    await service.activate(contentPackage('package-b'), actor, now);

    await expect(service.retire('package-b@1.0.0', 'package-a@1.0.0', actor, now)).resolves.toMatchObject({
      ok: true, action: 'retired', identity: 'package-b@1.0.0',
    });
    expect(store.registry().active).toBe('package-a@1.0.0');
    expect(store.registry().records['package-b@1.0.0']?.state).toBe('retired');
    expect(store.registry().events.slice(-2).map(({ action, identity }) => ({ action, identity }))).toEqual([
      { action: 'retired', identity: 'package-b@1.0.0' },
      { action: 'activated', identity: 'package-a@1.0.0' },
    ]);
  });

  it('never reactivates retired or quarantined versions', async () => {
    const store = memoryRepository();
    const service = createEditorialPackageLifecycle(store.repository, gate());
    const packageA = contentPackage('package-a');
    const packageB = contentPackage('package-b');
    await service.activate(packageA, actor, now);
    await service.activate(packageB, actor, now);
    await service.rollback('package-b@1.0.0', undefined, actor, now);

    await expect(service.activate(packageB, actor, now)).resolves.toEqual({
      ok: false, code: 'lifecycle-state-prohibits-activation', identity: 'package-b@1.0.0',
    });
  });

  it('preserves state on a compare-and-swap race or storage failure', async () => {
    const store = memoryRepository();
    const service = createEditorialPackageLifecycle(store.repository, gate());
    store.setConflict(true);
    await expect(service.activate(contentPackage('package-a'), actor, now)).resolves.toEqual({
      ok: false, code: 'registry-conflict', identity: 'package-a@1.0.0',
    });
    expect(store.registry()).toEqual(emptyPackageRegistry());

    store.setConflict(false);
    store.setFailure(true);
    await expect(service.activate(contentPackage('package-a'), actor, now)).resolves.toEqual({
      ok: false, code: 'storage-failure', identity: 'package-a@1.0.0',
    });
  });

  it('rejects invalid clocks and unauditable actor metadata', async () => {
    const store = memoryRepository();
    const service = createEditorialPackageLifecycle(store.repository, gate());
    await expect(service.activate(contentPackage('package-a'), { actorId: '', reason: '' }, now)).resolves.toEqual({
      ok: false, code: 'audit-metadata-invalid', identity: 'package-a@1.0.0',
    });
    await expect(service.activate(contentPackage('package-a'), actor, new Date('invalid'))).resolves.toEqual({
      ok: false, code: 'clock-invalid', identity: 'package-a@1.0.0',
    });
  });
});
