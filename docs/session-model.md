# Session Model

## Scope
- Feature: SIWS-backed wallet session for Next.js App Router frontend.
- Roles: `user` and `admin` resolved from wallet allowlist on the server.

## Cookie Strategy
- Cookie type: `httpOnly`, `secure` (production), `sameSite=lax`.
- Nonce cookie:
  - `siws_nonce` (signed, short-lived, 5 minutes).
- Expiration:
  - 24 hours (`maxAge` + matching server-side expiry).
- Rotation policy:
  - Session token regenerated on each successful SIWS verification.

## Session Lifecycle
1. Create session:
   - Server verifies SIWS message signature and validates nonce against signed nonce cookie.
   - Server creates signed session token (`siws_session`) with 24h expiration.
   - Cookie `siws_session` written with path `/`.
2. Refresh session:
   - No token rotation endpoint; user re-authenticates with SIWS.
   - UI auth state is revalidated across browser contexts via `BroadcastChannel` + `localStorage` sync signal, and on `focus`/`visibilitychange`.
3. Revoke session:
   - `POST /api/auth/logout` clears cookie and revokes current token in-process.

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
  - Checkout endpoints (`/api/checkout/cart`, `/api/checkout/order`, `/api/checkout/order/:orderId`, `/api/checkout/payment/start`) require valid SIWS session and wallet ownership checks.
  - H6 signing console in `/admin` orchestrates batch signature submission, but never bypasses backend checks.
  - Mint orchestrator endpoints enforce `admin` role at handler level before any state transition.
  - H7 permanent-authority gate freezes manual job mutations to the creator wallet (`createdBy`).
  - `/api/admin/mint-orchestrator/jobs/:jobId/reconcile/das` is admin-only and never trusts client reconciliation state.
  - `/api/webhooks/helius/mint-orchestrator` does not use SIWS session; it validates optional shared secret and event dedupe.
  - `/api/webhooks/stripe/identity` does not use SIWS session; it validates `Stripe-Signature` and deduplicates by `provider_event_id`.
  - `/api/webhooks/stripe/identity` triggers AML screening (`kyc_verified_webhook`) when KYC becomes `verified`.
  - `/api/internal/compliance/aml/screen` allows admin SIWS or `Authorization: Bearer <COMPLIANCE_INTERNAL_TOKEN>`.
  - `/api/admin/compliance/cases/:walletPublicKey/aml` is admin-only and returns AML case detail for review.
  - `/api/admin/assets/uploads/signed-url`, `/api/admin/assets/uploads/:uploadId/finalize`, and `/api/admin/assets/uploads/orphan-reconciler` are admin-only and keep upload lifecycle checks server-authoritative.
  - `GET /api/admin/collections/:id` is admin-only, requires a session wallet pubkey, and calls the centralized collection ownership helper before returning editable content.
  - `PATCH /api/admin/collections/:id` is admin-only, requires a session wallet pubkey, validates one editable section payload, rejects immutable cover fields, and calls the centralized collection ownership helper before persisting content.
  - `/admin/collections/[id]` is admin-only by middleware and resolves its handoff UI from the server-fetched detail payload only.
  - Wallet modal inactivity auto-close (30s) is client-only UX behavior and never mutates/extends server session state.

## Authorization Layers
1. Session layer:
   - Cookie `siws_session` carries signed server token validated on each request.
2. Role layer:
   - Role is derived from `ADMIN_WALLETS` and wallet pubkey.
3. Middleware layer:
   - `/admin/**` blocked early unless role resolves to `admin`.
