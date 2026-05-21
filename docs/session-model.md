# Session Model

Last Updated: 2026-05-21

## BRI-161 Marketplace Investment Payload Notes
- The marketplace investment-model alignment slice does not introduce a new session layer, cookie, token, or role.
- Structured marketplace content added by this fix is still published only from an existing admin SIWS session:
  - `project`
  - `economics`
  - `governance`
- Session authority stays unchanged:
  - public marketplace reads remain anonymous-safe
  - admin asset creation and marketplace publishing remain wallet-admin-only
  - user purchase flows still derive pricing and purchase authority from the existing wallet session model, not from the new informational economics payload

## BRI-158 Public Session Bootstrap Boundary
- Public discovery pages now bootstrap as anonymous by default and defer wallet/account introspection until a user-facing auth surface actually needs it.
- No cookie names, TTLs, or server authority rules changed:
  - `workos_session` remains the federated account session
  - `siws_session` remains the wallet session
  - `siws_nonce` remains the short-lived replay-protection cookie
- What changed is the shell bootstrap path:
  - root layout no longer reads request-time locale/auth signals for public pages
  - `WalletModal` may start from `ANONYMOUS_AUTH_STATE` and refresh via `GET /api/auth/me` on the client
  - wallet runtime is mounted per-surface instead of globally for the whole app shell
- Session authority remains fully server-resolved:
  - anonymous public render does not imply anonymous protected access
  - protected/admin pages still resolve session state on the server before granting access
  - browser-local locale detection and deferred modal auth refresh are presentation/bootstrap concerns only

## BRI-157 PWA Session Boundary Notes
- The installability slice introduces browser-local runtime state, not a new session layer.
- No new cookie, token, refresh path, or server authority source was added.
- The service worker registered in `S02` is intentionally minimal:
  - it exists to satisfy installability prerequisites
  - it does not cache authenticated responses
  - it does not proxy auth headers, wallet signatures, or role checks
- Client capability detection for installability/push readiness may read:
  - browser display mode
  - `beforeinstallprompt` availability
  - notification permission state
  - service worker / PushManager support
- Those signals are advisory only. Session authority continues to be resolved exclusively on the server from `workos_session` and/or `siws_session`.
- `S03` keeps push subscription ownership inside that same server session model:
  - `web_push_subscriptions` rows are created for a server-resolved `account_id + wallet_public_key`
  - account-only sessions cannot create or revoke push endpoints
  - endpoint conflicts across accounts fail closed instead of reassigning ownership

## BRI-154 Hybrid Session Foundation
- BRIDS now carries two separate session layers:
  - WorkOS account session cookie (`workos_session` / AuthKit-managed cookie)
  - BRIDS SIWS wallet session cookie (`siws_session`)
- These cookies are intentionally isolated and are never collapsed into one browser token.
- Request authority is derived server-side from the combination of:
  - `accountAuthenticated`
  - `federatedAuthenticated`
  - `walletAuthenticated`
  - linked `wallet_public_key`, when present
  - wallet-derived `role`, when present
- If WorkOS and SIWS sessions resolve to different BRIDS accounts, hybrid composition is rejected and the request falls back to fail-closed semantics.
- Session authority states now include:
  - `anonymous`
  - `federated` / account-only
  - `wallet`
  - `hybrid`
- `GET /api/auth/me` is the canonical session introspection surface for the browser and now returns both auth layers plus `authMethod`.
- `/protected` may render from account-only session.
- Wallet-bound APIs, financial flows, and `/admin/**` still require SIWS wallet authentication.
- Federated wallet linking now uses a dedicated pending link context:
  - single-use
  - 5-minute max lifetime
  - bound to `account_id` and `workos_user_id`
  - requires an active WorkOS session at completion time, but does not require the exact same AuthKit `sessionId` if WorkOS rotates it during the flow
  - invalidated on success, failure, logout, or account-context mismatch
- Wallet-backed federated linking now also uses its own pending context:
  - single-use
  - 5-minute max lifetime
  - bound to `account_id` and `wallet_public_key`
  - created only from an active SIWS wallet session
  - completed only after WorkOS sign-in returns through `/auth/link/federated/complete`
  - invalidated on success, failure, logout, or mismatch

