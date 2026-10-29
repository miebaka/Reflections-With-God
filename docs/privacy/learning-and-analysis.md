# Privacy-safe learning and deeper-analysis boundary

Phase 7 adds deterministic learning and consent contracts without enabling an external analysis provider.

## Learning hierarchy

Confirmed current mood, user-edited direction, safety, editorial approval, contraindications, and same-day deduplication remain authoritative. Explicit “This fits” and “Not for me” feedback can then alter future ranking. A later correction replaces the earlier judgment for that content.

Meaningful opens, skips, and prayer edits are weak secondary clues. Their combined effect is capped at one fifth of an explicit judgment and decays to zero after 30 days. A skip does not mean rejection, weak faith, failure, or lack of commitment. Users can clear all personalization without penalty, loss messaging, or a streak consequence.

Learning signals are closed runtime schemas. Unknown fields are rejected so reflection text, prayer text, mood notes, and arbitrary metadata cannot be smuggled into the profile.

## Analytics

Analytics uses an allow-listed event union. Events contain a pseudonymous identifier, calendar day, six-hour time bucket, and only the reviewed fields required for product-quality measurement. Raw reflections, prayer edits, moods, Scripture text, recovery material, analysis results, arbitrary scores, streaks, and unknown event types are rejected.

This schema is a client boundary, not permission to deploy an analytics vendor. Vendor selection, server-side enforcement, retention, access controls, deletion, and Nigerian privacy review remain release gates.

## Optional deeper analysis

Deeper analysis is unavailable by default. It may become available only while all of the following are true:

1. The user chooses one encrypted reflection and sees the current disclosure.
2. The user confirms single-use consent and has not revoked it.
3. The exact submitted text passes the approved on-device safety screener immediately before transmission.
4. The consent reflection ID matches the submitted reflection.
5. A current provider assurance records zero training, zero persistent retention, disabled payload logging, a reviewed contract version, and a technical verification report.
6. The consent is atomically claimed before the provider call, preventing automatic replay.

The returned observation is marked transient and is not emitted to analytics or persisted by this service. Saving it as private history would require a separate, explicit user action through the Phase 5 safety and Phase 6 encryption boundaries.

No provider is configured in this repository. Contract, technical, privacy, legal, red-team, failure-retention, and deletion verification must pass before the feature is enabled for testers.
