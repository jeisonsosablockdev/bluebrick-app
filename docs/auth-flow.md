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
13. Core Candy Machine snapshot finalize (STORY-002-06, server-authoritative):
   - After mint completion, admin UI calls `/api/admin/core-candy-machine/snapshot/finalize`.
   - Backend verifies quantity by DAS (`getAssetsByGroup`) and stores immutable snapshot + on-chain proofs.
   - `Create Asset` gate is enabled only when `verificationStatus=verified` and `mint_jobs.status=completed`.
14. Marketplace purchase flow (STORY-003-04, multi-quantity + anti-bot + idempotent submit):
   - `POST /api/purchase/quote` exposes cached Candy Guard quote (`solPayment`, `startDate`, `itemsRemaining`) plus quantity contract fields (`quantityMode`, `quantity`, `totalPriceLamports`).
   - `POST /api/purchase/challenge` requires SIWS session and returns short-lived challenge payload (`challengeId`, `nonce`, `message`, `expiresAt`) bound to requested `quantity`.
   - User signs challenge message via `signMessage()`.
   - `POST /api/purchase/prepare` requires SIWS session + valid challenge signature, revalidates guard on-chain, applies anti-replay/rate-limit, validates quantity policy (`PURCHASE_QUANTITY_MODE`) and returns one pre-signed transaction (multi-mint when `quantity > 1` fits tx size) plus `idempotencyKey` (UUIDv7, TTL corto).
   - User signs with Phantom and submits via `POST /api/purchase/submit` including `attemptId + idempotencyKey`.
   - Submit locks attempt state (`FOR UPDATE`), deduplicates retries by (`wallet_public_key`, `idempotency_key`) and returns existing `submitted` state without re-send when aplica.
   - UI and backend exchange optional `x-flow-id` to correlate full request timeline in `purchase_flow_events`.
15. Profile + KYC bootstrap flow (STORY-004-02/003):
   - `GET /api/protected/profile` and `PUT /api/protected/profile` require SIWS session and are wallet-bound server-side.
   - `POST /api/protected/kyc/stripe/session` requires SIWS session, applies wallet/IP rate-limit, and creates Stripe Identity verification session.
   - KYC bootstrap also triggers AML screening (`kyc_session_started`) to keep compliance evaluation warm from session kickoff.
   - Identity documents are captured by Stripe; this app stores only provider metadata and status fields.
   - `POST /api/webhooks/stripe/identity` validates Stripe signature header and applies idempotent status projection into `compliance_status`.
   - Stripe `identity.verification_session.verified` triggers AML screening (`kyc_verified_webhook`) before returning webhook processing result.
16. AML operational endpoints (STORY-004-04):
   - `POST /api/internal/compliance/aml/screen` accepts admin SIWS session or `Authorization: Bearer <COMPLIANCE_INTERNAL_TOKEN>`.
   - `GET /api/admin/compliance/cases/:walletPublicKey/aml` returns AML snapshot + recent screenings for admin review.

## Wallet Modal UX Guardrails
- The wallet modal uses one top feedback slot for both progress (`Connecting/Signing/Verifying`) and error messages to keep UI state transitions visually consistent.
- The wallet modal closes automatically after 30 seconds without user interaction (`pointerdown`, `keydown`, `touchstart`, `wheel`).
- Any interaction while the modal is open resets the 30-second inactivity timer.
- This UX timeout never bypasses SIWS rules: nonce validation, signature verification, and role resolution remain server-side.

## Theme Selector UX Guardrails
- UI exposes a global client-side toggle to switch between dark and light theme modes.
- Selected theme is persisted in browser `localStorage` (`brids-ui-theme`) and restored on app load.
- Theme mode is presentation-only and does not change SIWS flows, cookie/session logic, nonce policy, or role authorization.