4. Handler/page layer:
  - `/api/admin/ping` and `app/admin/page.tsx` repeat the role check (defense in depth).
  - `/api/protected/profile`, `/api/protected/kyc/status`, and `/api/protected/kyc/stripe/session` require authenticated wallet and never trust wallet identity from client payload.
  - `/api/purchase/challenge`, `/api/purchase/prepare`, and `/api/purchase/submit` require authenticated wallet and never trust client-provided payer identity.
  - `/api/checkout/cart`, `/api/checkout/order`, `/api/checkout/order/:orderId`, and `/api/checkout/payment/start` require authenticated wallet and never trust client-provided wallet identity.
  - `/api/purchase/prepare` requires valid purchase challenge signature and backend-side anti-replay/rate-limit checks, including quantity context match from challenge payload.
  - `/api/admin/mint-orchestrator/*` is backend-controlled and does not trust client workflow state.
  - Manual mutation endpoints (`next-batch`, `submit`, `reconcile`, `reconcile/das`) require `admin` role and `actorPubkey === job.createdBy`.
  - `/api/admin/core-candy-machine/snapshot/finalize` requires `admin` role and persists immutable snapshot/proofs after server-side verification.
  - Admin upload lifecycle routes bind every request to the authenticated admin wallet and revalidate `draftId` plus optional `editSessionId` against the stored signed contract before persisting file refs.
  - Admin collection detail reads bind `collectionId` to the authenticated admin wallet through `marketplace_entries.created_by` plus exact `asset_mint_snapshots` evidence before content lookup.
  - Admin collection detail writes use the same binding before repository updates and never accept `image_url`/cover mutation from client payloads.
  - `/admin` signing orchestration UI is an operator surface only; all state transitions are revalidated server-side.
5. Webhook ingress layer:
  - `POST /api/webhooks/helius/mint-orchestrator` optionally enforces `HELIUS_WEBHOOK_SECRET`.
  - Replay retries are deduplicated before signature reconciliation.
  - `POST /api/webhooks/stripe/identity` requires valid Stripe signature and idempotent event ingestion by `provider_event_id`.
  - `POST /api/webhooks/airwallex` requires `x-timestamp` + `x-signature`, validates `HMAC_SHA256(timestamp + rawBody)` with `AIRWALLEX_WEBHOOK_SECRET`, enforces freshness tolerance, and deduplicates provider event ids.
  - Internal AML route accepts either SIWS-admin or internal service token and never trusts client role payload.
6. DAS read layer:
  - `POST /api/admin/mint-orchestrator/jobs/:jobId/reconcile/das` queries devnet DAS with bounded pagination.
  - Endpoint refuses non-devnet DAS URLs and enforces max page/limit guards.
7. Core Candy Machine snapshot layer:
  - `POST /api/admin/core-candy-machine/snapshot/finalize` performs DAS verification and stores relational snapshot evidence.
  - Fallback verification mode (`candy_machine_items_loaded`) is marked `degraded` and never enables `Create Asset`.
8. Admin upload lifecycle layer:
  - Collection-editor uploads may carry an optional `editSessionId` to remain temporary until a later save flow promotes them.
  - Orphan cleanup explicitly excludes promoted uploads and only purges session-linked uploads that remained temporary or were canceled.

## Security Notes
- CSRF strategy:
  - SameSite `lax` + POST-only mutation endpoints.
- Replay protections:
  - Signed nonce cookie (`siws_nonce`) with 5-minute TTL.
  - SIWS message nonce must match nonce cookie value.
  - Nonce cookie is cleared after verify attempt to force a fresh challenge.
  - Purchase challenges are single-use with short TTL (`PURCHASE_CHALLENGE_TTL_SECONDS`, default 120s).
  - Purchase challenge replay attempts are rejected once consumed/expired.
  - Stripe KYC bootstrap is rate-limited by wallet/IP (`STRIPE_IDENTITY_RATE_LIMIT_WINDOW_SECONDS`, `STRIPE_IDENTITY_RATE_LIMIT_MAX_ATTEMPTS`).
  - Purchase quantity policy is server-enforced via `PURCHASE_QUANTITY_MODE` and `PURCHASE_MAX_QUANTITY_PER_ORDER`; invalid quantities are rejected with `INVALID_QUANTITY`.
- Webhook authenticity:
  - If `HELIUS_WEBHOOK_SECRET` is set, webhook request must include matching secret in
    `x-helius-webhook-secret` or `Authorization: Bearer <secret>`.
  - Stripe webhook requests must include a valid `Stripe-Signature` header generated from `STRIPE_IDENTITY_WEBHOOK_SECRET`.
  - Airwallex webhook requests must include valid `x-timestamp` and `x-signature` headers generated with `AIRWALLEX_WEBHOOK_SECRET`.
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
  - Session-linked asset uploads can be canceled or promoted only through server-side repository helpers; promoted uploads are then excluded from orphan cleanup.
- Key management caveat:
  - Session and nonce signatures depend on `SIWS_TOKEN_SECRET`.
  - In production, `SIWS_TOKEN_SECRET` must be explicitly configured and stable across replicas.

