# Editorial package contract

The Phase 3 editorial manifest is a fail-closed evidence envelope for a future reviewed content package. It records which translation-rights questions were reviewed, who approved the editorial constitution, which contentious subjects are excluded from personalized interpretation, and which version those decisions govern.

It does not select or approve a Bible translation. A translation identifier in a structurally valid manifest is not legal approval by itself. Product counsel or another accountable rights owner must create the written approval record referenced by the manifest after reviewing quotation, attribution, modification, offline storage, API use, and redistribution.

Pastoral and scholarly approval must come from distinct accountable reviewers. Each approval records reviewer identity, role, timestamp, governed version, and reason. Stable exclusion IDs are used instead of display labels so spelling changes cannot silently remove an exclusion.

## Deliberate boundary

Signature fields remain marked `unverified`. This slice does not contain trusted keys or claim cryptographic verification. A package must not become active merely because it contains signature-shaped text.

The remaining Phase 3 work adds:

- Scripture-unit metadata and content validation;
- prayer-block and prohibited-language validation;
- coverage-matrix and adversarial-day simulation;
- cryptographic signature verification with reviewed key management;
- atomic activation, retirement, emergency rollback, and safe fallback replacement.

Until those gates exist and the translation approval is real, development fixtures remain non-publishable and no production Scripture package may be ingested.
