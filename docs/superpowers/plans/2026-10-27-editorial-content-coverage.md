# Phase 3B — Editorial Content Validation and Coverage Plan

**Goal:** Make content packages fail closed unless every unit is structurally complete, theologically accountable, prayer-safe, and the enabled emotional states have enough distinct reviewed passages for a full day.

**Architecture:** Extend the framework-independent editorial layer. A content package combines the Phase 3A manifest with structured units and approved prayer blocks. Pure validators report deterministic issues. A coverage simulator evaluates the exact alpha matrix without using AI or embedding production Scripture.

## Task 1 — Structured editorial unit contract

- Define canonical passage ranges, theological purposes, movement stages, contraindications, difficult-text classification, unit audit records, and prayer building blocks.
- Require pastor, scholar, safety, and final approvals for the exact unit version.
- Validate translation consistency with the package manifest.
- Enforce nonblank context/reflection content and explicit prayer closure in Jesus’ name.
- Add prohibited-claim screening for deterministic phrases and structured policy flags.

## Task 2 — Package validator

- Reject duplicate unit IDs, duplicate version identities, conflicting canonical passage IDs, retired/draft units in active pools, missing prayer-block categories, and invalid audit chronology.
- Keep Bible text validation to identity, rights linkage, and nonblank presence; do not pretend to verify textual fidelity without an approved source corpus.
- Add adversarial tests for malformed and partially approved packages.

## Task 3 — Coverage matrix and simulator

- Evaluate 29 distinct eligible passage IDs for each enabled single-emotion day.
- Require three candidates for every supported emotion/intensity/applicable movement tuple.
- Require 20 distinct grounding fallbacks.
- Simulate configured mixed-emotion combinations and 100 deterministic day seeds.
- Fail on duplicate passage, contraindication, unapproved content, missing prayer coverage, or pool exhaustion.

## Task 4 — Documentation and verification

- Document what the validator proves and what remains external: translation authorization, actual reviewer credentials, canonical text fidelity, cryptographic signature verification, and human theological judgment.
- Run focused tests, full tests, typecheck, Expo Doctor, and diff checks.
- Commit and push every completed checkpoint to GitHub.

## Release boundary

No production Scripture text or approval claim is introduced in this phase. Passing structural and coverage validation is necessary but not sufficient for activation.