## BRI-153 UI Slice Notes
- No new session token, cookie, role, or refresh path was introduced by the wallet CTA rename or the profile quick tour emphasis updates.
- Header CTA label is now derived from existing SIWS session state:
  - unauthenticated: `Ingresar`
  - authenticated: `Wallet`
- Marketplace placeholder charts are now bound to the same public release-visibility flag used by other dev-only UI:
  - hidden by default in `production`/RC
  - visible by default outside production
  - explicitly re-enabled with `NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES=true`
- These controls only affect presentation. Session validation, wallet ownership, and route authorization remain server-authoritative.

## BRI-152 Release Visibility Guard
- Session policy is unchanged, but selected dashboard/admin routes are now hidden in RC/release-like environments.
- Hidden routes are removed from navigation and fail closed with `404` on direct access instead of exposing development-only UI.
- Local development keeps those modules available by default for internal workflows.
- Explicit non-release reactivation is allowed through `NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES=true`.

## BRIDS Technical Rename
- Technical project slug references were renamed from `solana-test-1` to `brids`.
- This change does not modify cookie names, token semantics, session expiration, or server-side authorization rules.

## BRI-151 Onboarding Reward Session Notes
- The onboarding reward feature does not introduce a new auth token, cookie, or role.
- Reward registration happens after successful SIWS verification and is bound to the authenticated `wallet_public_key`.
- The post-auth decision modal is client-side navigation UX only; it never mutates, extends, or bypasses `siws_session`.
- Reward qualification and checkout consumption remain server-authoritative and are derived from persisted profile, KYC, and order state.

## Scope
- Feature: hybrid WorkOS account session plus SIWS-backed wallet session for Next.js App Router frontend.
- Roles: `user` and `admin` resolved from wallet allowlist on the server.

## Cookie Strategy
- Cookie type: `httpOnly`, `secure` (production), `sameSite=lax`.
- WorkOS cookie:
  - AuthKit-managed encrypted session cookie for federated/account auth.
  - Cookie name defaults to WorkOS AuthKit defaults unless explicitly overridden by WorkOS env.
- Nonce cookie:
  - `siws_nonce` (signed, short-lived, 5 minutes).
- Wallet session cookie:
  - `siws_session` (signed, 24-hour TTL, BRIDS-managed).
- Pre-auth referral hint:
  - Public referral route `/r/<referralCode>` is metadata-first and redirects users into `/?ref=<referralCode>` before auth begins.
  - Client-only `localStorage` entry (`brids_referral_hint`) used to persist `referralCode`, capture origin, and landing path until first auth payload is sent.
- Expiration:
  - 24 hours (`maxAge` + matching server-side expiry).
- Rotation policy:
  - Session token regenerated on each successful SIWS verification.

## Session Lifecycle
1. Create WorkOS account session:
   - `GET /sign-in` starts hosted WorkOS auth.
   - `GET /callback` completes AuthKit callback and ensures a BRIDS account exists for the returned `workos_user_id`.
   - Result is a low-authority account session only.
2. Create wallet session:
   - Server verifies SIWS message signature and validates nonce against signed nonce cookie.
   - On the same first auth payload, server may process optional referral fields (`referralCode`, `attributionSource`, `attributionMetadata`) before final response emission.
   - Referral binding is only attempted when the wallet is still considered new; existing wallets are explicitly skipped to prevent late referral attachment.
   - Server creates signed session token (`siws_session`) with 24h expiration.
   - Cookie `siws_session` written with path `/`.
3. Hybrid session composition:
   - If both WorkOS and SIWS are present, backend treats the request as hybrid.
   - WorkOS stays account-level authority; SIWS stays wallet-level authority.
4. Wallet linking:
   - `GET /api/auth/link/wallet/nonce` creates a pending wallet-link context and returns a nonce.
   - `POST /api/auth/link/wallet/verify` requires the same active WorkOS session plus a fresh SIWS proof for the wallet.
   - If the WorkOS account context changes before completion, the link fails closed and the context is destroyed.
   - If the proved wallet already belongs to another wallet-backed account, backend may absorb the current federated-only account into that wallet-backed account when eligibility checks pass.
   - Unsafe consolidations fail into review-required handling rather than silent merge or wallet reassignment.
