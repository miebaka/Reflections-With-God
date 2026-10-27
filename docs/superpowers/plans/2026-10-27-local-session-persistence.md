# Phase 2B — Local Session Persistence Implementation Plan

**Goal:** Restore the current day safely on one trusted device without adding cloud sync, free writing, or false encryption claims.

**Architecture:** Keep serialization and restore policy pure and framework-independent. The application depends on a small repository interface; React Native storage is confined to infrastructure. Persist only the structured Phase 2A session, use an explicit schema version, validate every field on restore, and discard corrupt, expired, future-dated, or wrong-day snapshots.

**Tech stack:** TypeScript, Vitest, Expo/React Native, AsyncStorage.

## Non-goals and gates

- No reflections, prayer edits, recaps, or other free text.
- No cloud synchronization, accounts, analytics, or remote AI.
- No claim that AsyncStorage provides end-to-end encryption. Phase 6 remains the encryption boundary.
- No migration from unknown future schemas; fail closed to a fresh session.
- No persistence of development Scripture fixture text.

## Task 1: Versioned session snapshot and restore policy

**Files:**
- Create: `src/app/sessionSnapshot.ts`
- Test: `src/app/sessionSnapshot.test.ts`

1. Write failing tests for round-trip restoration, schema rejection, malformed nested state, wrong local date, future timestamps, expired snapshots, and absence of Scripture text.
2. Implement an explicit JSON-safe DTO and structural decoder. Convert every date deliberately; never cast parsed JSON directly to `AppSession`.
3. Enforce one local calendar day and a bounded 24-hour session lifetime.
4. Run the focused tests and commit.

## Task 2: Repository boundary and AsyncStorage adapter

**Files:**
- Create: `src/app/sessionRepository.ts`
- Create: `src/infrastructure/asyncStorageSessionRepository.ts`
- Test: `src/infrastructure/asyncStorageSessionRepository.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

1. Define `load`, `save`, and `clear` without exposing AsyncStorage to application code.
2. Add the Expo-compatible AsyncStorage package.
3. Test adapter key isolation, replacement, clearing, and storage failures using an injected storage port.
4. Commit.

## Task 3: Hydrate and save the application shell

**Files:**
- Modify: `src/app/AppRoot.tsx`
- Create: `src/app/sessionController.ts`
- Test: `src/app/sessionController.test.ts`
- Modify: `README.md`
- Modify: `docs/architecture.md`

1. Write failing controller tests proving that UI state is not overwritten before hydration, invalid snapshots become a fresh session, valid same-day snapshots restore, subsequent changes save, and reset clears storage.
2. Integrate a small controller/hook boundary into `AppRoot`; show a neutral loading state while storage is read.
3. Document exactly what is persisted and what remains gated.
4. Run `npm test`, `npm run typecheck`, `npx expo-doctor`, and `git diff --check`.
5. Request final review, resolve important findings once, and commit.

## Completion criteria

- Relaunching on the same local day restores the structured check-in or journey.
- Corrupt, stale, wrong-day, unsupported, and future-dated data fail closed to a fresh session.
- Reset removes the snapshot.
- No private free text or Scripture body is stored.
- All verification passes and the branch remains isolated until explicitly merged.
