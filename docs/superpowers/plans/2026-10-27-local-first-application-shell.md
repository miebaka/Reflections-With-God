# Local-First Application Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the preview-only component with a deterministic application shell covering adult eligibility, morning check-in, direction confirmation, an honest active/closed journey home, and a calm timeline projection.

**Architecture:** A pure application reducer owns navigation and session state while domain modules continue to own mood, arc, selection, and journey rules. Pure presenters derive user-facing timeline data from the domain state; React Native screens dispatch application events and contain no scheduling decisions. Sensitive journey data remains memory-only in this phase because user-controlled encryption and on-device safety boundaries are not yet implemented.

**Tech Stack:** Expo 58, React Native 0.88, React 19, TypeScript 6 strict mode, Vitest 4.

**Spec:** `Reflections With God PRD.md`

## Global Constraints

- Legal adults only for Nigeria alpha and beta; eligibility must be an explicit attestation.
- Product boundaries must say spiritual support is not therapy, diagnosis, crisis care, prophecy, or a replacement for church or professional care.
- Known check-ins require one to three per-emotion intensity selections; unknown mood remains distinct.
- A proposed direction is not used until the user confirms or replaces it.
- Journey state and private mood data remain in memory; no plaintext persistence, analytics, or cloud transport.
- The home surface shows current availability and optional check-ins without unread debt, scores, streaks, completion percentages, or pressure.
- Closed days do not display an opening Scripture preview or claim that zero moments remain.
- Development Scripture remains visibly draft and cannot be selected by the production selection boundary.
- Accessibility semantics, minimum 44-point targets, scalable text, non-color selection indicators, and clear focus order are required.

## Review Focus

- A user who has not attested age must never reach mood or journey screens through reducer events.
- Repeated begin/confirm events must not create multiple daily journeys.
- A closed journey at or after 10 p.m. must render a calm closed state, not draft Scripture.
- Timeline projection must exclude superseded units and never label unopened moments as overdue or behind.
- Resetting the in-memory session must remove the mood and journey without implying cloud or permanent account deletion.

---

### Task 1: Application Session Reducer

**Files:**
- Create: `src/app/session.ts`
- Create: `src/app/session.test.ts`

**Interfaces:**
- Consumes: `CheckInDraft`, `DailyJourney`, `createDailyJourney`, and `createEmotionalArc`.
- Produces: `AppSession`, `AppEvent`, `initialAppSession`, and `reduceAppSession(session, event): AppSession`.

- [ ] **Step 1: Write failing reducer tests**

Assert age attestation is required before check-in; a valid confirmed draft creates exactly one journey; duplicate confirmation preserves the existing journey; a closed journey routes to `day-closed`; and `reset-session` clears mood and journey state.

- [ ] **Step 2: Run the Task 1 test and verify RED**

Run: `npm test -- src/app/session.test.ts`

Expected: FAIL because `src/app/session.ts` does not exist.

- [ ] **Step 3: Implement the pure reducer**

Use screens `welcome | check-in | direction | journey | day-closed`. Inject `now` on the confirmation event so tests and platform callers control time. Invalid or duplicate events return the same state object.

- [ ] **Step 4: Run Task 1 and full verification**

Run: `npm test -- src/app/session.test.ts && npm test && npm run typecheck`

Expected: all tests PASS and TypeScript exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/app/session.ts src/app/session.test.ts
git commit -m "feat: add application session reducer"
```

### Task 2: Calm Timeline Projection

**Files:**
- Create: `src/app/timeline.ts`
- Create: `src/app/timeline.test.ts`

**Interfaces:**
- Consumes: `DailyJourney` and its unit states from Phase 1.
- Produces: `TimelineItem`, `TimelineSummary`, and `projectTimeline(journey, now): TimelineSummary`.

- [ ] **Step 1: Write failing projection tests**

Assert the projection exposes the current available passage, shows one catch-up without debt language, excludes superseded units, represents optional check-ins as opportunities rather than tasks, returns a next-availability time, and returns `closed` without an opening unit for a closed journey.

- [ ] **Step 2: Run the Task 2 test and verify RED**

Run: `npm test -- src/app/timeline.test.ts`

Expected: FAIL because `src/app/timeline.ts` does not exist.

- [ ] **Step 3: Implement the pure presenter**

Return semantic data and calm approved labels only; do not calculate scores, percentages, backlogs, or overdue counts.

- [ ] **Step 4: Run Task 2 and full verification**

Run: `npm test -- src/app/timeline.test.ts && npm test && npm run typecheck`

Expected: all tests PASS and TypeScript exits 0.

- [ ] **Step 5: Commit**

```bash
git add src/app/timeline.ts src/app/timeline.test.ts
git commit -m "feat: project a calm daily timeline"
```

### Task 3: Screen Integration and Closed-Day Experience

**Files:**
- Modify: `src/app/AppRoot.tsx`
- Create: `src/app/screenModel.ts`
- Create: `src/app/screenModel.test.ts`
- Create: `src/ui/components/PrimaryButton.tsx`
- Create: `src/ui/components/SelectionChip.tsx`
- Modify: `README.md`

**Interfaces:**
- Consumes: `reduceAppSession` from Task 1 and `projectTimeline` from Task 2.
- Produces: `getScreenModel(session, now): ScreenModel` and a reducer-driven accessible shell for welcome, check-in, direction, active journey, and closed-day states.

- [ ] **Step 1: Write failing screen-model integration tests**

Assert the complete welcome → age attestation → known mood → direction confirmation path yields the active journey screen at 8 a.m. and the calm closed-day screen at 10 p.m.; assert the closed model contains no Scripture unit.

- [ ] **Step 2: Run the integration test and verify RED**

Run: `npm test -- src/app/screenModel.test.ts`

Expected: FAIL because `src/app/screenModel.ts` does not exist.

- [ ] **Step 3: Refactor `AppRoot` onto the reducer and focused controls**

Implement the pure screen model, remove parallel screen/journey state, dispatch reducer events, render per-emotion intensity and direction choices, use timeline projection for journey metadata, and render a quiet closed-day message without draft Scripture.

- [ ] **Step 4: Update milestone documentation**

Record the Phase 2A application-shell behavior and explicitly state that private persistence, history, prayer editing, recap, notifications, safety, and encryption remain gated.

- [ ] **Step 5: Run all verification**

Run: `npm test && npm run typecheck && npx expo-doctor`

Expected: all tests PASS, TypeScript exits 0, and Expo Doctor reports all checks passed.

- [ ] **Step 6: Commit**

```bash
git add src/app/AppRoot.tsx src/app/screenModel.ts src/app/screenModel.test.ts src/ui/components/PrimaryButton.tsx src/ui/components/SelectionChip.tsx README.md
git commit -m "feat: integrate local-first application shell"
```
