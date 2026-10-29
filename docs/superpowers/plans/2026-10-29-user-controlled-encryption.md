# Phase 6 — User-Controlled Encryption and Ciphertext Sync

**Status:** Client foundation implemented on 2026-10-29; production service and independent review gates remain open.

## Goal

Private reflections, prayer edits, mood history, and recaps are encrypted on the device before persistence or transport. The operator cannot decrypt them, account recovery remains separate from private-history recovery, and every destructive or recovery consequence is explicit.

## Architecture

- A random 256-bit history key encrypts authenticated private-record envelopes.
- Encrypted plaintext includes the record identity and retention metadata so outer metadata substitution is detected during decryption.
- A separate high-entropy recovery secret wraps the history key. It is confirmed before sync can be enabled and is never uploaded.
- Trusted devices use X25519-compatible `tweetnacl.box` key pairs. A device public key may leave the device; its secret key remains in platform secure storage.
- Sync accepts only versioned ciphertext envelopes and tombstones. It has no plaintext-shaped API.
- Rotation decrypts locally with the prior key and re-encrypts locally with the new key. Revocation blocks future device access and requires rotation before sync can resume.

## Task 1 — Cryptographic envelope and recovery

- Add strict record kinds, retention policies, encrypted envelope validation, authenticated encryption, and metadata-binding tests.
- Generate a history key and human-transferable high-entropy recovery secret.
- Wrap and unwrap the history key with the recovery secret; reject incorrect secrets and tampered envelopes.

## Task 2 — Trusted-device boundary and secure storage

- Generate device key pairs and wrap the history key to an approved device public key.
- Add a key-vault interface and an Expo SecureStore implementation that never falls back to AsyncStorage.
- Model device approval, revocation, and sync suspension pending key rotation.

## Task 3 — Ciphertext-only sync, retention, and deletion

- Define a transport contract containing only ciphertext envelopes, tombstones, opaque account/device identifiers, and monotonic revisions.
- Validate all inbound and outbound payloads and reject unknown or plaintext-like fields.
- Add retention expiry, tombstone generation, account-deletion intent, idempotent acknowledgements, and local deletion confirmation.

## Task 4 — Rotation, documentation, and verification

- Re-encrypt retained records locally during key rotation.
- Document unrecoverable-loss behavior and the exact boundary still requiring independent security/legal review.
- Run TypeScript, unit tests, Expo diagnostics, and the Android build workflow before external testing.

## Non-goals and release gates

- No claim of independent cryptographic review.
- No production cloud provider, authentication service, or privacy-policy approval is implied.
- Recovery secrets are high-entropy generated secrets, not passwords; password-derived keys require a separately reviewed memory-hard KDF.
- External alpha remains blocked on privacy threat-model, cryptographic, Nigerian legal, deletion, and operational review.
