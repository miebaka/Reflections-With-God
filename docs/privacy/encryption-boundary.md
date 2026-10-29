# User-controlled encryption boundary

Phase 6 establishes a client-side contract for private history. Reflections, prayer edits, mood history, and recaps are authenticated and encrypted before a persistence or synchronization boundary receives them. The sync contract accepts only ciphertext envelopes and deletion tombstones; there is no plaintext upload method.

## Key ownership and recovery

The device creates a random 256-bit history key. It also creates a separate high-entropy recovery secret that wraps that key. The recovery secret must be shown to, exported by, and confirmed by the user before cloud history is enabled. It is not a password and must never be uploaded or logged.

Each trusted device has a public/secret key pair. Only the public key is shareable. A history key can be wrapped to an active device after approval by an existing trusted device or successful local use of the recovery secret. Device secret keys and active history keys use Expo SecureStore with the device-only accessibility class; there is deliberately no AsyncStorage fallback.

Revoking a device suspends synchronization until retained records have been decrypted locally and re-encrypted with a new history key. Losing every trusted device and the recovery secret permits account recovery but makes private history permanently unrecoverable. Product copy must explain that consequence before recovery setup and final account recovery.

## Retention and deletion

Supported private-history retention policies are 24 hours, 30 days, one year, and until deleted. Retention metadata stays inside the encrypted record; a trusted device decrypts it locally and creates an opaque tombstone when the deadline passes. User deletion and account deletion use the same explicit deletion protocol. A production service must publish its deletion deadline, delete recoverable backups and derived personalization data, and return a durable confirmation; this repository does not yet claim those server guarantees.

## Security properties and remaining gates

- The only record metadata outside ciphertext is a generated opaque identifier and key version. Record kind, exact timestamp, retention choice, and content remain encrypted. The opaque identifier is also authenticated inside the plaintext and checked after decryption.
- Recovery wrapping uses a generated 256-bit secret and domain-separated hashing. User-created passwords are not accepted; adding them requires a reviewed memory-hard KDF.
- `tweetnacl` supplies XSalsa20-Poly1305 authenticated encryption and X25519-compatible device boxes. Expo Crypto supplies operating-system randomness in application wiring.
- Security logs and analytics must never contain secrets, decrypted text, recovery material, mood history, or prayer edits.

This is a foundation, not an independent cryptographic audit. External alpha remains blocked on an independent threat-model and cryptographic review, Nigerian privacy/legal review, production authentication and sync-service implementation, backup-deletion verification, recovery usability testing, and penetration testing.
