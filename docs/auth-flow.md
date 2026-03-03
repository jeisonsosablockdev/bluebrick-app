# Auth Flow (SIWS)

## Scope
- Feature: Phantom wallet connection + Sign-In With Solana (SIWS) via message signing only, exposed in an on-demand modal.

## SIWS Flow
1. Nonce issued by server:
   - `GET /api/auth/nonce` returns a single-use nonce with 5-minute TTL.
2. Message signed by wallet:
   - Client builds a deterministic SIWS message with `domain`, `address`, `statement`, `nonce`, `issuedAt`.
   - Phantom signs UTF-8 bytes using `wallet.signMessage()`.
3. Signature verified server-side:
   - `POST /api/auth/verify` validates message format and field consistency.
   - Domain in signed message must match request host.
   - Signature is verified with `tweetnacl` against the provided Solana public key.
   - Nonce must exist and is consumed after successful signature verification.
4. Session established:
   - Server creates session token and sets `httpOnly` cookie (`siws_session`).
   - App Router server component reads cookie and resolves authenticated wallet.
5. UI integration:
   - Existing page remains visible and unchanged.
   - User opens wallet auth flow from a top-right `Connect Wallet` button.
   - SIWS controls are rendered only inside the modal.

## Trust Boundaries
- Client responsibilities:
  - Request nonce, build message, request wallet signature, submit payload.
  - Never trusted for authority or session truth.
  - Open/close modal state and wallet UX.
- Server responsibilities:
  - All auth decisions, nonce replay protection, signature validation, cookie issuance.
- On-chain checks:
  - None required for authentication. SIWS is signature-based and does not require a transaction.
  - Optional devnet proof button is out-of-band and disabled by default.

## Replay Protection
- Nonce TTL:
  - 5 minutes.
- Nonce invalidation strategy:
  - Nonce map is in-memory, nonce is deleted on successful verification or TTL expiry.
- Duplicate signature handling:
  - Reusing same nonce returns conflict (`409`) after first successful consume.

## Error Cases
| Case | Server Response | Client Handling |
| --- | --- | --- |
| Invalid SIWS payload | `400` | Show auth error and let user retry |
| Nonce missing/expired | `409` | Request fresh nonce and retry |
| Domain mismatch | `403` | Block sign-in and surface host mismatch |
| Signature mismatch | `401` | Show failure and allow re-sign |
| Phantom not installed | Client-side error | Show non-intrusive modal error |

Last Updated: 2026-03-03 08:55:00 UTC