## Endpoint Map
| Endpoint | Method | Auth Required | Role Required | Behavior |
| --- | --- | --- | --- | --- |
| `/api/auth/nonce` | `GET` | No | None | Returns single-use nonce (5 min TTL) |
| `/api/auth/verify` | `POST` | No | None | Verifies SIWS signature and sets `siws_session` cookie |
| `/api/auth/me` | `GET` | Optional | None | Returns current auth payload and server-computed role |
| `/api/auth/logout` | `POST` | Optional | None | Revokes session token and clears cookie |
| `/api/protected/me` | `GET` | Yes | `user` or `admin` | Returns wallet pubkey if session exists |
| `/api/protected/profile` | `GET` | Yes | `user` or `admin` | Returns wallet-bound profile + KYC/compliance summary |
| `/api/protected/profile` | `PUT` | Yes | `user` or `admin` | Updates wallet-bound `username`, `bio`, and `avatarUrl` |
| `/api/protected/kyc/status` | `GET` | Yes | `user` or `admin` | Returns KYC status + denormalized compliance status |
| `/api/protected/kyc/stripe/session` | `POST` | Yes | `user` or `admin` | Creates Stripe Identity verification session server-side |
| `/api/internal/compliance/aml/screen` | `POST` | SIWS admin or internal token | `admin` (session mode) | Executes AML screening pipeline for a wallet and persists projection |
| `/api/admin/compliance/cases/:walletPublicKey/aml` | `GET` | Yes | `admin` | Returns AML case snapshot and recent screening history |
| `/api/purchase/quote` | `POST` | No | None | Returns cached quote from guard state (`price`, `startDate`, `remaining`) + quantity contract (`quantityMode`, `quantity`, `totalPriceLamports`) |
| `/api/purchase/challenge` | `POST` | Yes | `user` or `admin` | Issues one-time purchase challenge (`challengeId`, canonical message, TTL) bound to `quantity` |
| `/api/purchase/prepare` | `POST` | Yes | `user` or `admin` | Verifies challenge signature + anti-replay/rate-limit, validates quantity policy, revalidates guard on-chain, returns pre-signed transaction + `attemptId` + `idempotencyKey` |
| `/api/purchase/submit` | `POST` | Yes | `user` or `admin` | Requires `attemptId + idempotencyKey`, validates signed tx payer/message, locks attempt row and persists `submitted` idempotently |
| `/api/admin/ping` | `GET` | Yes | `admin` | Returns `403` unless wallet is allowlisted |
| `/api/admin/mint-orchestrator/jobs` | `POST` | Yes | `admin` | Creates a server-side mint job (`job_id`) |
| `/api/admin/mint-orchestrator/jobs` | `GET` | Yes | `admin` | Lists recent mint jobs with server progress |
| `/api/admin/mint-orchestrator/jobs/:jobId` | `GET` | Yes | `admin` | Returns a mint job snapshot |
| `/api/admin/mint-orchestrator/jobs/:jobId/next-batch` | `POST` | Yes | `admin` | Reserves next batch idempotently (`job_id + idempotency_key`) and enforces `createdBy` authority |
| `/api/admin/mint-orchestrator/jobs/:jobId/batches/:batchNo/submit` | `POST` | Yes | `admin` | Submits signed item signatures and enforces `createdBy` authority |
| `/api/admin/mint-orchestrator/jobs/:jobId/reconcile` | `POST` | Yes | `admin` | Reconciles signature confirmations via devnet RPC with `createdBy` authority check |
| `/api/admin/mint-orchestrator/jobs/:jobId/reconcile/das` | `POST` | Yes | `admin` | Reconciles submitted items via paginated DAS lookup with `createdBy` authority check |
| `/api/admin/core-candy-machine/snapshot/finalize` | `POST` | Yes | `admin` | Verifies minted quantity (DAS), persists `asset_mint_snapshots` + `asset_mint_onchain_proofs`, computes `Create Asset` gate |
| `/api/webhooks/helius/mint-orchestrator` | `POST` | No (SIWS) | None | Ingests Helius events, validates optional webhook secret, deduplicates retries, reconciles job signatures |
| `/api/webhooks/stripe/identity` | `POST` | No (SIWS) | None | Validates Stripe signature, deduplicates event id, updates KYC/compliance status |

See reusable tracing playbook: `docs/purchase-tracing.md`.

## Trust Boundaries
- Client responsibilities:
  - Request nonce, sign SIWS message, submit signature.
  - Request purchase challenge, sign canonical challenge message, and attach signature in prepare request.
  - Edit profile fields from UI, while ownership and validation remain server-enforced.
  - Trigger Stripe-hosted verification flow using server-issued session URL.
  - Request next batch, sign tx payloads, send signed payloads back, render progress.
  - In H6 console, collect signatures and optional expected addresses per batch item before submit.
