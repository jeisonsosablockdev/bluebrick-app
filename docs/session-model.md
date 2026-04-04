# Session Model

## Scope
- Feature: SIWS-backed wallet session for Next.js App Router frontend.
- Roles: `user` and `admin` resolved from wallet allowlist on the server.

## Cookie Strategy
- Cookie type: `httpOnly`, `secure` (production), `sameSite=lax`.
- Expiration:
  - 24 hours (`maxAge` + matching server-side expiry).
- Rotation policy:
  - Session token regenerated on each successful SIWS verification.

## Session Lifecycle
1. Create session:
   - Server creates random token after SIWS verification and nonce checks.
   - Session stored in in-memory map keyed by token.
   - Cookie `siws_session` written with path `/`.
2. Refresh session:
   - Not implemented; user re-authenticates with SIWS.
3. Revoke session:
   - `POST /api/auth/logout` deletes server record and clears cookie.

## Validation Rules
- Authentication:
  - Missing/expired/unknown session token = unauthenticated.
- Role resolution:
  - If authenticated, role is computed from `ADMIN_WALLETS` and wallet pubkey.
  - Role is never trusted from client state.
- Server-side checks per request:
  - `GET /api/auth/me` exposes `{ authenticated, pubkey, role }`.
  - `GET /api/protected/me` requires a valid session and returns `401` otherwise.
  - `GET /api/protected/profile` and `PUT /api/protected/profile` require valid SIWS session and always bind writes to session wallet.
  - `GET /api/protected/kyc/status` requires valid SIWS session and only returns status for session wallet.
  - `POST /api/protected/kyc/stripe/session` requires valid SIWS session and applies wallet/IP rate limit before creating provider session.
  - `POST /api/protected/kyc/stripe/session` also triggers AML screening (`kyc_session_started`) server-side.
  - `/admin/**` middleware redirects unauthorized requests to `/403`.
  - Admin pages and `/api/admin/*` handlers perform explicit role re-checks.
  - Purchase challenge endpoint (`/api/purchase/challenge`) requires valid SIWS session.
  - Purchase mutation endpoints (`/api/purchase/prepare`, `/api/purchase/submit`) require valid SIWS session, challenge verification, and wallet ownership checks.
  - H6 signing console in `/admin` orchestrates batch signature submission, but never bypasses backend checks.
  - Mint orchestrator endpoints enforce `admin` role at handler level before any state transition.
  - H7 permanent-authority gate freezes manual job mutations to the creator wallet (`createdBy`).
  - `/api/admin/mint-orchestrator/jobs/:jobId/reconcile/das` is admin-only and never trusts client reconciliation state.
  - `/api/webhooks/helius/mint-orchestrator` does not use SIWS session; it validates optional shared secret and event dedupe.
  - `/api/webhooks/stripe/identity` does not use SIWS session; it validates `Stripe-Signature` and deduplicates by `provider_event_id`.
  - `/api/webhooks/stripe/identity` triggers AML screening (`kyc_verified_webhook`) when KYC becomes `verified`.
  - `/api/internal/compliance/aml/screen` allows admin SIWS or `Authorization: Bearer <COMPLIANCE_INTERNAL_TOKEN>`.
  - `/api/admin/compliance/cases/:walletPublicKey/aml` is admin-only and returns AML case detail for review.
  - Wallet modal inactivity auto-close (30s) is client-only UX behavior and never mutates/extends server session state.

## Authorization Layers
1. Session layer:
   - Cookie `siws_session` maps to server-side in-memory session token.
2. Role layer:
   - Role is derived from `ADMIN_WALLETS` and wallet pubkey.
3. Middleware layer:
   - `/admin/**` blocked early unless role resolves to `admin`.
4. Handler/page layer:
  - `/api/admin/ping` and `app/admin/page.tsx` repeat the role check (defense in depth).
  - `/api/protected/profile`, `/api/protected/kyc/status`, and `/api/protected/kyc/stripe/session` require authenticated wallet and never trust wallet identity from client payload.
  - `/api/purchase/challenge`, `/api/purchase/prepare`, and `/api/purchase/submit` require authenticated wallet and never trust client-provided payer identity.
  - `/api/purchase/prepare` requires valid purchase challenge signature and backend-side anti-replay/rate-limit checks, including quantity context match from challenge payload.
  - `/api/admin/mint-orchestrator/*` is backend-controlled and does not trust client workflow state.
  - Manual mutation endpoints (`next-batch`, `submit`, `reconcile`, `reconcile/das`) require `admin` role and `actorPubkey === job.createdBy`.
  - `/api/admin/core-candy-machine/snapshot/finalize` requires `admin` role and persists immutable snapshot/proofs after server-side verification.
  - `/admin` signing orchestration UI is an operator surface only; all state transitions are revalidated server-side.
5. Webhook ingress layer:
  - `POST /api/webhooks/helius/mint-orchestrator` optionally enforces `HELIUS_WEBHOOK_SECRET`.
  - Replay retries are deduplicated before signature reconciliation.
  - `POST /api/webhooks/stripe/identity` requires valid Stripe signature and idempotent event ingestion by `provider_event_id`.
  - Internal AML route accepts either SIWS-admin or internal service token and never trusts client role payload.
6. DAS read layer:
  - `POST /api/admin/mint-orchestrator/jobs/:jobId/reconcile/das` queries devnet DAS with bounded pagination.
  - Endpoint refuses non-devnet DAS URLs and enforces max page/limit guards.
