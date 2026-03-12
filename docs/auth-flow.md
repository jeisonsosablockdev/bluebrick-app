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
8. Batch orchestrator (H3, server-side):
   - Admin uses server APIs to create mint jobs, request next batch, submit signatures, and reconcile confirmations.
   - Critical orchestration logic remains backend-only.
9. Helius webhook ingestion (H4, server-side):
   - Helius calls `/api/webhooks/helius/mint-orchestrator?jobId=<jobId>` with transaction updates.
   - Server deduplicates deliveries per event (`provider + eventId` or `provider + eventFingerprint`) and reconciles signatures.
   - Optional shared secret validation via `HELIUS_WEBHOOK_SECRET`.
10. DAS paginated reconciliation (H5, server-side):
   - Admin calls `/api/admin/mint-orchestrator/jobs/:jobId/reconcile/das`.
   - Server scans devnet DAS pages (`owner` and/or `collectionAddress`) and confirms submitted items by `expectedAddress`.
   - Pagination is bounded (`page`, `limit`, `maxPages`) to avoid unbounded backend scans.
11. Admin signing orchestrator UI (H6, client + server-authoritative):
   - `/admin` exposes a signing console for jobs, batches, signatures, and reconciliation.
   - UI creates jobs, requests next batch, captures signatures per item, and submits them to backend endpoints.
   - Final authority remains server-side: role checks, item/state validation, signature uniqueness, and reconciliation rules.
12. Permanent job authority freeze (H7, server-authoritative):
   - Manual mint-orchestrator mutations are bound to the wallet that created the job (`createdBy`).
   - A different admin wallet can read job state, but cannot prepare, submit, or reconcile that job through admin endpoints.
   - Webhook reconciliation remains server-initiated and does not depend on a user wallet session.

## Endpoint Map
| Endpoint | Method | Auth Required | Role Required | Behavior |
| --- | --- | --- | --- | --- |
| `/api/auth/nonce` | `GET` | No | None | Returns single-use nonce (5 min TTL) |
| `/api/auth/verify` | `POST` | No | None | Verifies SIWS signature and sets `siws_session` cookie |
| `/api/auth/me` | `GET` | Optional | None | Returns current auth payload and server-computed role |
| `/api/auth/logout` | `POST` | Optional | None | Revokes session token and clears cookie |
| `/api/protected/me` | `GET` | Yes | `user` or `admin` | Returns wallet pubkey if session exists |
| `/api/admin/ping` | `GET` | Yes | `admin` | Returns `403` unless wallet is allowlisted |
| `/api/admin/mint-orchestrator/jobs` | `POST` | Yes | `admin` | Creates a server-side mint job (`job_id`) |
| `/api/admin/mint-orchestrator/jobs` | `GET` | Yes | `admin` | Lists recent mint jobs with server progress |
| `/api/admin/mint-orchestrator/jobs/:jobId` | `GET` | Yes | `admin` | Returns a mint job snapshot |
| `/api/admin/mint-orchestrator/jobs/:jobId/next-batch` | `POST` | Yes | `admin` | Reserves next batch idempotently (`job_id + idempotency_key`) and enforces `createdBy` authority |
| `/api/admin/mint-orchestrator/jobs/:jobId/batches/:batchNo/submit` | `POST` | Yes | `admin` | Submits signed item signatures and enforces `createdBy` authority |
| `/api/admin/mint-orchestrator/jobs/:jobId/reconcile` | `POST` | Yes | `admin` | Reconciles signature confirmations via devnet RPC with `createdBy` authority check |
| `/api/admin/mint-orchestrator/jobs/:jobId/reconcile/das` | `POST` | Yes | `admin` | Reconciles submitted items via paginated DAS lookup with `createdBy` authority check |
| `/api/webhooks/helius/mint-orchestrator` | `POST` | No (SIWS) | None | Ingests Helius events, validates optional webhook secret, deduplicates retries, reconciles job signatures |

## Trust Boundaries
- Client responsibilities:
  - Request nonce, sign SIWS message, submit signature.
  - Request next batch, sign tx payloads, send signed payloads back, render progress.
  - In H6 console, collect signatures and optional expected addresses per batch item before submit.
- Server responsibilities:
  - Signature verification, nonce replay protection, session issuance.
  - Role calculation, authorization decisions, idempotent batch orchestration, RPC reconciliation, webhook dedupe, DAS reconciliation.
  - Enforce permanent job mutation authority: admin actor for manual mutations must match job `createdBy`.
- External webhook responsibilities:
  - Helius pushes signature lifecycle events.
  - Server never trusts webhook payload blindly: optional secret + dedupe + signature-level state transition checks.
- On-chain checks:
  - Reconcile endpoint validates transaction confirmation state via devnet RPC.

## Replay Protection
- Nonce TTL: 5 minutes.
- Nonce invalidation: nonce consumed after successful verification.
- Reuse handling: consumed nonce returns `409`.
- Issued-at freshness: SIWS `issuedAt` must be within a 5-minute window.
- Webhook dedupe:
  - Exactly one webhook event ingestion per `(provider, eventId)` or `(provider, eventFingerprint)` in orchestrator memory.
  - Duplicate retries do not trigger repeated reconciliation side effects.

## Error Cases
| Case | Server Response | Client Handling |
| --- | --- | --- |
| Invalid SIWS payload | `400` | Show auth error and retry |
| Nonce missing/expired | `409` | Request fresh nonce |
| Domain mismatch | `403` | Block sign-in |
| Issued-at outside 5-minute window | `400` | Rebuild SIWS message and re-sign |
| Signature mismatch | `401` | Allow re-sign |
| Unauthorized admin access | `403` page/JSON | Block route/action |
| Unauthorized webhook secret | `401` | Retry with configured secret |
| Webhook without `jobId` | `400` | Include `jobId` in query/payload |
| DAS reconcile without scope (`owner`/`collectionAddress`) | `400` | Provide at least one scope filter |
| DAS endpoint unavailable or invalid | `502` | Retry after DAS endpoint health check |
| Duplicate signature across items | `409` | Prevent inconsistent state |
| Batch without pending items | `409` | Stop client retries and finalize flow |
| Admin wallet differs from job `createdBy` | `403` | Use creator wallet for manual mutation endpoints |

Last Updated: 2026-03-12 07:31:36 UTC