- Server responsibilities:
  - Signature verification, nonce replay protection, session issuance.
  - Role calculation, authorization decisions, idempotent batch orchestration, RPC reconciliation, webhook dedupe, DAS reconciliation.
  - Enforce wallet-bound profile updates and server-side validation for `username/bio/avatarUrl`.
  - Create Stripe Identity sessions server-side and persist only provider metadata (`session_id`, `report_id`, statuses).
  - Validate Stripe webhook signatures and process events idempotently by provider event id.
  - Trigger AML screening on KYC kickoff and on Stripe verified webhooks.
  - Gate internal AML execution route with admin SIWS or `COMPLIANCE_INTERNAL_TOKEN`.
  - In purchase flow, quote cache delivery + challenge issuance + challenge signature verification + rate-limiting + on-chain revalidation in prepare + submit ownership checks.
  - Backend signs purchase transactions as mandatory Candy Guard `thirdPartySigner`.
  - Enforce permanent job mutation authority: admin actor for manual mutations must match job `createdBy`.
  - Persist final Core Candy Machine snapshot + on-chain proof evidence and compute `Create Asset` eligibility.
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
- Purchase challenge TTL: configurable (`PURCHASE_CHALLENGE_TTL_SECONDS`, default 120s).
- Purchase challenge replay protection: challenge is single-use and transitions to `consumed`; replays return `409`.
- Stripe KYC bootstrap rate limit: wallet/IP window via `STRIPE_IDENTITY_RATE_LIMIT_WINDOW_SECONDS` and `STRIPE_IDENTITY_RATE_LIMIT_MAX_ATTEMPTS`.
- Purchase quantity policy: resolved server-side via `PURCHASE_QUANTITY_MODE` (`MULTI_ENABLED` default) and `PURCHASE_MAX_QUANTITY_PER_ORDER` (default `10`). Invalid/out-of-policy values return `INVALID_QUANTITY`.
- Purchase rate limiting: configurable window/caps (`PURCHASE_RATE_LIMIT_WINDOW_SECONDS`, `PURCHASE_RATE_LIMIT_MAX_BY_WALLET`, `PURCHASE_RATE_LIMIT_MAX_BY_IP`).
- Purchase submit idempotency: `prepare` emite `idempotencyKey` server-side (UUIDv7) con TTL de 5 minutos y dedupe en DB por (`wallet_public_key`, `idempotency_key`).
- Purchase flow correlation: backend persists `purchase_flow_events` (`request/success/error`) indexed by `flow_id` for UI-driven E2E tracing.
- Webhook dedupe:
  - Exactly one webhook event ingestion per `(provider, eventId)` or `(provider, eventFingerprint)` in orchestrator memory.
  - Duplicate retries do not trigger repeated reconciliation side effects.
  - Stripe webhook processing is idempotent by `provider_event_id` and signed with `Stripe-Signature`.

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
| Prepare/submit without wallet session | `401` | User must sign in via SIWS |
| Prepare without valid challenge signature | `401/409` + `INVALID_CHALLENGE` | Request new challenge, sign again, retry |
| Challenge/prepare rate limit exceeded | `429` + `RATE_LIMITED` | Wait for window and retry |
| Submit with expired idempotency key | `409` + `TRANSACTION_FAILED` | Run `prepare` again to obtain a fresh key |
| Quantity invalid for current mode/limits | `400/409` + `INVALID_QUANTITY` | Use integer quantity within configured limits |
| Price changed between quote and prepare | `409` + `PRICE_CHANGED` | Refresh quote and retry |
| Mint not started (`startDate` future) | `409` + `MINT_NOT_STARTED` | Disable CTA / show countdown |
| Sold out (`itemsRemaining=0`) | `409` + `SOLD_OUT` | Show sold out |
| Wallet funds are insufficient | `409` + `INSUFFICIENT_FUNDS` | Inform user to fund wallet |

## STORY-006-04 Admin Authority Lifecycle
- New admin-only routes for delegate lifecycle:
  - `POST /api/admin/core-candy-machine/authorities/prepare`
  - `POST /api/admin/core-candy-machine/authorities/submit`
- Auth model:
  - Same SIWS admin gate as other `/api/admin/*` routes.
  - `payerPublicKey` is always server-bound to authenticated admin session wallet.
- Trust boundary:
  - Client can propose lifecycle metadata, but server validates role, operation, multisig evidence, quorum, cooldown, and signer/payer consistency before any submit.
- Replay/risk controls:
  - `operationId` generated server-side during prepare, then required on submit.
  - Submit validates operation state is `prepared` before sending to devnet.
  - Recovery-oriented failures return recoverable metadata (`BLOCKHASH_EXPIRED`, `CONFIRMATION_TIMEOUT`) for safe retry behavior.

Last Updated: 2026-04-01 10:45:00 UTC
