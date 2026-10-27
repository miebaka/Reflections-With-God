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
- automated tests for scheduling and validation rules.

This milestone intentionally does **not** claim that cloud sync, end-to-end encryption, production safety screening, notifications, or the full reviewed 29-passage-per-day library are complete. Those features remain release blockers until implemented and independently verified.

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
