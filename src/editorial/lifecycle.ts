import type { EditorialContentPackage } from './package';

export type PackageIdentity = string;
export type PackageLifecycleState = 'active' | 'standby' | 'retired' | 'quarantined';

export type VerifiedPackageRecord = {
  identity: PackageIdentity;
  packageId: string;
  version: string;
  state: PackageLifecycleState;
  verifiedByKeyId: string;
  algorithm: 'Ed25519';
  signature: string;
  verifiedAt: string;
};

export type PackageLifecycleEvent = {
  action: 'activated' | 'retired' | 'rolled-back' | 'quarantined';
  identity: PackageIdentity;
  actorId: string;
  reason: string;
  at: string;
};

export type PackageRegistry = {
  schemaVersion: 1;
  revision: number;
  active?: PackageIdentity;
  previous?: PackageIdentity;
  records: Record<PackageIdentity, VerifiedPackageRecord>;
  events: readonly PackageLifecycleEvent[];
};

export type RegistryCommit = {
  registry: PackageRegistry;
  packagesToStore: readonly EditorialContentPackage[];
};

export interface PackageRegistryRepository {
  readRegistry(): Promise<PackageRegistry>;
  loadPackage(identity: PackageIdentity): Promise<EditorialContentPackage | undefined>;
  commit(expectedRevision: number, commit: RegistryCommit): Promise<boolean>;
}

export type LifecycleGateResult =
  | { accepted: true; keyId: string; algorithm: 'Ed25519' }
  | { accepted: false; code: string };

export interface LifecycleGate {
  evaluate(contentPackage: EditorialContentPackage, now: Date): LifecycleGateResult;
}

export type LifecycleAuditInput = { actorId: string; reason: string };

export type LifecycleResult =
  | {
    ok: true;
    action: 'activated' | 'retired' | 'rolled-back';
    identity: PackageIdentity;
    revision: number;
  }
  | {
    ok: false;
    code: string;
    identity: PackageIdentity;
  };

export type EditorialPackageLifecycle = {
  activate(
    contentPackage: EditorialContentPackage,
    audit: LifecycleAuditInput,
    now: Date,
  ): Promise<LifecycleResult>;
  retire(
    identity: PackageIdentity,
    replacementIdentity: PackageIdentity | undefined,
    audit: LifecycleAuditInput,
    now: Date,
  ): Promise<LifecycleResult>;
  rollback(
    failedIdentity: PackageIdentity,
    fallbackIdentity: PackageIdentity | undefined,
    audit: LifecycleAuditInput,
    now: Date,
  ): Promise<LifecycleResult>;
};

export function emptyPackageRegistry(): PackageRegistry {
  return { schemaVersion: 1, revision: 0, records: {}, events: [] };
}

export function packageIdentity(contentPackage: EditorialContentPackage): PackageIdentity {
  return `${contentPackage.manifest.packageId}@${contentPackage.manifest.version}`;
}

