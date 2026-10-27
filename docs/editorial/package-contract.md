# Editorial package contract

The Phase 3 editorial manifest is a fail-closed evidence envelope for a future reviewed content package. It records which translation-rights questions were reviewed, who approved the editorial constitution, which contentious subjects are excluded from personalized interpretation, and which version those decisions govern.

It does not select or approve a Bible translation. A translation identifier in a structurally valid manifest is not legal approval by itself. Product counsel or another accountable rights owner must create the written approval record referenced by the manifest after reviewing quotation, attribution, modification, offline storage, API use, and redistribution.

Pastoral and scholarly approval must come from distinct accountable reviewers. Each approval records reviewer identity, role, timestamp, governed version, and reason. Stable exclusion IDs are used instead of display labels so spelling changes cannot silently remove an exclusion.

## Content-unit and coverage gate

Phase 3B adds a structural gate for editorial units and prayer blocks. An ordinary mood-responsive unit must:

- identify one package-approved translation and canonical passage range;
- include nonblank Scripture text, essential context, reflection prompt, and theological purpose;
- declare reviewed moods, intensities, movements, contraindications, and difficult-text status;
- carry exact-version approvals from an ordained pastor, biblical scholar, safety reviewer, and content editor;
- preserve independent pastor and scholar identities and a chronological audit record;
- reference approved address, petition or gratitude, and closing prayer blocks;
- end its approved closing block explicitly in Jesus’ name; and
- pass deterministic checks for the prohibited claims currently represented by policy IDs.

The package validator rejects duplicate active identities, conflicting source strings for one canonical passage identifier, manifest failures, and any invalid unit. Coverage simulation counts distinct canonical passages, not content variants. It tests every enabled emotion-and-intensity day, every applicable emotion/intensity/movement tuple, grounding-fallback depth, configured mixed-emotion intensity assignments, and deterministic 100-seed replay days against the configured 29-slot movement sequence.

Structural readiness advances a package only to cryptographic verification. It is not activation.

## Deliberate boundary

Signature fields remain marked `unverified`. This slice does not contain trusted keys or claim cryptographic verification. A package must not become active merely because it contains signature-shaped text.

The remaining Phase 3 work adds:

- cryptographic signature verification with reviewed key management;
- atomic activation, retirement, emergency rollback, and safe fallback replacement.

The validators do not prove that a Bible quotation matches an authorized source, that a reviewer possesses the claimed credentials, that a legal rights decision is correct, or that theological judgment was sound. Those are external accountable facts whose records the package references. The prohibited-phrase screen is a deterministic backstop, not a substitute for pastoral, scholarly, safety, or editorial review.

Until those gates exist and the translation approval is real, development fixtures remain non-publishable and no production Scripture package may be ingested.
