# Reflections with God

A private, non-gamified Christian Scripture journey shaped by the user's emotional state.

## Foundation milestone

This repository contains the first product foundation:

- an Expo/React Native application for iOS and Android;
- strict TypeScript and framework-independent domain rules;
- an adult-only, consent-aware entry flow;
- a morning check-in supporting one to three emotions or “I don't know”;
- independent mild, moderate, or strong intensity for every selected emotion;
- a user-confirmed healthy direction and humane invisible emotional arc;
- a deterministic 29-moment journey planner with optional two-hour check-ins;
- explicit journey-unit states and catch-up supersession;
- fail-closed reviewed-content selection, contraindications, grounding fallback, and canonical same-day deduplication;
- a reducer-driven adult eligibility, check-in, direction, active journey, and closed-day application shell;
- a calm timeline projection that excludes superseded moments and treats check-ins as optional;
- guarded, versioned same-day session restoration on the local device;
- fail-closed recovery from corrupt, stale, future-dated, or unsupported snapshots;
- a fail-closed editorial manifest for translation-rights review, dual approval, and required doctrine exclusions;
- exact-version Scripture-unit and prayer-block validation with prohibited-claim checks;
- distinct-passage coverage gates and deterministic 100-seed day simulation;
- canonical Ed25519 verification against explicit trusted-key validity and revocation state;
- atomic package activation, verified replacement, retirement, quarantine, and emergency rollback;
- user-controlled Gentle, Rhythm, Companion, and Silent local-notification modes;
- discreet low-importance reminders, deferred permission, and idempotent schedule replacement;
- confirmed timezone recovery, quiet missed-moment unlocking, and a structured privacy-safe offline outbox;
- a local, approval-gated explicit-risk classifier and non-emergency strong-sadness support;
- a non-bypassable safety pause, confirmed resumption, and reviewed comfort-unit gate;
- expiring, dual-approved Nigeria support-resource packages with non-publishable research candidates;
- authenticated private-record encryption with opaque identifiers and hidden retention metadata;
- generated recovery secrets, trusted-device key wrapping, revocation, and rotation gates;
- device-only secure key storage and a runtime-validated ciphertext-only sync contract;
- local retention expiry, deletion tombstones, and explicit unrecoverable-history outcomes;
- explicit-feedback-first personalization with weak, 30-day decaying behavioral clues;
- closed analytics events that reject private text, mood data, scoring, and streaks;
- revocable single-use deeper-analysis consent that fails closed without verified provider assurances;
- automated tests for scheduling and validation rules.

The local journey snapshot contains only structured check-in and journey state and expires at the local-day boundary. It contains no Scripture body, reflection, prayer edit, or recap text. The separate editorial registry stores reviewed packages and lifecycle evidence as one local value. The offline outbox accepts only structured check-ins and fit feedback; it rejects arbitrary or private text. AsyncStorage is a device persistence mechanism, **not** end-to-end encryption or a distributed transaction. Phase 6 now supplies the client encryption and ciphertext-sync boundary, but production authentication, cloud persistence, deletion verification, independent cryptographic/privacy review, and recovery usability testing remain blocked. Production Scripture, private-history UI, editable prayer, recap, qualified approval of the production safety policy, manually verified Nigeria resources, and the full reviewed 29-passage-per-day library also remain release blockers. Local notification behavior still requires the iOS and Android device matrix in the release gates.

## Run locally

```bash
npm install
npm run typecheck
npm test
npm start
```

## Product principles

- Scripture is the centre; the app is a guide, not a spiritual authority.
- Emotional movement is gradual and fitting, never forced positivity.
- No streaks, scores, badges, rankings, guilt, or punitive reminders.
- Private reflections must remain private by design.
- Bible text and theological interpretation must pass licensing and human-review gates.

See [docs/architecture.md](docs/architecture.md) and [docs/release-gates.md](docs/release-gates.md).
The implementation sequence is documented in [the MVP delivery phases](docs/superpowers/plans/2026-10-26-mvp-delivery-phases.md).
The Phase 3 evidence boundary is documented in [the editorial package contract](docs/editorial/package-contract.md).

Phase 6's user-controlled key, trusted-device, retention, and ciphertext-only sync boundary is documented in [the encryption boundary](docs/privacy/encryption-boundary.md). It is not yet a production cloud-sync claim or independent cryptographic approval.
Phase 7's feedback hierarchy, analytics schema, and disabled-by-default deeper-analysis contract are documented in [the learning and analysis boundary](docs/privacy/learning-and-analysis.md).
The visual-product benchmark is documented in [the How We Feel design study](docs/research/2026-10-27-how-we-feel-product-design-study.md).
