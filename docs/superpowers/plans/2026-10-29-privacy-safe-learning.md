# Phase 7 — Privacy-Safe Learning and Optional Deeper Analysis

**Status:** Client foundation implemented on 2026-10-29; no external provider is configured and external review gates remain open.

## Goal

Improve content fit from direct user feedback while treating passive behavior as weak, temporary, and morally neutral. Permit deeper analysis only for one explicitly chosen reflection under revocable, single-use consent and a currently verified zero-training, zero-retention provider policy.

## Task 1 — Learning signal hierarchy

- Model explicit fit feedback and corrections as the strongest durable learning signals.
- Model opens, skips, and prayer editing as bounded secondary signals with 30-day recency decay.
- Never label a skip as rejection, weak faith, failure, or lack of commitment.
- Support full personalization reset and targeted correction replacement.

## Task 2 — Allow-listed analytics

- Define a closed event union containing only pseudonymous identifiers, coarse timestamps, enums, booleans, and reviewed content identifiers.
- Reject unknown keys and all raw reflections, prayers, mood text, Scripture text, recovery data, and arbitrary properties.
- Keep analytics internal and prohibit streak, score, ranking, or completion-pressure events.

## Task 3 — Per-reflection analysis consent

- Require a specific reflection, a current disclosure version, and an explicit confirmation immediately before submission.
- Permit revocation until submission and make every consent single use.
- Require successful local safety screening and an active provider assurance covering zero training, zero persistent retention, and disabled payload logging.
- Keep analysis unavailable by default when any assurance is missing, expired, or unverifiable.

## Task 4 — Documentation and verification

- Document the learning hierarchy, analysis boundary, and remaining provider/legal review gates.
- Run strict TypeScript, all tests, Expo diagnostics, and GitHub Quality checks.

## Non-goals

- No external AI provider is selected or enabled in this phase.
- No raw reflection or analysis result enters analytics.
- No learning signal overrides confirmed current mood, safety state, contraindications, editorial approval, or same-day repetition rules.