export function createEditorialPackageLifecycle(
  repository: PackageRegistryRepository,
  gate: LifecycleGate,
): EditorialPackageLifecycle {
  return {
    async activate(contentPackage, audit, now) {
      const identity = packageIdentity(contentPackage);
      const inputIssue = validateOperationInput(identity, audit, now);
      if (inputIssue) return inputIssue;

      let gateResult: LifecycleGateResult;
      try {
        gateResult = gate.evaluate(contentPackage, now);
      } catch {
        return { ok: false, code: 'gate-unavailable', identity };
      }
      if (!gateResult.accepted) return { ok: false, code: gateResult.code, identity };
      try {
        const current = await repository.readRegistry();
        const existing = current.records[identity];
        if (existing?.state === 'retired' || existing?.state === 'quarantined') {
          return { ok: false, code: 'lifecycle-state-prohibits-activation', identity };
        }
        if (current.active === identity) return { ok: false, code: 'already-active', identity };

        const at = now.toISOString();
        const records = { ...current.records };
        if (current.active) {
          const activeRecord = records[current.active];
          if (activeRecord) records[current.active] = { ...activeRecord, state: 'standby' };
        }
        records[identity] = recordFor(contentPackage, gateResult, 'active', at);
        const registry: PackageRegistry = {
          ...current,
          revision: current.revision + 1,
          active: identity,
          ...(current.active ? { previous: current.active } : {}),
          records,
          events: [...current.events, eventFor('activated', identity, audit, at)],
        };
        const committed = await repository.commit(current.revision, {
          registry, packagesToStore: [contentPackage],
        });
        return committed
          ? { ok: true, action: 'activated', identity, revision: registry.revision }
          : { ok: false, code: 'registry-conflict', identity };
      } catch {
        return { ok: false, code: 'storage-failure', identity };
      }
    },

    async retire(identity, replacementIdentity, audit, now) {
      const inputIssue = validateOperationInput(identity, audit, now);
      if (inputIssue) return inputIssue;
      try {
        const current = await repository.readRegistry();
        const retiring = current.records[identity];
        if (!retiring) return { ok: false, code: 'package-not-found', identity };
        if (current.active === identity && !replacementIdentity) {
          return { ok: false, code: 'replacement-required', identity };
        }

        let replacement: EditorialContentPackage | undefined;
        let replacementGate: Extract<LifecycleGateResult, { accepted: true }> | undefined;
        if (current.active === identity && replacementIdentity) {
          if (replacementIdentity === identity) return { ok: false, code: 'replacement-invalid', identity };
          const replacementRecord = current.records[replacementIdentity];
          if (!isEligibleStoredRecord(replacementRecord)) {
            return { ok: false, code: 'replacement-invalid', identity };
          }
          replacement = await repository.loadPackage(replacementIdentity);
          if (!replacement) return { ok: false, code: 'replacement-invalid', identity };
          const evaluated = gate.evaluate(replacement, now);
          if (!evaluated.accepted) return { ok: false, code: 'replacement-invalid', identity };
          replacementGate = evaluated;
        }

        const at = now.toISOString();
        const records = {
          ...current.records,
          [identity]: { ...retiring, state: 'retired' as const },
        };
        if (replacement && replacementGate && replacementIdentity) {
          records[replacementIdentity] = recordFor(replacement, replacementGate, 'active', at);
        }
        const registry: PackageRegistry = {
          ...current,
          revision: current.revision + 1,
          ...(current.active === identity && replacementIdentity
            ? { active: replacementIdentity }
            : current.active ? { active: current.active } : {}),
          records,
          events: [
            ...current.events,
            eventFor('retired', identity, audit, at),
            ...(replacementIdentity
              ? [eventFor('activated', replacementIdentity, audit, at)]
              : []),
          ],
        };
        if (current.previous === identity || current.active === identity) delete registry.previous;
        const committed = await repository.commit(current.revision, { registry, packagesToStore: [] });
        return committed
          ? { ok: true, action: 'retired', identity, revision: registry.revision }
          : { ok: false, code: 'registry-conflict', identity };
      } catch {
        return { ok: false, code: 'storage-failure', identity };
      }
    },

    async rollback(failedIdentity, fallbackIdentity, audit, now) {
      const inputIssue = validateOperationInput(failedIdentity, audit, now);
      if (inputIssue) return inputIssue;
      try {
        const current = await repository.readRegistry();
        if (current.active !== failedIdentity) {
          return { ok: false, code: 'active-package-mismatch', identity: failedIdentity };
        }
        const candidates = [...new Set([current.previous, fallbackIdentity].filter(
          (identity): identity is string => Boolean(identity) && identity !== failedIdentity,
        ))];
        let target: EditorialContentPackage | undefined;
        let targetIdentity: string | undefined;
        let targetGate: Extract<LifecycleGateResult, { accepted: true }> | undefined;
        for (const candidateIdentity of candidates) {
          if (!isEligibleStoredRecord(current.records[candidateIdentity])) continue;
          const candidate = await repository.loadPackage(candidateIdentity);
          if (!candidate) continue;
          const evaluated = gate.evaluate(candidate, now);
          if (!evaluated.accepted) continue;
          target = candidate;
          targetIdentity = candidateIdentity;
          targetGate = evaluated;
          break;
        }
        if (!target || !targetIdentity || !targetGate) {
          return { ok: false, code: 'no-verified-rollback-target', identity: failedIdentity };
        }

        const failedRecord = current.records[failedIdentity];
        if (!failedRecord) return { ok: false, code: 'package-not-found', identity: failedIdentity };
        const at = now.toISOString();
        const records = {
          ...current.records,
          [failedIdentity]: { ...failedRecord, state: 'quarantined' as const },
          [targetIdentity]: recordFor(target, targetGate, 'active', at),
        };
        const registry: PackageRegistry = {
          ...current,
          revision: current.revision + 1,
          active: targetIdentity,
          records,
          events: [
            ...current.events,
            eventFor('quarantined', failedIdentity, audit, at),
            eventFor('rolled-back', targetIdentity, audit, at),
          ],
        };
        delete registry.previous;
        const committed = await repository.commit(current.revision, { registry, packagesToStore: [] });
        return committed
          ? { ok: true, action: 'rolled-back', identity: targetIdentity, revision: registry.revision }
          : { ok: false, code: 'registry-conflict', identity: failedIdentity };
      } catch {
        return { ok: false, code: 'storage-failure', identity: failedIdentity };
      }
    },
  };
}

function validateOperationInput(
  identity: string,
  audit: LifecycleAuditInput,
  now: Date,
): Extract<LifecycleResult, { ok: false }> | undefined {
  if (Number.isNaN(now.getTime())) return { ok: false, code: 'clock-invalid', identity };
  if (!audit.actorId.trim() || audit.actorId !== audit.actorId.trim()
    || !audit.reason.trim()) return { ok: false, code: 'audit-metadata-invalid', identity };
  return undefined;
}

function recordFor(
  contentPackage: EditorialContentPackage,
  gate: Extract<LifecycleGateResult, { accepted: true }>,
  state: PackageLifecycleState,
  verifiedAt: string,
): VerifiedPackageRecord {
  return {
    identity: packageIdentity(contentPackage),
    packageId: contentPackage.manifest.packageId,
    version: contentPackage.manifest.version,
    state,
    verifiedByKeyId: gate.keyId,
    algorithm: gate.algorithm,
    signature: contentPackage.manifest.signature.value,
    verifiedAt,
  };
}

function eventFor(
  action: PackageLifecycleEvent['action'],
  identity: string,
  audit: LifecycleAuditInput,
  at: string,
): PackageLifecycleEvent {
  return { action, identity, actorId: audit.actorId, reason: audit.reason, at };
}

function isEligibleStoredRecord(record: VerifiedPackageRecord | undefined): boolean {
  return Boolean(record && record.state !== 'retired' && record.state !== 'quarantined');
}

