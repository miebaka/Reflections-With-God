import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  emptyPackageRegistry,
  packageIdentity,
  type PackageRegistry,
  type PackageRegistryRepository,
  type RegistryCommit,
} from '../editorial/lifecycle';
import type { EditorialContentPackage } from '../editorial/package';

export const packageRegistryStorageKey = '@reflections-with-god/editorial-package-registry/v1';

export type PackageRegistryStorage = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

type PackageStoreEnvelope = {
  schemaVersion: 1;
  registry: PackageRegistry;
  packages: Record<string, EditorialContentPackage>;
};

export function createAsyncStoragePackageRegistry(
  storage: PackageRegistryStorage = AsyncStorage,
): PackageRegistryRepository {
  let pending: Promise<void> = Promise.resolve();

  async function readEnvelope(): Promise<PackageStoreEnvelope> {
    const raw = await storage.getItem(packageRegistryStorageKey);
    if (raw === null) return { schemaVersion: 1, registry: emptyPackageRegistry(), packages: {} };
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!isValidEnvelope(parsed)) throw new Error('invalid');
      return parsed;
    } catch {
      throw new Error('Editorial package registry is corrupt.');
    }
  }

  return {
    async readRegistry() {
      return (await readEnvelope()).registry;
    },
    async loadPackage(identity) {
      return (await readEnvelope()).packages[identity];
    },
    commit(expectedRevision, commit) {
      const operation = pending.then(async () => {
        const current = await readEnvelope();
        if (current.registry.revision !== expectedRevision) return false;
        if (commit.registry.revision !== expectedRevision + 1) {
          throw new Error('Editorial registry revision must advance exactly once.');
        }
        const packages = { ...current.packages };
        for (const contentPackage of commit.packagesToStore) {
          packages[packageIdentity(contentPackage)] = contentPackage;
        }
        const envelope: PackageStoreEnvelope = {
          schemaVersion: 1,
          registry: commit.registry,
          packages,
        };
        if (!isValidEnvelope(envelope)) throw new Error('Editorial registry commit is invalid.');
        await storage.setItem(packageRegistryStorageKey, JSON.stringify(envelope));
        return true;
      });
      pending = operation.then(() => undefined, () => undefined);
      return operation;
    },
  };
}

function isValidEnvelope(value: unknown): value is PackageStoreEnvelope {
  if (!isRecord(value) || value.schemaVersion !== 1
    || !isRecord(value.registry) || !isRecord(value.packages)) return false;
  const registry = value.registry;
  if (registry.schemaVersion !== 1 || !Number.isSafeInteger(registry.revision)
    || (registry.revision as number) < 0 || !isRecord(registry.records)
    || !Array.isArray(registry.events)) return false;
  if (registry.active !== undefined && typeof registry.active !== 'string') return false;
  if (registry.previous !== undefined && typeof registry.previous !== 'string') return false;

  for (const [identity, record] of Object.entries(registry.records)) {
    if (!isRecord(record) || record.identity !== identity
      || typeof record.packageId !== 'string' || !record.packageId.trim()
      || typeof record.version !== 'string' || !record.version.trim()
      || !['active', 'standby', 'retired', 'quarantined'].includes(String(record.state))
      || typeof record.verifiedByKeyId !== 'string' || !record.verifiedByKeyId.trim()
      || record.algorithm !== 'Ed25519' || typeof record.signature !== 'string'
      || !isIsoTimestamp(record.verifiedAt)) return false;
    if (!isStoredPackage(value.packages[identity], identity, record)) return false;
  }
  if (registry.active !== undefined) {
    const activeRecord = registry.records[registry.active];
    if (!isRecord(activeRecord) || activeRecord.state !== 'active') return false;
  }
  if (registry.previous !== undefined) {
    const previousRecord = registry.records[registry.previous];
    if (!isRecord(previousRecord) || previousRecord.state !== 'standby') return false;
  }
  for (const event of registry.events) {
    if (!isRecord(event) || !['activated', 'retired', 'rolled-back', 'quarantined'].includes(String(event.action))
      || typeof event.identity !== 'string' || !event.identity.trim()
      || typeof event.actorId !== 'string' || !event.actorId.trim()
      || typeof event.reason !== 'string' || !event.reason.trim()
      || !isIsoTimestamp(event.at)) return false;
  }
  return true;
}

function isStoredPackage(
  value: unknown,
  identity: string,
  record: Record<string, unknown>,
): value is EditorialContentPackage {
  return isRecord(value) && isRecord(value.manifest)
    && typeof value.manifest.packageId === 'string'
    && typeof value.manifest.version === 'string'
    && `${value.manifest.packageId}@${value.manifest.version}` === identity
    && isRecord(value.manifest.signature)
    && value.manifest.signature.algorithm === record.algorithm
    && value.manifest.signature.keyId === record.verifiedByKeyId
    && value.manifest.signature.value === record.signature
    && Array.isArray(value.units) && Array.isArray(value.prayerBlocks);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}