5. Federated linking from wallet:
   - `GET /api/auth/link/federated/start` requires active SIWS wallet auth and writes a pending federated-link context.
   - Browser is redirected through WorkOS and returns to `GET /auth/link/federated/complete`.
   - Completion succeeds idempotently if both layers already resolve to the same account.
   - If WorkOS resolves to a separate federated-only account, backend may absorb that account into the wallet-backed account when safe.
   - Admin-capable or otherwise unsafe states fail into review-required handling.
6. Refresh session:
   - WorkOS refresh is handled by AuthKit middleware/proxy.
   - SIWS has no refresh endpoint; user re-authenticates with SIWS.
   - UI auth state is revalidated across browser contexts via `BroadcastChannel` + `localStorage` sync signal, and on `focus`/`visibilitychange`.
7. Revoke session:
   - `POST /api/auth/logout` clears only `siws_session`.
   - `POST /api/auth/logout` also clears any pending wallet-link or federated-link context.
- `GET /sign-out` clears WorkOS session cookie and redirects away.

## BRI-157 Notification Worker Boundary
- `S04` introduces a separate internal worker trust boundary for web push delivery.
- Worker authentication:
  - internal processors may call `/api/internal/notifications/process` with `x-notifications-worker-token`
  - admin operators may enqueue transactional jobs with an active admin wallet session
- Session semantics:
  - the worker token does not create a user session, role, or wallet identity
  - delivery job ownership is recorded as `created_by_type` plus `created_by_id` for auditability
  - delivery attempts mutate subscription lifecycle state (`active`, `failing`, `gone`) server-side only

## BRI-157 Admin Campaign Boundary
- `S05` adds a separate admin campaign boundary above the worker layer.
- Authentication and authorization:
  - preview/send routes require a valid SIWS admin wallet session
  - federated account session without wallet step-up cannot preview or queue campaigns
- Session semantics:
  - campaign audit records bind to `actor_pubkey`
  - preview confirmation is enforced by `previewHash`, not by trusting stale browser state
  - admin campaign routes never accept external redirect destinations or arbitrary audience ownership from client payloads
- `R04` keeps these session semantics intact while moving route contracts into shared notifications modules.
  - preview/send/enqueue/process now reuse bounded-context schemas and error helpers
  - no session cookie, role derivation, or worker-token rule changed in that cleanup

## BRI-157 Rollout Controls
- `S06` adds runtime gates that can disable parts of the notification stack without changing session semantics.
- Controls:
  - `ENABLE_WEB_PUSH_SUBSCRIPTIONS=false` blocks subscription writes but does not create a new auth path
  - `ENABLE_WEB_PUSH_DELIVERY=false` blocks enqueue/process flows and admin campaign sends
  - `NEXT_PUBLIC_ENABLE_PWA_INSTALLABILITY=false` prevents browser-side service worker registration
- Observability:
  - `/api/admin/notifications/health` is admin-only and reports rollout state plus aggregate health counters

## Validation Rules
- Authentication:
  - Missing all session layers = unauthenticated.
  - WorkOS-only session = account-authenticated but not wallet-authenticated.
  - SIWS session = wallet-authenticated.
- Role resolution:
  - Role is computed only from authenticated wallet and `ADMIN_WALLETS`.
  - Role is never trusted from client state.
