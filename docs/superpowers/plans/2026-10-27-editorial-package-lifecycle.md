# Phase 3C — Trusted Editorial Package Lifecycle

**Goal:** Ensure that only a structurally ready, coverage-complete package signed by an active trusted key can become active, and that activation, retirement, rollback, and fallback never leave the app in a partially updated state.

## Architecture

The package’s signature covers a canonical JSON payload containing the manifest (without the signature envelope), every editorial unit, and every prayer block. An injected trust store resolves key IDs and validity windows. Ed25519 verification is deterministic and framework-independent.

A lifecycle service writes packages through a compare-and-swap repository contract. The registry records monotonic revision, active and previous package identities, immutable verification evidence, state transitions, actor/reason, and timestamps. Failed validation, failed signature verification, stale revisions, revoked keys, and storage errors preserve the current active package.

## Task 1 — Canonical payload and Ed25519 verification

- Add deterministic recursive key ordering while preserving array order.
- Exclude only the signature envelope from the signed manifest payload.
- Reject malformed Base64, wrong key/signature lengths, unknown keys, revoked keys, future keys, expired keys, and invalid clocks.
- Verify signatures with a maintained Ed25519 implementation; do not implement cryptographic primitives locally.
- Add known-good and tamper tests covering manifest, unit, prayer-block, and array-order changes.

## Task 2 — Atomic package registry

- Define immutable package identity (`packageId@version`) and verified evidence.
- Require structural readiness, coverage success, and valid signature before staging.
- Activate by compare-and-swap; retain the previous verified identity for rollback.
- Reject reactivation of retired or quarantined versions.
- Record accountable lifecycle events.

## Task 3 — Retirement, emergency rollback, and fallback

- Retirement removes an active package only when a verified replacement or configured verified fallback becomes active in the same atomic transition.
- Emergency rollback returns to the previous verified package and quarantines the failed version.
- If neither previous nor fallback package is verified and available, fail closed while preserving the existing registry state.
- Test races, storage failures, missing packages, and rollback loops.

## Task 4 — Evidence boundary and verification

- Document key provisioning, rotation, revocation, offline cache, and operator responsibilities.
- State that code verifies integrity and trusted-key provenance, not legal rights, reviewer credentials, or theological correctness.
- Run focused tests, full tests, typecheck, Expo Doctor, and diff checks.
- Commit and push every checkpoint; merge only after combined verification.

## Non-goals

- No production keys, production Scripture, remote key-distribution service, or release signing ceremony.
- No private user data or cloud sync.
- No silent bypass when verification infrastructure is unavailable.