- Wallet modal UX safety:
  - Progress and error feedback are rendered in the same top visual slot to avoid ambiguous state perception.
  - Modal auto-close after inactivity requires explicit user re-open and never skips SIWS verification steps.
  - Cross-window sync events never grant access by themselves; server session validation remains the source of truth.

- Theme toggle UX safety:
- Theme preference is stored in browser `localStorage` (`brids-ui-theme`) and restored at startup.
- Theme switching is strictly client-side presentation state and never mutates server session/token data.
- Authorization and trust boundaries remain unchanged across both dark and light themes.

- Guided tour redesign safety notes:
  - Profile onboarding tour is visually redesigned as anchored glass card.
  - Session gate for tour visibility remains server-backed profile fetch + client-only display state.
  - No mutation to `siws_session` cookie behavior, TTL, refresh/revoke model, or role derivation.
  - No new auth/session API surface introduced by the redesign.

- BRI-121 startup splash safety notes:
  - The splash screen is a visual overlay only and does not gate, mutate, refresh, or extend `siws_session`.
  - It does not alter wallet adapter configuration, role derivation, middleware authorization, or handler-level session checks.
  - Main app content remains rendered behind the overlay and becomes visible after the timed fade-out.

- BRI-92 admin collections state UX safety notes:
  - Empty, loading, and error states are presentation-only wrappers around server-derived admin collection state.
  - Retry and creation links do not mutate session data and still rely on the destination route/API authorization checks.
  - No client-side state is used to determine collection ownership or editability.

- BRI-93 admin collection cards safety notes:
  - Success-state cards are a visual transformation only over existing server-side collection payloads.
  - Added card CTAs do not create or update session state and do not bypass admin authorization checks.
  - Validation/editability status shown in cards continues to come from server classification, not browser state.
- BRI-94 admin collection detail handoff safety notes:
  - Navigation from the index is enabled only for `linked` entries and remains a presentation-level affordance, not an authority check.
  - The `/admin/collections/[id]` page revalidates access through the existing admin API/session boundary before rendering any detail context.
  - No new session mutation, refresh, or client-side authorization logic was introduced in this slice.

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

## BRI-39 Follow-up: Feature Icons + Copy
- Emoji/icon rendering in home feature cards is a client-side presentation change sourced from locale data.
- Session model remains unchanged:
  - no cookie contract changes,
  - no role derivation changes,
  - no auth endpoint contract changes.

## BRI-42 Checkout Dual (Crypto + Airwallex) Session Notes
- `/checkout` uses SIWS session as mandatory gate for cart/order/payment API calls.
- Checkout ownership is server-side only:
  - active cart is resolved by session wallet,
  - order reads and payment starts require `order.walletPublicKey === session wallet`.
- Airwallex trust boundaries:
  - backend creates/retrieves PaymentIntents with server credentials,
  - frontend receives only redirect-safe fields (`intentId`, `clientSecret`, `env`, `successUrl`),
  - final payment/order transition is webhook-driven and signature-validated server-side.

## BRI-12 Session Notes (Wallet Connection Migration)
- SIWS signature verification no longer depends on `@solana/web3.js` for public key byte conversion in auth boundary.
- Server normalizes wallet addresses with `@solana/kit` primitives before signature verification and session issuance.
- Frontend session visibility consistency between tabs/windows now uses:
  - login/logout sync event emission,
  - `BroadcastChannel` listener,
  - `storage` listener,
  - and background revalidation on `focus`/`visibilitychange`.

## STORY-010-03 Route and Template Infrastructure Impact
- Story-010-03 modifies only public route rendering and reusable page templates.
- Session model remains unchanged:
  - same `siws_session` cookie contract,
  - same server-side session validation,
  - same role derivation and middleware/handler authorization.
- No new auth/session endpoints were added.

## STORY-010-04 Technical SEO Infrastructure Impact
- Story-010-04 modifies metadata/canonical/robots/sitemap infrastructure and index/noindex routing policy.
- Session model remains unchanged:
  - same `siws_session` cookie contract,
  - same server-side session validation,
  - same role derivation and middleware/handler authorization.
- No new auth/session endpoints were added.

## STORY-010-05 Structured Data JSON-LD Layer Impact
- Story-010-05 modifies schema emitters/validators and JSON-LD script injection for public template routes.
- Session model remains unchanged:
  - same `siws_session` cookie contract,
  - same server-side session validation,
  - same role derivation and middleware/handler authorization.
- No new auth/session endpoints were added.