- Server-side checks per request:
  - `GET /api/auth/me` exposes hybrid auth state: `accountAuthenticated`, `federatedAuthenticated`, `walletAuthenticated`, `authMethod`, `pubkey`, `role`.
  - `POST /api/auth/verify` may bind a referral only during first-auth wallet creation semantics and never for already-registered wallets.
  - `POST /api/auth/verify` also ensures a wallet-bound onboarding reward record exists for the authenticated profile without changing session semantics.
  - `GET /api/referrals/preview` is intentionally public and only returns truncated referrer display data for a valid referral code.
  - `GET /api/protected/referrals/summary` requires a valid SIWS session and always binds aggregate referral metrics to the authenticated wallet.
  - `GET /api/protected/referrals/invitees` requires a valid SIWS session and always returns a backend-paginated, privacy-safe invitee feed for the authenticated wallet.
  - `/protected` may render from either WorkOS account session or SIWS wallet session.
  - `GET /api/protected/me` requires a valid wallet session and returns `401` otherwise.
  - `GET /api/protected/profile` and `PUT /api/protected/profile` require valid SIWS session, always bind writes to session wallet, and include the current onboarding reward snapshot for that wallet.
  - `GET /api/protected/kyc/status` requires valid SIWS session and only returns status for session wallet.
  - `POST /api/protected/kyc/stripe/session` requires valid SIWS session and applies wallet/IP rate limit before creating provider session.
  - `POST /api/protected/kyc/stripe/session` also triggers AML screening (`kyc_session_started`) server-side.
  - Reward status is recalculated server-side after profile updates, KYC session creation, Stripe KYC webhooks, and admin KYC decisions.
  - `/admin/**` proxy redirects unauthorized requests to `/403`.
  - Admin pages and `/api/admin/*` handlers perform explicit role re-checks.
  - Purchase challenge endpoint (`/api/purchase/challenge`) requires valid SIWS session.
  - Purchase mutation endpoints (`/api/purchase/prepare`, `/api/purchase/submit`) require valid SIWS session, challenge verification, and wallet ownership checks.
  - Checkout endpoints (`/api/checkout/cart`, `/api/checkout/order`, `/api/checkout/order/:orderId`, `/api/checkout/payment/start`) require valid SIWS session and wallet ownership checks.
  - `POST /api/checkout/order` may reserve an earned onboarding reward, but the client only sends intent (`applyOnboardingReward`); the backend computes and locks the actual discount.
  - `airwallex` is intentionally suspended at the application layer; order creation and payment start return `PAYMENT_METHOD_DISABLED`, while crypto checkout remains active.
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
  - `GET /api/admin/collections/:id/location-maps` is admin-only, requires a session wallet pubkey, and calls the same centralized collection ownership helper before deriving the location/maps section contract.
  - `GET /api/admin/collections/:id/location-maps/autocomplete` and `/resolve` are admin-only, require a session wallet pubkey, and keep Google provider lookups behind the same ownership boundary.
  - The same `GET /api/admin/collections/:id` response may now include a read-only `blockchain.baseAddresses` payload derived server-side from snapshot evidence.
  - That read-only `blockchain` payload may also include authority identities resolved server-side from `authority_registry`, snapshot data, and configured backend authorities.
  - `PATCH /api/admin/collections/:id` is admin-only, requires a session wallet pubkey, validates one editable section payload, rejects immutable cover fields, and calls the centralized collection ownership helper before persisting content.
  - `/admin/collections/[id]` is admin-only by proxy and resolves its handoff UI from the server-fetched detail payload only.
  - Wallet modal inactivity auto-close (30s) is client-only UX behavior and never mutates/extends server session state.

## Authorization Layers
1. Session layer:
   - WorkOS cookie carries account session managed by AuthKit middleware/proxy.
   - Cookie `siws_session` carries signed BRIDS wallet token validated on each request.
   - Pre-auth referral hint is client-only presentation state and never authenticates or authorizes requests by itself.
2. Role layer:
   - Role is derived from `ADMIN_WALLETS` and wallet pubkey.
3. Middleware layer:
   - `/admin/**` blocked early unless role resolves to `admin`.
4. Handler/page layer:
  - `/api/admin/ping` and `app/admin/page.tsx` repeat the role check (defense in depth).
  - `/api/protected/profile`, `/api/protected/kyc/status`, and `/api/protected/kyc/stripe/session` require authenticated wallet and never trust wallet identity from client payload.
  - Onboarding reward status shown in protected UI is informational only; profile completion, KYC timing, reward earning, reservation, release, and consumption are computed server-side.
  - `/api/protected/referrals/summary` and `/api/protected/referrals/invitees` require authenticated wallet and never trust referrer identity from client payload.
  - `/api/purchase/challenge`, `/api/purchase/prepare`, and `/api/purchase/submit` require authenticated wallet and never trust client-provided payer identity.
  - `/api/checkout/cart`, `/api/checkout/order`, `/api/checkout/order/:orderId`, and `/api/checkout/payment/start` require authenticated wallet and never trust client-provided wallet identity.
  - `/api/purchase/prepare` requires valid purchase challenge signature and backend-side anti-replay/rate-limit checks, including quantity context match from challenge payload.
  - `/api/admin/mint-orchestrator/*` is backend-controlled and does not trust client workflow state.
  - Manual mutation endpoints (`next-batch`, `submit`, `reconcile`, `reconcile/das`) require `admin` role and `actorPubkey === job.createdBy`.
  - `/api/admin/core-candy-machine/snapshot/finalize` requires `admin` role and persists immutable snapshot/proofs after server-side verification.
  - Admin upload lifecycle routes bind every request to the authenticated admin wallet and revalidate `draftId` plus optional `editSessionId` against the stored signed contract before persisting file refs.
  - Admin collection detail reads bind `collectionId` to the authenticated admin wallet through `marketplace_entries.created_by` plus exact `asset_mint_snapshots` evidence before content lookup.
  - Admin collection location/maps contract reads use the same binding before deriving any Google Maps outbound/embed URL.
  - Admin collection location/maps lookup helpers use the same binding before any Google suggestions or place details are requested from the provider.
  - Admin collection detail writes use the same binding before repository updates and never accept `image_url`/cover mutation from client payloads.
  - Admin collection location saves also use the same PATCH boundary; autocomplete selection remains local browser state until the authenticated `googleMapsPlace` section save executes.
  - `/admin` signing orchestration UI is an operator surface only; all state transitions are revalidated server-side.
