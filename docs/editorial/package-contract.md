# Editorial package contract

The Phase 3 editorial manifest is a fail-closed evidence envelope for a future reviewed content package. It records which translation-rights questions were reviewed, who approved the editorial constitution, which contentious subjects are excluded from personalized interpretation, and which version those decisions govern.

It does not select or approve a Bible translation. A translation identifier in a structurally valid manifest is not legal approval by itself. Product counsel or another accountable rights owner must create the written approval record referenced by the manifest after reviewing quotation, attribution, modification, offline storage, API use, and redistribution.

Pastoral and scholarly approval must come from distinct accountable reviewers. Each approval records reviewer identity, role, timestamp, governed version, and reason. Stable exclusion IDs are used instead of display labels so spelling changes cannot silently remove an exclusion.

## Content-unit and coverage gate

Phase 3B adds a structural gate for editorial units and prayer blocks. An ordinary mood-responsive unit must:

- identify one package-approved translation and canonical passage range;
- include nonblank Scripture text, essential context, reflection prompt, and theological purpose;
- declare reviewed moods, intensities, movements, contraindications, and difficult-text status;
- carry exact-version approvals from an ordained pastor, biblical scholar, safety reviewer, and content editor;
- preserve independent pastor and scholar identities and a chronological audit record;
- reference approved address, petition or gratitude, and closing prayer blocks;
- end its approved closing block explicitly in Jesus’ name; and
- pass deterministic checks for the prohibited claims currently represented by policy IDs.

The package validator rejects duplicate active identities, conflicting source strings for one canonical passage identifier, manifest failures, and any invalid unit. Coverage simulation counts distinct canonical passages, not content variants. It tests every enabled emotion-and-intensity day, every applicable emotion/intensity/movement tuple, grounding-fallback depth, configured mixed-emotion intensity assignments, and deterministic 100-seed replay days against the configured 29-slot movement sequence.

Structural readiness advances a package only to cryptographic verification. It is not activation.

## Signature and lifecycle gate

Phase 3C adds deterministic Ed25519 verification and a fail-closed package lifecycle. The signed payload is canonical JSON containing the complete manifest except its signature envelope, followed by every content unit and prayer block in their original array order. A package is eligible for activation only when the Phase 3B readiness gate passes and one active trusted key verifies the signature within its declared validity window.

The local registry stores each content package and its lifecycle registry in one versioned AsyncStorage value. A serialized compare-and-swap operation advances the registry revision exactly once, preventing concurrent operations in the same application runtime from both winning. Activation preserves the formerly active package as a verified standby. Retirement of an active package requires a replacement that passes the gate again in the same transition. Emergency rollback also re-evaluates the previous or configured fallback package before activating it, then quarantines the failed version. Retired and quarantined identities cannot be reactivated.

Every successful transition records the actor, reason, timestamp, identity, and action. Invalid clocks, malformed signatures, missing or ambiguous keys, revoked or out-of-window keys, failed readiness, stale revisions, corrupt storage, unavailable storage, and unavailable verification all fail closed without intentionally replacing the current active package.

## Key and operator responsibilities

Production key provisioning is an accountable release operation outside the app:

- generate signing keys in an approved secure environment and keep private keys outside the application and repository;
- provision only public keys, unique key IDs, explicit validity windows, and current status into the reviewed trust store;
- overlap old and new active public keys during a planned rotation, while ensuring each key ID resolves uniquely;
- distribute revocation updates urgently and prevent any revoked key from signing or re-verifying a package;
- sign only the exact canonical payload produced by the published package tooling, then verify the finished package independently before release;
- retain the last known-good verified package locally so loss of network access does not create a verification bypass; and
- use named operator identities and meaningful reasons for every activation, retirement, and rollback.

AsyncStorage provides a single-value local commit, not end-to-end encryption and not a distributed transaction. The in-process serialization guard does not replace a server-side compare-and-swap if multiple devices or processes later manage packages. A future remote trust-store or package service must authenticate its responses, preserve monotonic revisions, define freshness and revocation behavior offline, and be tested against rollback and split-brain conditions.

## Deliberate boundary

The repository contains no production key, production Scripture, remote key-distribution service, or signing ceremony. Development manifests may still display `verification: 'unverified'`; that field is signed input, not authority. The lifecycle stores separate verification evidence only after executing the trust gate.

The validators and signature checks prove package integrity and provenance from a configured trusted public key. They do not prove that a Bible quotation matches an authorized source, that a reviewer possesses the claimed credentials, that a legal rights decision is correct, or that theological judgment was sound. Those are external accountable facts whose records the package references. The prohibited-phrase screen is a deterministic backstop, not a substitute for pastoral, scholarly, safety, or editorial review.

Until production keys are securely provisioned, the translation approval is real, reviewer identities are independently confirmed, and release operations are approved, development fixtures remain non-publishable and no production Scripture package may be ingested.
