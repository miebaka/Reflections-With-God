# Offline Journey Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the deterministic offline domain engine that turns confirmed emotions into a humane daily arc and selects only eligible reviewed content without repetition.

**Architecture:** Pure TypeScript domain modules own mood, direction, arc, selection, and journey transitions; React Native imports these modules but they never import React Native. Selection is progressive and deterministic given explicit inputs, while content and storage remain injected contracts so later reviewed packages and encrypted persistence can replace development fixtures.

**Tech Stack:** Expo 58, React Native 0.88, TypeScript 6 strict mode, Vitest 4.

**Spec:** `Reflections With God PRD.md`

## Global Constraints

- iOS and Android; Nigeria alpha and beta; legal adults only.
- One to three emotions, each with `mild`, `moderate`, or `strong`, or the distinct `unknown` state.
- The user may accept, edit, or replace the proposed direction; confirmed user input outranks inference.
- Difficult emotions may be held before movement; no forced positivity or same-day happiness promise.
- A complete unit contains Scripture, essential context, reflection, and prayer; Bible text is never generated.
- Only content with all required approvals is selectable; contentious/difficult material is excluded from mood-responsive delivery.
- No exact passage repeats in one local calendar day; a reviewed grounding fallback is used when no specific match is safe.
- Units become available every 30 minutes through 10 p.m.; two-hour check-ins are optional and change future scheduled units only.
- Missed moments collapse into one calm catch-up; superseded units do not appear as history or engagement.
- No streaks, points, badges, levels, scores, debt, shame, competition, or moral interpretation of behavior.
- Private text, cloud synchronization, safety classification, and production Scripture ingestion are outside this phase and must not be simulated as complete.

## Review Focus

- A start at or after 10 p.m. must not create a next-day closing unit or a false active journey; Task 4 pins this boundary.
- Mixed positive and difficult emotions must not let positivity bypass an acknowledge/hold stage; Task 2 pins this ordering.
- An approved passage with a matching mood but a contraindication must never rank above a safe grounding fallback; Task 3 pins this filter.
- A check-in at the exact time a unit becomes available must preserve the available unit and recalculate only later scheduled units; Task 4 pins this transition.
- Duplicate canonical passage IDs under different content-unit versions must still count as the same passage that day; Task 3 pins canonical deduplication.

---

### Task 1: Confirmed Mood and Direction Model

**Files:**
- Modify: `src/domain/checkIn.ts`
- Modify: `src/domain/checkIn.test.ts`
- Create: `src/domain/direction.ts`
- Create: `src/domain/direction.test.ts`

**Interfaces:**
- Consumes: existing `Emotion` and `Intensity` labels from `src/domain/checkIn.ts`.
- Produces: `EmotionSelection { emotion: Emotion; intensity: Intensity }`, `MoodCheckIn`, `validateCheckIn(checkIn): CheckInError[]`, `toggleEmotionSelection(current, emotion, defaultIntensity?): EmotionSelection[]`, `updateEmotionIntensity(current, emotion, intensity): EmotionSelection[]`, `HealthyDirection`, and `proposeDirection(checkIn): DirectionProposal`.

- [ ] **Step 1: Write failing tests for one-to-three per-emotion selections**

Add tests asserting duplicate emotions are rejected, a fourth selection is ignored, intensity updates only the named emotion, and `unknown` remains valid without selections.

- [ ] **Step 2: Run the Task 1 tests and verify RED**

Run: `npm test -- src/domain/checkIn.test.ts src/domain/direction.test.ts`

Expected: FAIL because `EmotionSelection`, intensity update, and direction exports do not exist and the old model accepts duplicate emotion strings.

- [ ] **Step 3: Implement the confirmed mood model**

In `src/domain/checkIn.ts`, replace `KnownMood.emotions` with `KnownMood.selections: readonly EmotionSelection[]`; preserve the `unknown` discriminant and return an explicit `duplicate-emotion` validation error.

- [ ] **Step 4: Implement `proposeDirection(checkIn: MoodCheckIn): DirectionProposal`**

In `src/domain/direction.ts`, return reviewed plain-language direction IDs. Difficult or mixed states begin with `acknowledge-and-ground`; purely positive states begin with `sustain-with-gratitude`; unknown begins with `gentle-awareness`. Mark every proposal as requiring user confirmation.

- [ ] **Step 5: Run Task 1 tests and full suite**

Run: `npm test -- src/domain/checkIn.test.ts src/domain/direction.test.ts && npm test && npm run typecheck`

Expected: all tests PASS and TypeScript exits 0.

- [ ] **Step 6: Commit**

```bash
git add src/domain/checkIn.ts src/domain/checkIn.test.ts src/domain/direction.ts src/domain/direction.test.ts
git commit -m "feat: model confirmed moods and directions"
```

### Task 2: Invisible Emotional Arc

**Files:**
- Create: `src/domain/arc.ts`
- Create: `src/domain/arc.test.ts`

**Interfaces:**
- Consumes: `MoodCheckIn` and confirmed `HealthyDirection` from Task 1.
- Produces: `ArcStage`, `EmotionalArc`, `createEmotionalArc(checkIn, direction): EmotionalArc`, and `adaptEmotionalArc(arc, comparison): EmotionalArc`, where comparison is `worse | unchanged | better`.

- [ ] **Step 1: Write failing arc tests**

Assert difficult and mixed moods start `acknowledge`, positive-only moods start `gratitude`, unknown starts `awareness`, every arc ends `close`, `worse` inserts or retains grounding without advancing, and `better` moves future stages toward consolidation without skipping closing.

- [ ] **Step 2: Run the Task 2 tests and verify RED**

