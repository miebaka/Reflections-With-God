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

## Safety model

Any free-text surface must pass through an on-device safety interface before encryption or sync. A high-risk result pauses the Scripture journey and presents manually verified Nigerian crisis and pastoral resources. The journey resumes only after the user confirms they are safe, beginning with reviewed comfort content.

The current foundation does not yet expose free writing, so it cannot accidentally ship an unprotected text surface.

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

1. Application reducer and encrypted local persistence interface.
2. Reviewed content-package schema, validator, and coverage simulation.
3. Local notification scheduler with the three-push Rhythm default.
4. On-device safety boundary and verified Nigeria resource package.
5. Auth, trusted-device keys, recovery setup, and ciphertext-only sync.
