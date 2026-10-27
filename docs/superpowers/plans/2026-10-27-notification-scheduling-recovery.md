# Phase 4 — Notifications, Offline Scheduling, and Timezone Recovery

**Goal:** Make the daily journey advance reliably without turning each Scripture moment into an interruption, while preserving one humane schedule through restarts, missed time, offline use, travel, and clock changes.

## Architecture

Pure domain policy produces discreet notification intents and schedule-reconciliation decisions. Application services coordinate permission and replacement without importing platform APIs. Infrastructure adapters own local notification and outbox persistence. The journey remains the source of truth: notifications point into it but never create Scripture units, expose private state, or imply spiritual debt.

## Phase 4A — Notification policy and permission boundary

- Define Gentle, Rhythm, Companion, and Silent settings with Rhythm as the default.
- Generate only discreet, fixed-copy invitations; never include Scripture, mood, reflection, prayer, or inference text.
- Keep automatic 30-minute timeline availability separate from interruptive pushes.
- Defer permission until a meaningful unit has been opened or the user explicitly enables reminders.
- Replace pending app notifications idempotently and never use badges.

## Phase 4B — Schedule reconciliation

- Persist the selected IANA timezone and the last confirmed schedule timezone.
- Detect travel or clock-zone changes and require confirmation before rescheduling.
- Reconcile app restarts and elapsed moments without duplicate unit availability or notification bursts.
- Preserve one journey per recorded local date; do not silently relabel an existing journey after travel.
- Clamp notification intents to future moments in the still-open daily window.

## Phase 4C — Offline action outbox and cache boundary

- Queue structured check-in and feedback actions with stable IDs; never store raw reflection or prayer text.
- Commit enqueue and acknowledgement atomically with monotonic revisions.
- Deduplicate retries and return actions in deterministic order.
- Treat the already verified active editorial package as the offline content source; do not bypass its lifecycle gate.

## Verification

- Test every notification mode, permission state, private-copy prohibition, idempotent replacement, missed-time recovery, timezone confirmation, DST-like offset changes, restart behavior, outbox races, corruption, and write failure.
- Run the full test suite, strict TypeScript, Expo Doctor, and diff checks.
- Push each finished checkpoint and merge only the verified combined result.

## Non-goals

- No production push provider, remote notification service, telemetry, safety inference, private free text, or cloud synchronization.
- No notification may represent unread Scripture as debt or bypass system Focus / Do Not Disturb controls.