Run: `npm test -- src/domain/arc.test.ts`

Expected: FAIL because `src/domain/arc.ts` does not exist.

- [ ] **Step 3: Implement the arc functions**

Use ordered stage IDs only; expose no score or progress percentage. Mixed positive/difficult selections follow the difficult-state opening so joy cannot bypass acknowledgment.

- [ ] **Step 4: Run Task 2 tests and full suite**

Run: `npm test -- src/domain/arc.test.ts && npm test && npm run typecheck`

Expected: all tests PASS and TypeScript exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/domain/arc.ts src/domain/arc.test.ts
git commit -m "feat: add humane emotional arc rules"
```

### Task 3: Reviewed Content Selection

**Files:**
- Modify: `src/domain/content.ts`
- Create: `src/domain/selection.ts`
- Create: `src/domain/selection.test.ts`

**Interfaces:**
- Consumes: `EmotionSelection` from Task 1 and `ArcStage` from Task 2.
- Produces: `ContentStatus`, `PassageId`, `ContentUnit`, `SelectionRequest`, `SelectionResult`, and `selectContent(request, catalogue): SelectionResult` with outcomes `specific | grounding-fallback | unavailable`.

- [ ] **Step 1: Write failing selection tests**

Use local fixtures to assert selection excludes incomplete approvals, retired units, difficult-topic units, contraindications, and canonical passage IDs already delivered today; prefers a fitting approved unit; falls back to approved grounding content; and returns `unavailable` when even fallback is exhausted.

- [ ] **Step 2: Run the Task 3 tests and verify RED**

Run: `npm test -- src/domain/selection.test.ts`

Expected: FAIL because `selectContent` and the expanded content metadata do not exist.

- [ ] **Step 3: Implement content metadata and `selectContent`**

Require pastor, scholar, safety, and final approval flags plus an approval timestamp. Deduplicate on canonical `passageId`, not unit version. Keep the development fixture explicitly non-publishable.

- [ ] **Step 4: Run Task 3 tests and full suite**

Run: `npm test -- src/domain/selection.test.ts && npm test && npm run typecheck`

Expected: all tests PASS and TypeScript exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/domain/content.ts src/domain/selection.ts src/domain/selection.test.ts
git commit -m "feat: enforce reviewed content selection"
```

### Task 4: Journey State Machine and Schedule Recovery

**Files:**
- Modify: `src/domain/journey.ts`
- Modify: `src/domain/journey.test.ts`

**Interfaces:**
- Consumes: `MoodCheckIn` from Task 1 and `EmotionalArc` from Task 2.
- Produces: `createDailyJourney(checkIn, arc, now): DailyJourney`, `advanceJourney(journey, event): DailyJourney`, `applyOptionalCheckIn(journey, checkIn, arc, at): DailyJourney`, and audit-safe `SupersessionRecord` values.

- [ ] **Step 1: Write failing state-machine tests**

Assert an 8 a.m. start has 29 passage slots including both endpoints, a late start has one immediate opening plus one catch-up marker and joins the next half-hour, a start at/after 10 p.m. returns `closed`, opening a unit follows allowed transitions only, catch-up records only ID/time/reason, and a check-in at an exact boundary preserves the available unit while invalidating later scheduled reservations.

- [ ] **Step 2: Run the Task 4 tests and verify RED**

Run: `npm test -- src/domain/journey.test.ts`

Expected: FAIL because the journey APIs, catch-up marker, closed result, and transition enforcement do not exist.

- [ ] **Step 3: Implement the journey state machine**

Represent schedule slots independently from selected content. Reject invalid transitions without mutating the journey. Superseded history stores only unit ID, timestamp, and a reason code.

- [ ] **Step 4: Run Task 4 tests and full suite**

Run: `npm test -- src/domain/journey.test.ts && npm test && npm run typecheck`

Expected: all tests PASS and TypeScript exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/domain/journey.ts src/domain/journey.test.ts
git commit -m "feat: add journey state transitions and recovery"
```

### Task 5: Integrate the Foundation Preview

**Files:**
- Modify: `src/app/AppRoot.tsx`
- Create: `src/app/checkInViewModel.ts`
- Create: `src/app/checkInViewModel.test.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes: Task 1 confirmed mood/direction and Task 4 journey creation contracts.
- Produces: a UI-facing `CheckInDraft` with pure update helpers and an app flow that confirms a proposed direction before creating the preview journey.

- [ ] **Step 1: Write failing view-model tests**

Assert each selected emotion retains its own intensity, changing one intensity leaves others unchanged, unknown clears selections, and journey submission is disabled until known selections or unknown plus direction confirmation are present.

- [ ] **Step 2: Run the Task 5 tests and verify RED**

Run: `npm test -- src/app/checkInViewModel.test.ts`

Expected: FAIL because the view-model module does not exist.

- [ ] **Step 3: Implement the view model and update `AppRoot`**

Render per-emotion intensity controls, a plain-language proposed direction confirmation step, and the existing visibly draft Scripture preview. Do not add free writing, notifications, persistence, analytics, or production-content claims.

- [ ] **Step 4: Update the README milestone and phase links**

Document implemented Phase 1 behavior and retain explicit release blockers.

- [ ] **Step 5: Run all verification**

Run: `npm test && npm run typecheck && npx expo-doctor`

Expected: all tests PASS, TypeScript exits 0, and Expo Doctor reports all checks passed.

- [ ] **Step 6: Commit**

```bash
git add src/app/AppRoot.tsx src/app/checkInViewModel.ts src/app/checkInViewModel.test.ts README.md
git commit -m "feat: integrate confirmed journey preview"
```
