# Nigeria alpha readiness

## Current decision

**Developer build:** eligible only after the current commit passes GitHub Quality, the migration suite, automated accessibility contracts, and a freshly verified APK build.

**Internal alpha:** blocked.

**Nigeria closed beta:** blocked.

**Public release:** blocked.

A successful APK is not participant-release approval. The release evaluator in `src/release/readiness.ts` requires a unique, reviewed artifact for every gate and treats failed, withdrawn, expired, duplicated, malformed, or missing evidence as a blocker.

## External blockers that code cannot clear

- Written translation rights and required attribution.
- Complete pastor and biblical-scholar approval and adversarial 29-unit coverage.
- Qualified safety-policy review and current manual verification of Nigerian crisis, clinical, pastoral, and emergency resources.
- Nigerian privacy/legal review, independent cryptographic review, deletion verification, and penetration testing.
- Manual accessibility testing with TalkBack and VoiceOver, large text, reduced motion, keyboard, focus order, and touch exploration.
- Real-device mid-range Android, intermittent-network, battery, notification, timezone, and recovery usability evidence.
- Production signing, incident-response rehearsal, beta product-fit evidence, iOS device evidence, and public-threshold safety review.
- Compatible remediation or qualified, time-bounded acceptance of the currently reported transitive Expo toolchain dependency advisories. See [the 2026-10-29 dependency audit](dependency-audit-2026-10-29.md).

## Required Android matrix

Record the exact manufacturer, model, RAM, Android version, network, battery mode, app commit, tester, date, and evidence artifact for each run.

| Class | Minimum coverage | Scenarios |
| --- | --- | --- |
| Low-end reference | 2 devices, Android 10–12 | Cold start, 29-unit day, offline restart, large text, low storage, battery saver |
| Mid-range primary | 4 devices, Android 12–16 | Full journey, notifications, timezone change, encryption/recovery, rotation, retention deletion |
| High-end control | 1 device, current Android | Comparison baseline and newest platform behavior |
| Network | Wi-Fi, stable 4G/5G, throttled 3G, intermittent, offline | Queue deduplication, cached content, no notification burst, sync recovery |

Performance evidence requires at least 20 measurements per metric from real mid-range Android devices. Simulator results are useful for regression diagnosis but cannot clear the performance gate.

## Manual accessibility matrix

- TalkBack and VoiceOver read every heading, state, checkbox, radio choice, notice, and disabled action meaningfully.
- Focus order matches visual and task order; live announcements do not interrupt Scripture reading.
- Text remains usable at 200% platform font scaling without clipping, overlap, or hidden controls.
- Every actionable target is at least 44 by 44 points/density-independent pixels.
- Normal text meets 4.5:1 contrast and non-text boundaries meet 3:1 where required.
- Reduced-motion settings remove nonessential animation; color is never the only state cue.
- Notification permission denial, offline failure, and safety interruption remain understandable without sight.

## Rollout rules

Stages advance one step at a time: staff only, 5% alpha, 25% beta, 100% beta, then public. Any open privacy incident, unresolved critical content report, unresolved safety incident, stale Nigerian resource package, deletion deadline breach, or crash-free session rate below 99% forces active participant stages back to staff only.

The 99% crash threshold and current performance budgets are provisional engineering thresholds. They must be reassessed using alpha evidence without weakening safety, privacy, accessibility, or anti-gamification requirements.