## STORY-010-06 AI-readable and Machine Endpoints Impact
- Story-010-06 modifies only machine-readable public outputs and APIs:
  - `/llms.txt`, `/ai.txt`, `/knowledge.json`
  - `/api/knowledge`, `/api/entities`, `/api/definitions`
- Session model remains unchanged:
  - same `siws_session` cookie contract,
  - same server-side session validation,
  - same role derivation and middleware/handler authorization.
- No new auth/session endpoints were added.

## STORY-010-08 Semantic Layer for Entities and Relations Impact
- Story-010-08 modifies semantic knowledge rendering and entity relation outputs:
  - `/knowledge/articles/[slug]`
  - `/knowledge/definitions/[slug]`
  - `/api/entities` semantic contract enrichment.
- Session model remains unchanged:
  - same `siws_session` cookie contract,
  - same server-side session validation,
  - same role derivation and middleware/handler authorization.
- No new auth/session endpoints were added.

## STORY-010-09 Feeds, Exports, and Internal Search Readiness Impact
- Story-010-09 modifies only public machine-readable distribution and search readiness endpoints:
  - `/feeds/rss`, `/feeds/json`, `/feeds/recent`, `/feeds/export`, `/feeds/search-index`
  - `public/feeds/manifest.json`
- Session model remains unchanged:
  - same `siws_session` cookie contract,

## BRI-68 Home Title Metadata Impact
- El cambio en `app/page.tsx` establece `title.absolute = "Home | BRIDS"` para Home.
- El modelo de sesión no cambia:
  - mismo contrato de cookie `siws_session`,
  - misma validación server-side por request,
  - misma derivación de roles y mismos límites de autorización.
- No se introducen nuevos endpoints de auth/session ni cambios en trust boundaries.
  - same server-side session validation,
  - same role derivation and middleware/handler authorization.
- No new auth/session endpoints were added.

Last Updated: 2026-04-14 14:20:00 UTC

## STORY-010-10 Session/Boundary Notes
- Session contract is unchanged:
  - same `siws_session` cookie behavior,
  - same server-side role derivation,
  - same middleware + handler authorization model.
- New observability endpoints are classified by boundary:
  - Public: `POST /api/analytics/events`, `GET /api/health`
  - Admin-only: `GET /api/admin/monitoring/analytics`, `GET /api/admin/monitoring/logs`
- Security headers and CSP are now centralized in `next.config.ts` and apply regardless of auth state.
- Telemetry pipeline is privacy-friendly and authority-agnostic:
  - captures route/UI interaction signals,
  - excludes identity/session secrets,
  - never trusts client state for authorization.
- EPIC-010 still excludes non-code editorial/backoffice authoring UI.

## BRI-65 Landing Featured Properties Binding
- Home landing `Featured Properties` cards are sourced from server marketplace data via `listMarketplaceProperties`.
- Static property cards from `app/data/home*.json` are used only as fallback when marketplace source has no records.
- Session boundaries are unchanged:
  - SIWS cookie/session lifecycle remains identical.
  - Role derivation remains server-side (`ADMIN_WALLETS` + authenticated wallet).
  - No new auth/session endpoints were introduced.

## BRI-63 Landing UI States Removal Impact
- Scope touched only public landing presentation:
  - removed `UiStatesSection` from `app/page.tsx`.
  - deleted `components/sections/ui-states.tsx`.
- Session model remains unchanged:
  - same `siws_session` cookie contract,
  - same server-side session validation and role derivation,
  - same middleware + handler authorization.

## EPIC-011 / BRI-81 Session Enforcement Notes
- `GET /api/admin/collections` now consumes the existing SIWS session model for admin collections listing.
- Session requirements are unchanged:
  - valid `siws_session` cookie
  - server-side wallet resolution from session token
  - role derivation from `ADMIN_WALLETS`
- The endpoint is read-only and returns `403` unless the request resolves to an authenticated admin with a server-side `pubkey`.
- No new session token shape, rotation rule, or trust boundary was introduced in this slice.

## EPIC-011 / BRI-82 Collections Page Session Handoff
- `/admin/collections` now performs server-side consumption of the admin collections endpoint using the same request cookie context.
- The page does not create a parallel client-side auth path and does not cache a client-authoritative collections state.
- Session model remains unchanged:
  - same `siws_session` cookie contract
  - same server-side wallet lookup
  - same admin role derivation
- This slice only adds UI handoff states over the existing authenticated admin session boundary.