5. Webhook ingress layer:
  - `POST /api/webhooks/helius/mint-orchestrator` optionally enforces `HELIUS_WEBHOOK_SECRET`.
  - Replay retries are deduplicated before signature reconciliation.
  - `POST /api/webhooks/stripe/identity` requires valid Stripe signature and idempotent event ingestion by `provider_event_id`.
  - `POST /api/webhooks/airwallex` requires `x-timestamp` + `x-signature`, validates `HMAC_SHA256(timestamp + rawBody)` with `AIRWALLEX_WEBHOOK_SECRET`, enforces freshness tolerance, and deduplicates provider event ids. The webhook stays available even while card checkout is suspended.
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
  - Nonce must also still exist in the in-memory/server nonce store at verification time.
  - Nonce is consumed immediately after successful verify and nonce cookie is cleared after verify attempt to force a fresh challenge.
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
  - Onboarding reward reservation and consumption are row-locked against the persisted reward record so one earned discount cannot back multiple orders.
  - Reward state transitions are recalculated from persisted timestamps (`initial_registration_at`, `qualification_deadline_at`, `kyc_submitted_at`, `kyc_review_grace_deadline_at`, `kyc_verified_at`) instead of client clocks.
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
  - It does not alter wallet adapter configuration, role derivation, proxy authorization, or handler-level session checks.
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
- BRI-95 read-only detail shell safety notes:
  - The detail route now renders a richer read-only shell, but it still derives all content from the same server-fetched admin detail payload.
  - Cover lock semantics and section scaffolding do not create any new write surface or bypass the centralized ownership check.
  - Document links and media rendering remain presentation-only and do not alter session state or authorization boundaries.
- BRI-101 Playwright admin collections flow safety notes:
  - Browser E2E now uses a deterministic read fixture for `/api/admin/collections` and `/api/admin/collections/:id`, but only after a real admin SIWS session is established.
  - The fixture is gated by `brids_admin_collections_fixture` and disabled in production, so it cannot become a runtime authority path.
  - The fixture affects only GET responses; write paths continue to require authenticated admin session checks, payload validation, and centralized ownership verification.
  - No session lifecycle changes were introduced:
    - no extra cookie for auth,
    - no session refresh path,
    - no client-authoritative role override,
    - no proxy bypass.
- BRI-104 blockchain detail payload safety notes:
  - The new `blockchain.baseAddresses` payload is read-only and server-derived from existing ownership + snapshot records.
  - It does not create any new session mutation path, role override, or client-authoritative authority source.
  - If `assetMintAddress` is absent in the snapshot, the server returns `null` instead of trusting any client-supplied fallback.
- BRI-105 blockchain authorities payload safety notes:
  - The new `blockchain.authorities` block is also read-only and server-derived.
  - Registry-backed roles (`transferDelegate`, `appdataAuthority`) degrade to `null` when absent rather than inferring mutable authority from the client.
  - Config-backed fallbacks for `thirdPartySigner` and `freezeDelegate` do not expose any signing capability to the browser; they only surface identity strings already enforced server-side elsewhere.

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
  - same role derivation and proxy/handler authorization.
- No new auth/session endpoints were added.

