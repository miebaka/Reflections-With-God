# Dependency audit — 2026-10-29

## Result

`npm audit --omit=dev --audit-level=high` reports eight transitive findings: five low and three high. The high findings are in `zod` and the Expo CLI/configuration dependency chain through `deepmerge`.

The audit tool's only proposed automatic remediation uses `--force` and downgrades Expo from SDK 58 to SDK 51. That is a breaking, security-relevant platform regression and has not been applied.

## Current boundary

- Expo Doctor passes all 20 compatibility checks on the current dependency set.
- The affected configuration and CLI packages participate in development, prebuild, and build processing. They are not treated as harmless merely because they are not direct application feature code.
- No risk acceptance has been granted. Public release remains blocked until patched compatible Expo dependencies are available or a qualified security review documents reachability and an explicit time-bounded acceptance.
- CI uses lockfile installation. Dependency changes require the full TypeScript, test, Expo Doctor, native-build, signature, and audit review again.

## Required follow-up

1. Track compatible Expo SDK 58 updates that remove the affected versions.
2. Re-run the production audit on every dependency update and release candidate.
3. Do not use `npm audit fix --force` when it changes the Expo SDK major or removes required native compatibility.
4. Attach the final audit output and reachability decision as release evidence; this note alone does not clear a gate.