7. Core Candy Machine snapshot layer:
  - `POST /api/admin/core-candy-machine/snapshot/finalize` performs DAS verification and stores relational snapshot evidence.
  - Fallback verification mode (`candy_machine_items_loaded`) is marked `degraded` and never enables `Create Asset`.

## Security Notes
- CSRF strategy:
  - SameSite `lax` + POST-only mutation endpoints.
- Replay protections:
  - Single-use nonce with 5-minute TTL.
  - Purchase challenges are single-use with short TTL (`PURCHASE_CHALLENGE_TTL_SECONDS`, default 120s).
  - Purchase challenge replay attempts are rejected once consumed/expired.
  - Stripe KYC bootstrap is rate-limited by wallet/IP (`STRIPE_IDENTITY_RATE_LIMIT_WINDOW_SECONDS`, `STRIPE_IDENTITY_RATE_LIMIT_MAX_ATTEMPTS`).
  - Purchase quantity policy is server-enforced via `PURCHASE_QUANTITY_MODE` and `PURCHASE_MAX_QUANTITY_PER_ORDER`; invalid quantities are rejected with `INVALID_QUANTITY`.
- Webhook authenticity:
  - If `HELIUS_WEBHOOK_SECRET` is set, webhook request must include matching secret in
    `x-helius-webhook-secret` or `Authorization: Bearer <secret>`.
  - Stripe webhook requests must include a valid `Stripe-Signature` header generated from `STRIPE_IDENTITY_WEBHOOK_SECRET`.
- DAS endpoint policy:
  - DAS client accepts `SOLANA_DAS_URL` (devnet-only) or derives devnet Helius URL from `HELIUS_API_KEY`.
  - If no explicit DAS endpoint is set, backend falls back to configured devnet RPC URL.
- Batch/idempotency protections:
  - Purchase attempts are persisted with ownership (`wallet_public_key`), challenge linkage (`challenge_id`), client IP (`client_ip`), quantity (`quantity`), and explicit state transitions (`created/prepared/submitted/confirmed/failed`).
  - Purchase submit dedupe is enforced by unique key (`wallet_public_key`, `idempotency_key`) with short TTL issued by backend at prepare-time.
  - Purchase request tracing stores per-step events in `purchase_flow_events`, correlated by `flow_id` (`x-flow-id`).
  - Challenge issuance and consumption are persisted in `purchase_challenges`.
  - Rate-limit windows are auditable via `purchase_rate_limit_events`.
  - Signed purchase submit verifies payer == authenticated wallet and tx message == prepared message before send.
  - Submit path uses row-level lock (`FOR UPDATE`) to avoid duplicate on-chain sends during concurrent retries.
  - Prepared purchase transaction must include backend `thirdPartySigner` signature before reaching client wallet signature.
  - `job_id + idempotency_key` deduplicates next-batch calls.
  - `signature` uniqueness is enforced per submitted item to prevent duplicate assignment.
  - Manual state mutations are denied with `403` when admin actor differs from immutable job authority (`createdBy`).
  - Webhook events are deduplicated by provider event id/fingerprint.
  - Stripe KYC events are deduplicated by `provider_event_id` and do not store raw payload PII fields.
  - DAS reconciliation only confirms submitted items with known `expectedAddress`.
  - Snapshot persistence is idempotent at DB level via `asset_mint_snapshots.mint_job_id UNIQUE`.
- Persistence caveat:
  - Session store is currently process-local in-memory.
  - App restart invalidates sessions.
  - Shared store (for example Redis) is required before horizontal scaling.

- Wallet modal UX safety:
  - Progress and error feedback are rendered in the same top visual slot to avoid ambiguous state perception.
  - Modal auto-close after inactivity requires explicit user re-open and never skips SIWS verification steps.

- Theme toggle UX safety:
- Theme preference is stored in browser `localStorage` (`brids-ui-theme`) and restored at startup.
- Theme switching is strictly client-side presentation state and never mutates server session/token data.
- Authorization and trust boundaries remain unchanged across both dark and light themes.

- Guided tour redesign safety notes:
  - Profile onboarding tour is visually redesigned as anchored glass card.
  - Session gate for tour visibility remains server-backed profile fetch + client-only display state.
  - No mutation to `siws_session` cookie behavior, TTL, refresh/revoke model, or role derivation.
  - No new auth/session API surface introduced by the redesign.

## STORY-006-04 Session Enforcement Notes
- Added admin authority-lifecycle endpoints:
  - `POST /api/admin/core-candy-machine/authorities/prepare`
  - `POST /api/admin/core-candy-machine/authorities/submit`
- Session and role enforcement:
  - Both endpoints require authenticated SIWS admin session and reject non-admin callers with `403`.
  - Submitted transactions are validated to ensure payer equals authenticated session wallet.
- Additional server-side gates:
  - Operation must exist in prepared state (`operationId` server-tracked).
  - Multisig evidence and quorum are validated on prepare before transaction leaves backend.
  - `authority_version` monotonic update is enforced on submit to avoid stale concurrent writes.

Implementation guide for request correlation and timeline tracing:
- `docs/purchase-tracing.md`

## BRI-39 Session Boundary Confirmation
- Home copy and section additions in `/app` are presentation-only changes.
- Session boundary remains unchanged:
  - `siws_session` cookie lifecycle is unchanged.
  - Role derivation remains wallet-based and server-calculated.
  - Wallet and auth trust boundaries continue to be enforced on server handlers.
- New CTA destinations (`/marketplace`, `/transparencia`, `/protected/perfil`) do not introduce new auth state transitions.

Last Updated: 2026-04-04 17:35:00 UTC
