# Architecture

## Direction

The client is an Expo/React Native application written in strict TypeScript. Product rules live in `src/domain` and do not import React Native. This keeps scheduling, content eligibility, privacy policy, and safety state transitions testable without a device.

## Intended boundaries

```text
UI screens
  -> application use cases
    -> domain rules
      -> repository interfaces
        -> encrypted device storage / reviewed content package / sync transport
```

- **Domain:** pure types and deterministic rules. No networking, storage, UI, or AI SDKs.
- **Application:** coordinates use cases and explicit state transitions.
- **Infrastructure:** implements secure storage, notifications, content loading, on-device screening, and encrypted sync.
- **UI:** renders state and captures explicit user intent. It must never infer theological or safety decisions itself.

## Privacy model

Reflections, prayer edits, mood history, and recaps are private-domain data. The production persistence implementation must encrypt them on-device before any sync transport receives them. The operator must not receive private keys. Analytics events must be allow-listed and structurally unable to contain reflection text.

Cloud history sync stays disabled until the user has created and confirmed a recovery secret. Losing every trusted device and that secret makes encrypted history unrecoverable.

### Phase 2B local session boundary

The current client saves only the structured same-day application session through a repository interface backed by AsyncStorage. Snapshots use an explicit schema version, restore dates field by field, and are rejected when malformed, stale, future-dated, unsupported, or from a different local calendar day. Invalid snapshots are removed rather than partially trusted.

This device snapshot intentionally excludes Scripture text and all user-authored private text. AsyncStorage is not represented as end-to-end encryption, secure key storage, private history, or cloud backup. Those guarantees remain gated on the Phase 5 safety boundary and Phase 6 encryption design.

### Phase 4 scheduling boundary

Notification policy is pure domain code. It emits only fixed, discreet invitation intents; it never receives Scripture text, moods, reflections, prayers, or inferred state. Rhythm remains the default with three low-importance local reminders. Gentle schedules one chosen daily time, Companion explicitly opts into two-hour check-in invitations, and Silent removes every pending notification owned by this app. The 30-minute timeline cadence advances independently and never creates 30-minute push interruptions.

The application asks for notification permission only after a meaningful unit is visible or the user explicitly enables reminders. It reconciles the desired plan against app-owned scheduled notifications, making restarts idempotent and leaving unrelated notifications untouched. Elapsed reminders are dropped rather than delivered as a burst. Android reminders use a low-importance channel; iOS requests passive interruption behavior. Device Focus and Do Not Disturb remain authoritative.

Timezone changes are detected against the saved IANA timezone and require confirmation before future moments are rescheduled. An existing journey retains its recorded local date. If travel places the device on another calendar date, the app refuses to relabel that journey silently. Missed scheduled units collapse through the existing catch-up rule, and repeated recovery is idempotent.

The offline outbox permits only allow-listed structured check-ins and fit feedback. Stable IDs deduplicate retries, acknowledgements remove only confirmed actions, and a monotonic single-value compare-and-swap protects local updates. Raw reflections, prayer edits, Scripture text, and arbitrary fields are rejected. This is a local queue boundary, not cloud synchronization.

### Phase 6 private-history boundary

Private records now have an authenticated encryption envelope, generated recovery secret, trusted-device wrapping model, secure key-vault adapter, retention tombstones, local key rotation, and a ciphertext-only sync contract. Revoking a device suspends sync until the history key advances. The transport has no plaintext-shaped method and rejects unknown fields at runtime.

This foundation does not connect a production account or cloud service and has not completed independent cryptographic, legal, deletion, recovery-usability, or penetration review. Those remain external-alpha blockers. See [the encryption boundary](privacy/encryption-boundary.md).

### Phase 7 learning and analysis boundary

Explicit fit feedback is the durable learning authority. Passive opens, skips, and prayer edits are capped weak signals that decay to zero over 30 days and never express a spiritual or moral judgment. Analytics accepts only a closed product-quality event schema with coarse time and no private text, moods, prayers, recovery data, analysis results, scores, or streaks.

Optional deeper analysis uses specific, revocable, single-use consent. The exact reflection must pass local safety screening immediately before submission, and the feature fails closed unless a current assurance proves zero training, zero persistent retention, disabled payload logging, contractual review, and technical verification. No provider is configured. See [the learning and analysis boundary](privacy/learning-and-analysis.md).

## Safety model

Any free-text surface must pass through an on-device safety interface before encryption or sync. A high-risk result pauses the Scripture journey and presents manually verified Nigerian crisis and pastoral resources. The journey resumes only after the user confirms they are safe, beginning with reviewed comfort content.

The current foundation does not yet expose free writing, so it cannot accidentally ship an unprotected text surface. Phase 5 supplies the local classifier contract, approval gate, interruption state machine, comfort-unit gate, strong-sadness nudge, and expiring resource-package validator. Its researched contact candidates are not publishable resources. Qualified-adviser policy approval, Nigerian-language evaluation, and manual contact verification remain release blockers.

## Content model

Bible text is never generated. A `ScriptureUnit` identifies its translation and review status. Production selection may only return units marked `fully-approved` with a recorded review date. The development unit in the repository is visibly marked `draft` and must be replaced by the reviewed catalogue before release.

The final catalogue must include enough eligible passages to construct a 29-moment day without repeating a passage, including fallbacks after contraindication and safety filters.

## Journey timing

- Opening check-in is available from 8 a.m.; a late arrival starts when completed.
- Subsequent moments align to the next local half-hour boundary.
- Two-hour check-ins are opportunities, not obligations.
- Unopened past moments become `superseded`; the user receives a shortened catch-up instead of a backlog.
- The closing mood check and recap occur at 10 p.m.
- Timezone changes must never duplicate content or create notification bursts.

## Planned next slices

1. Local recap/history models and user-controlled retention, without free-text capture before safety review.
2. Reviewed content-package schema, validator, and coverage simulation.
3. On-device safety boundary and verified Nigeria resource package.
4. Auth, trusted-device keys, recovery setup, and ciphertext-only sync.
