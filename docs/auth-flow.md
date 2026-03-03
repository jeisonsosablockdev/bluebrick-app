# Auth Flow (SIWS)

## Scope
- Feature: Phantom wallet connection + Sign-In With Solana (SIWS) via message signing only.
- Wallet integration: `@solana/wallet-adapter-react` with Phantom as primary wallet.
- RBAC extension: authenticated wallet is mapped to `user`/`admin` server-side.

## SIWS Flow
1. Nonce issued by server:
   - `GET /api/auth/nonce` returns a single-use nonce with 5-minute TTL.
2. Message signed by wallet:
   - Client builds deterministic SIWS message with `domain`, `address`, `statement`, `nonce`, `issuedAt`.
   - Wallet signs message bytes via `signMessage()`.
3. Signature verified server-side:
   - `POST /api/auth/verify` validates format, host/domain, nonce, signature.
4. Session established:
   - Server creates session token and sets `httpOnly` cookie (`siws_session`).
5. Role resolved server-side:
   - Request wallet pubkey is compared against `ADMIN_WALLETS` allowlist.
   - Role is `admin` if allowlisted, otherwise `user`.
6. Session introspection:
   - `GET /api/auth/me` returns `{ authenticated, pubkey, role }` when session is valid.
7. Protected routes:
   - `/protected` and `/api/protected/me` require a valid SIWS session.
   - `/admin/**` is gated in middleware.
   - Admin pages and admin API handlers also re-check role server-side.

## Endpoint Map
| Endpoint | Method | Auth Required | Role Required | Behavior |
| --- | --- | --- | --- | --- |
| `/api/auth/nonce` | `GET` | No | None | Returns single-use nonce (5 min TTL) |
| `/api/auth/verify` | `POST` | No | None | Verifies SIWS signature and sets `siws_session` cookie |
| `/api/auth/me` | `GET` | Optional | None | Returns current auth payload and server-computed role |
| `/api/auth/logout` | `POST` | Optional | None | Revokes session token and clears cookie |
| `/api/protected/me` | `GET` | Yes | `user` or `admin` | Returns wallet pubkey if session exists |
| `/api/admin/ping` | `GET` | Yes | `admin` | Returns `403` unless wallet is allowlisted |

## Trust Boundaries
- Client responsibilities:
  - Request nonce, sign SIWS message, submit signature.
  - Render menu/UI state using server-provided auth payload.
- Server responsibilities:
  - Signature verification, nonce replay protection, session issuance.
  - Role calculation and authorization decisions.
- On-chain checks:
  - None required for SIWS auth.

## Replay Protection
- Nonce TTL: 5 minutes.
- Nonce invalidation: nonce consumed after successful verification.
- Reuse handling: consumed nonce returns `409`.
- Issued-at freshness: SIWS `issuedAt` must be within a 5-minute window.

## Error Cases
| Case | Server Response | Client Handling |
| --- | --- | --- |
| Invalid SIWS payload | `400` | Show auth error and retry |
| Nonce missing/expired | `409` | Request fresh nonce |
| Domain mismatch | `403` | Block sign-in |
| Issued-at outside 5-minute window | `400` | Rebuild SIWS message and re-sign |
| Signature mismatch | `401` | Allow re-sign |
| Unauthorized admin access | `403` page/JSON | Block route/action |

Last Updated: 2026-03-03 17:04:22 UTC
