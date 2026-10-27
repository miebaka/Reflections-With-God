# Phase 5 — On-device Safety Boundary

**Goal:** Ensure every future private-text surface passes a deterministic on-device safety gate before persistence or transmission, while supporting strong sadness without overreacting and pausing the ordinary journey when approved explicit-risk language is detected.

## Architecture

A versioned safety policy contains reviewed explicit-risk patterns and approval evidence. The classifier runs synchronously on the device and returns only a minimal risk state; raw text is neither logged nor placed in the offline outbox. A reducer owns the interruption, safety confirmation, and reviewed-comfort resumption states. Nigeria support resources use a separately versioned package with source evidence, named verification owners, review timestamps, expiry, and release status.

## Task 1 — Local classifier and sadness nudge

- Normalize text deterministically without transmitting or retaining it.
- Trigger interruption only on explicit first-person imminent self-harm language covered by the approved policy.
- Treat strong sadness alone as a supportive nudge, never an emergency conclusion.
- Fail closed when a text surface attempts to persist without a completed screening result.
- Keep policy version and minimal result code; never include matched text in telemetry-shaped output.

## Task 2 — Safety state machine

- Pause the ordinary journey on an explicit-risk result.
- Present calm routes to a trusted person, pastor, clinician, and verified emergency support.
- Resume only after explicit user confirmation that they are safe enough to continue.
- Make the next unit require the reviewed comfort/grounding delivery class before ordinary selection resumes.
- Prevent reset, ordinary navigation, or repeated submissions from bypassing the interruption.

## Task 3 — Nigeria resource package

- Define emergency, clinical, crisis-support, pastoral-guidance, and trusted-person routes.
- Require a primary source URL, verification owner, verification time, expiry, region, availability, and contact method.
- Reject stale, duplicate, unsupported, or unapproved resources.
- Keep researched candidates non-publishable until a named human calls or otherwise manually verifies them immediately before alpha or beta.

## Task 4 — Integration and release evidence

- Add a safety interstitial and strong-sadness nudge without adding general free-writing before encryption work.
- Expose a screened-text boundary for future reflection and prayer-edit surfaces.
- Document false-negative limitations, Nigerian English review, qualified-adviser approval, and resource re-verification as release blockers.
- Run focused tests, full tests, strict TypeScript, Expo Doctor, bundle export, and diff checks.

## Non-goals

- No diagnosis, clinical triage score, therapy, automated emergency contact, server-side raw-text processing, or claims that Scripture resolves a crisis.
- No production release of researched phone numbers without recorded manual verification and qualified safety approval.
