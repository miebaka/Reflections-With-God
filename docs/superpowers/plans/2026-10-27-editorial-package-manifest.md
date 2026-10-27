# Editorial Package Manifest Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a fail-closed, versioned editorial-package manifest that proves translation-rights review, editorial-constitution approval, required doctrinal exclusions, and accountable reviewers before production content can be ingested.

**Architecture:** A framework-independent TypeScript schema represents accountable approvals and verified translation terms without embedding production Scripture. A pure validator returns structured issues and never treats a present string, “open source” label, or unverified signature metadata as approval. Package activation and cryptographic signature verification are deliberately deferred to the next Phase 3 slice.

**Tech Stack:** TypeScript 6 strict mode and Vitest 4.

**Spec:** `Reflections With God PRD.md`, especially EDT-001–003 and EDG-001–005.

## Global Constraints

- No production Scripture text or translation ingestion before written rights approval.
- “Open source” is not a legal conclusion.
- Translation review must explicitly record quotation, attribution, modification, offline storage, API use, and redistribution outcomes.
- The editorial constitution requires approval by at least one ordained pastor and one biblical scholar; neither substitutes for the other.
- The exclusion register must address baptism, communion, predestination, spiritual gifts, gender roles, sexuality, healing claims, prosperity teaching, deliverance claims, and end-times systems.
- Reviewer identity, role, date, content version, and reason are required for accountable approval records.
- Draft, incomplete, malformed, expired, or unverified manifests fail closed.
- No production content, private user data, AI provider, or network transport is introduced in this slice.

## Review Focus

- Duplicate approvals from one person holding multiple roles must not satisfy the pastor-plus-scholar rule.
- Invalid dates and versions must fail rather than sort or compare unpredictably.
- A rights record must distinguish prohibited/not-applicable terms from terms nobody reviewed.
- Exclusion matching must use stable IDs, not display-label spelling.
- Signature metadata must not be described or treated as cryptographically verified.

---

### Task 1: Fail-Closed Editorial Manifest

**Files:**
- Create: `src/editorial/manifest.ts`
- Create: `src/editorial/manifest.test.ts`
- Create: `docs/editorial/package-contract.md`
- Modify: `README.md`

**Interfaces:**
- Produces: `EditorialPackageManifest`, `ApprovalRecord`, `TranslationRightsRecord`, `EditorialConstitutionRecord`, `ManifestIssue`, `requiredExclusionIds`, and `validateEditorialManifest(manifest, now): ManifestIssue[]`.
- Consumes: no runtime application or private-user interfaces.

- [ ] **Step 1: Write failing manifest tests**

Assert a complete literal manifest returns no issues; “open source” without a written approval record fails; every required translation term needs a recorded outcome; pastor and scholar approvals require distinct reviewer IDs; every required exclusion ID is present; invalid semantic versions and timestamps fail; retired or expired manifests fail; and signature metadata remains `unverified` rather than being accepted as proof.

- [ ] **Step 2: Run the manifest test and verify RED**

Run: `npm test -- src/editorial/manifest.test.ts`

Expected: FAIL because `src/editorial/manifest.ts` does not exist.

- [ ] **Step 3: Implement the types and pure validator**

Use stable string IDs, explicit role unions, ISO timestamps, semantic package versions, and structured issue codes. Require all six rights-review dimensions to exist with `permitted | prohibited | not-applicable` plus a rationale; do not require every right to be permitted.

- [ ] **Step 4: Document the package contract and boundary**

Explain that this manifest is necessary but not sufficient: the next Phase 3 slices add unit validation, coverage simulation, cryptographic verification, activation, retirement, and rollback. State that no translation has been selected or approved by this code.

- [ ] **Step 5: Run all verification**

Run: `npm test && npm run typecheck && npx expo-doctor`

Expected: all tests PASS, TypeScript exits 0, and Expo Doctor reports all checks passed.

- [ ] **Step 6: Commit**

```bash
git add src/editorial/manifest.ts src/editorial/manifest.test.ts docs/editorial/package-contract.md README.md
git commit -m "feat: add editorial package manifest gate"
```