## STORY-010-04 Technical SEO Infrastructure Impact
- Story-010-04 modifies metadata/canonical/robots/sitemap infrastructure and index/noindex routing policy.
- Session model remains unchanged:
  - same `siws_session` cookie contract,
  - same server-side session validation,
  - same role derivation and proxy/handler authorization.
- No new auth/session endpoints were added.

## STORY-010-05 Structured Data JSON-LD Layer Impact
- Story-010-05 modifies schema emitters/validators and JSON-LD script injection for public template routes.
- Session model remains unchanged:
  - same `siws_session` cookie contract,
  - same server-side session validation,
  - same role derivation and proxy/handler authorization.
- No new auth/session endpoints were added.

## STORY-010-06 AI-readable and Machine Endpoints Impact
- Story-010-06 modifies only machine-readable public outputs and APIs:
  - `/llms.txt`, `/ai.txt`, `/knowledge.json`
  - `/api/knowledge`, `/api/entities`, `/api/definitions`
- Session model remains unchanged:
  - same `siws_session` cookie contract,
  - same server-side session validation,
  - same role derivation and proxy/handler authorization.
- No new auth/session endpoints were added.

## STORY-010-08 Semantic Layer for Entities and Relations Impact
- Story-010-08 modifies semantic knowledge rendering and entity relation outputs:
  - `/knowledge/articles/[slug]`
  - `/knowledge/definitions/[slug]`
  - `/api/entities` semantic contract enrichment.
- Session model remains unchanged:
  - same `siws_session` cookie contract,
  - same server-side session validation,
  - same role derivation and proxy/handler authorization.
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
  - same role derivation and proxy/handler authorization.
- No new auth/session endpoints were added.

Last Updated: 2026-04-14 14:20:00 UTC

## STORY-010-10 Session/Boundary Notes
- Session contract is unchanged:
  - same `siws_session` cookie behavior,
  - same server-side role derivation,
  - same proxy + handler authorization model.
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
  - same proxy + handler authorization.

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

## EPIC-011 / BRI-123 Session Safety Notes
- The clean-code refactor only restructures admin presentation components and route composition.
- Session invariants remain unchanged:
  - same `siws_session` cookie contract
  - same server-side wallet lookup and admin role derivation
  - no new client-managed session state
- The refactor does not widen authority boundaries or add alternative auth flows.

## EPIC-011 / BRI-96 Summary Editor Session Notes
- The summary editor introduces local per-section UI state only:
  - draft text
  - dirty flag
  - saving/success/error feedback
- Session invariants remain unchanged:
  - same `siws_session` cookie contract
  - same server-side wallet lookup and admin role derivation
  - same authenticated PATCH route as the only persistence path
- No new session token shape, refresh rule, or browser-stored authority state was added.

## EPIC-011 / BRI-97 Property Information Editor Session Notes
- The property information editor reuses the same per-section local UI state pattern as the summary editor.
- Session invariants remain unchanged:
  - same `siws_session` cookie contract
  - same server-side wallet lookup and admin role derivation
  - same authenticated PATCH route as the only persistence path
- The shared text-section editor core does not introduce a global client form store or any new session surface.

## EPIC-011 / BRI-98 Gallery Tabs Shell Session Notes
- The gallery shell introduces only local tab-selection state for the authenticated detail page.
- Session invariants remain unchanged:
  - same `siws_session` cookie contract
  - same server-side wallet lookup and admin role derivation
  - no new authenticated mutation path in this slice
- The staged gallery action surfaces do not persist any browser-owned authority state and do not widen the session boundary.

## EPIC-011 / BRI-99 Documents Editor Session Notes
- The documents editor introduces local section state for:
  - editable document rows
  - save/cancel feedback
  - section-scoped dirty detection
- Session invariants remain unchanged:
  - same `siws_session` cookie contract
  - same server-side wallet lookup and admin role derivation
  - same authenticated PATCH route as the only persistence path
- Inherited upload metadata is rendered as presentation detail only and does not create any new browser-owned authority state.

## EPIC-011 / BRI-100 API Regression Session Notes
- This slice does not add any new client session state; it hardens the existing admin collection detail API contract.
- Session invariants remain unchanged:
  - same `siws_session` cookie contract
  - same server-side wallet lookup and admin role derivation
  - same authenticated GET/PATCH routes as the only admin collection detail paths
- Malformed JSON rejection and canonical ownership-path coverage tighten server behavior without widening the session boundary.
