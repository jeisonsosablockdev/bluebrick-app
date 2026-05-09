# Auth Flow (SIWS)

Last Updated: 2026-05-06

## BRIDS Technical Rename
- Technical project slug references were renamed from `solana-test-1` to `brids`.
- This change does not alter the SIWS auth contract, session boundaries, referral behavior, or role resolution rules described below.

## BRI-151 Onboarding Reward Decision Flow
- First successful wallet auth now ensures a wallet-bound onboarding reward row exists for the authenticated profile.
- New users are no longer forced into `/protected/perfil` immediately after wallet connection.
- After `POST /api/auth/verify`, the wallet modal fetches `GET /api/protected/profile` and either:
  - opens a decision modal with `Explorar ahora` and `Completar perfil`, or
  - routes normally into the protected area when no reward reminder is needed.
- The modal is UX only. Reward registration, qualification, expiration, reservation, and consumption stay server-authoritative.
- The initial active campaign grants `$10 USD` as a one-time checkout discount for the tokenized fraction flow after the user completes the required profile fields and verified KYC inside the allowed window.

## Scope
- Feature: Phantom wallet connection + Sign-In With Solana (SIWS) via message signing only.
- Wallet integration: `@solana/wallet-adapter-react` with Phantom as primary wallet.
- Signature verification primitive: `@solana/kit` address encoder (`address` + `getAddressEncoder`) in server auth boundary.
- RBAC extension: authenticated wallet is mapped to `user`/`admin` server-side.

## SIWS Flow
1. Nonce issued by server:
   - `GET /api/auth/nonce` returns a nonce (5-minute TTL) and writes an `httpOnly` signed nonce cookie (`siws_nonce`).
2. Message signed by wallet:
   - Client builds deterministic SIWS message with `domain`, `address`, `statement`, `nonce`, `issuedAt`.
   - Public referral shares may enter through `/r/<referralCode>`, which exposes dynamic social metadata and then redirects users to `/?ref=<referralCode>` before wallet sign-in.
   - Before sign-in, wallet modal captures `?ref=` from the current URL, persists a local referral hint, and keeps a visible editable `Referral code` field as manual fallback.
   - Phantom mobile deep-link handoff preserves the full current URL (`window.location.href`), including `?ref=...`, when opening `phantom.app/ul/browse/...`.
   - Wallet signs message bytes via `signMessage()`.
3. Signature verified server-side:
   - `POST /api/auth/verify` validates format, host/domain, issuedAt freshness, signature, and nonce equality against signed nonce cookie.
   - The same first auth payload may also carry optional referral fields (`referralCode`, `attributionSource`, `attributionMetadata`).
   - Referral binding is attempted only for wallets that are still new at auth time; previously registered wallets skip referral attachment to avoid late attribution.
   - Nonce cookie is cleared after verify success/failure to force fresh challenge on retry.
4. Session established:
   - Server creates a signed session token and sets `httpOnly` cookie (`siws_session`).
5. Role resolved server-side:
   - Request wallet pubkey is compared against `ADMIN_WALLETS` allowlist.
   - Role is `admin` if allowlisted, otherwise `user`.
6. Session introspection:
   - `GET /api/auth/me` returns `{ authenticated, pubkey, role }` when session is valid.
7. Protected routes:
   - `/protected` and `/api/protected/me` require a valid SIWS session.
   - `/admin/**` is gated in Next.js proxy (`proxy.ts`, previously `middleware.ts`).
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
   - Profile responses now include `onboardingReward` so the authenticated wallet can see reward status, amount, deadlines, and one-time usage state.
   - `POST /api/protected/kyc/stripe/session` requires SIWS session, applies wallet/IP rate-limit, and creates Stripe Identity verification session.
   - KYC bootstrap also triggers AML screening (`kyc_session_started`) to keep compliance evaluation warm from session kickoff.
   - Identity documents are captured by Stripe; this app stores only provider metadata and status fields.
   - `POST /api/webhooks/stripe/identity` validates Stripe signature header and applies idempotent status projection into `compliance_status`.
   - Stripe `identity.verification_session.verified` triggers AML screening (`kyc_verified_webhook`) before returning webhook processing result.
   - Reward state is re-evaluated server-side after profile saves, KYC session creation, Stripe KYC webhook processing, and admin KYC decisions.
16. AML operational endpoints (STORY-004-04):
   - `POST /api/internal/compliance/aml/screen` accepts admin SIWS session or `Authorization: Bearer <COMPLIANCE_INTERNAL_TOKEN>`.
   - `GET /api/admin/compliance/cases/:walletPublicKey/aml` returns AML snapshot + recent screenings for admin review.
17. Admin asset upload lifecycle for collection editing (BRI-87, server-authoritative):
   - `POST /api/admin/assets/uploads/signed-url` and `POST /api/admin/assets/uploads/:uploadId/finalize` remain admin-only.
   - Uploads may now carry an optional `editSessionId` in addition to `draftId` so collection-editor media can stay temporary until the save path promotes them.
   - `POST /api/admin/assets/uploads/orphan-reconciler` remains admin-only and only cleans session-linked uploads that were never promoted.
18. Admin collection detail read (BRI-89, server-authoritative):
   - `GET /api/admin/collections/:id` requires an authenticated admin SIWS session with wallet pubkey.
   - The handler uses `assertAdminCollectionOwnership(adminId, collectionId)` before reading editable collection content.
   - Ownership is proven server-side from marketplace entry ownership plus matching snapshot evidence; client route state is never trusted.
19. Admin collection detail write (BRI-91, server-authoritative):
   - `PATCH /api/admin/collections/:id` requires an authenticated admin SIWS session with wallet pubkey.
   - The handler validates a section-discriminated payload before ownership lookup and rejects immutable cover fields.
   - The handler uses `assertAdminCollectionOwnership(adminId, collectionId)` before persisting editable off-chain content through the repository layer.
20. Admin collection location/maps contract read (BRI-111, server-authoritative):
   - `GET /api/admin/collections/:id/location-maps` requires the same authenticated admin SIWS session with wallet pubkey.
   - The handler reuses `assertAdminCollectionOwnership(adminId, collectionId)` before reading collection content and deriving normalized location context plus outbound/embed Google Maps URLs.
21. Admin collection location/maps lookup helpers (BRI-112, server-authoritative):
   - `GET /api/admin/collections/:id/location-maps/autocomplete` and `GET /api/admin/collections/:id/location-maps/resolve` require the same authenticated admin SIWS session with wallet pubkey.
   - Both handlers reuse the same centralized ownership guard before calling Google Maps provider logic, and the browser only receives reduced suggestion/place DTOs.
22. Admin collection detail navigation handoff (BRI-94, server-authoritative):
   - `/admin/collections/[id]` is a server-rendered admin route that fetches detail through `GET /api/admin/collections/:id`.
   - The page does not trust index-card state; route access still depends on the server-side detail contract and SIWS admin session.
23. Admin collection blockchain read-only base addresses (BRI-104, server-authoritative):
   - `GET /api/admin/collections/:id` now also returns a read-only `blockchain` block with base addresses for the detail shell.
   - The block is derived server-side from ownership evidence plus `asset_mint_snapshots.blockchain_snapshot`; browser state never supplies or authorizes blockchain addresses.
   - Missing snapshot asset mint data degrades to `null` without widening write access or bypassing the existing ownership gate.
24. Admin collection blockchain authorities read (BRI-105, server-authoritative):
   - The same read-only `blockchain` block now includes visible authority identities for admin inspection.
   - `transfer_delegate` and `appdata_authority` are resolved server-side from `authority_registry`; `third_party_signer` and `freeze_delegate` use snapshot/configured fallbacks.
   - This remains informational only and does not grant any mutation path from `/admin/collections`.

## Wallet Modal UX Guardrails
- The wallet modal uses one top feedback slot for both progress (`Connecting/Signing/Verifying`) and error messages to keep UI state transitions visually consistent.
- The wallet modal closes automatically after 30 seconds without user interaction (`pointerdown`, `keydown`, `touchstart`, `wheel`).
- Any interaction while the modal is open resets the 30-second inactivity timer.
- Auth state is revalidated across tabs/windows using `BroadcastChannel` + `localStorage` sync events, plus `focus`/`visibilitychange` revalidation.
- Wallet connect flow resolves public key from adapter state with retry window after `connect()` to avoid race conditions on first connection.
- This UX timeout never bypasses SIWS rules: nonce validation, signature verification, and role resolution remain server-side.

## Theme Selector UX Guardrails
- UI exposes a global client-side toggle to switch between dark and light theme modes.
- Selected theme is persisted in browser `localStorage` (`brids-ui-theme`) and restored on app load.
- Theme mode is presentation-only and does not change SIWS flows, cookie/session logic, nonce policy, or role authorization.

## Guided Tour Visual Redesign (Profile)
- Scope limited to presentation layer in `components/dashboard/quick-tour-overlay.tsx`.
- Existing onboarding trigger logic from PR #77 remains unchanged:
  - checks incomplete profile (`firstName`, `country`, `email`)
  - persists dismiss state in `sessionStorage`
  - routes users to `/protected/perfil` when needed
- The tour moved from fixed top banner to anchored glass-effect floating card.
- No changes to SIWS verification, nonce lifecycle, cookie/session boundaries, replay controls, or role checks.

## BRI-121 App Startup Splash Screen
- Scope limited to the global presentation layer in `components/brand/app-splash-screen.tsx`.
- The splash is a client-side overlay that waits for initial app load and then fades out.
- No changes to SIWS verification, nonce lifecycle, cookie/session boundaries, wallet adapter behavior, RBAC, or protected route checks.

## Endpoint Map
| Endpoint | Method | Auth Required | Role Required | Behavior |
| --- | --- | --- | --- | --- |
| `/api/auth/nonce` | `GET` | No | None | Returns nonce (5 min TTL) and sets signed nonce cookie (`siws_nonce`) |
| `/api/auth/verify` | `POST` | No | None | Verifies SIWS signature against signed nonce cookie, sets `siws_session`, and clears `siws_nonce` |
| `/api/auth/me` | `GET` | Optional | None | Returns current auth payload and server-computed role |
| `/api/auth/logout` | `POST` | Optional | None | Revokes session token and clears cookie |
| `/api/referrals/preview` | `GET` | No | None | Returns truncated referrer preview for a valid referral code so invitee arrival UX can stay privacy-safe |
| `/api/protected/me` | `GET` | Yes | `user` or `admin` | Returns wallet pubkey if session exists |
| `/api/protected/referrals/summary` | `GET` | Yes | `user` or `admin` | Returns aggregate referral metrics for the authenticated wallet: referral code, share path, counts, reward totals, and milestone progress |
| `/api/protected/referrals/invitees` | `GET` | Yes | `user` or `admin` | Returns a paginated, privacy-safe invitee feed (`limit` + `offset`) with truncated identities and day-level timestamps only |
| `/api/protected/profile` | `GET` | Yes | `user` or `admin` | Returns wallet-bound profile + KYC/compliance summary + onboarding reward snapshot |
| `/api/protected/profile` | `PUT` | Yes | `user` or `admin` | Updates wallet-bound profile fields and returns refreshed onboarding reward snapshot |
| `/api/protected/kyc/status` | `GET` | Yes | `user` or `admin` | Returns KYC status + denormalized compliance status |
| `/api/protected/kyc/stripe/session` | `POST` | Yes | `user` or `admin` | Creates Stripe Identity verification session server-side |
| `/api/internal/compliance/aml/screen` | `POST` | SIWS admin or internal token | `admin` (session mode) | Executes AML screening pipeline for a wallet and persists projection |
| `/api/admin/compliance/cases/:walletPublicKey/aml` | `GET` | Yes | `admin` | Returns AML case snapshot and recent screening history |
| `/api/purchase/quote` | `POST` | No | None | Returns cached quote from guard state (`price`, `startDate`, `remaining`) + quantity contract (`quantityMode`, `quantity`, `totalPriceLamports`) |
| `/api/purchase/challenge` | `POST` | Yes | `user` or `admin` | Issues one-time purchase challenge (`challengeId`, canonical message, TTL) bound to `quantity` |
| `/api/purchase/prepare` | `POST` | Yes | `user` or `admin` | Verifies challenge signature + anti-replay/rate-limit, validates quantity policy, revalidates guard on-chain, returns pre-signed transaction + `attemptId` + `idempotencyKey` |
| `/api/purchase/submit` | `POST` | Yes | `user` or `admin` | Requires `attemptId + idempotencyKey`, validates signed tx payer/message, locks attempt row and persists `submitted` idempotently |
| `/api/checkout/cart` | `GET` | Yes | `user` or `admin` | Returns current wallet active cart with normalized totals |
| `/api/checkout/cart` | `POST/PATCH` | Yes | `user` or `admin` | Upserts item quantity in wallet active cart (server validates property + quantity) |
| `/api/checkout/cart` | `DELETE` | Yes | `user` or `admin` | Removes item from wallet active cart |
| `/api/checkout/order` | `POST` | Yes | `user` or `admin` | Converts active cart into order (`pending_payment`) with selected payment method and optional server-computed onboarding reward discount. `airwallex` is currently suspended and returns `PAYMENT_METHOD_DISABLED`. |
| `/api/checkout/order/:orderId` | `GET` | Yes | `user` or `admin` | Returns wallet-owned order snapshot |
| `/api/checkout/payment/start` | `POST` | Yes | `user` or `admin` | Starts payment attempt for enabled methods. Crypto remains active; `airwallex` is currently suspended and returns `PAYMENT_METHOD_DISABLED`. |
| `/api/webhooks/airwallex` | `POST` | No (SIWS) | None | Validates Airwallex HMAC signature + timestamp, dedupes event, reconciles payment/order status for retained provider infrastructure while card checkout is suspended |
| `/api/admin/ping` | `GET` | Yes | `admin` | Returns `403` unless wallet is allowlisted |
| `/api/admin/mint-orchestrator/jobs` | `POST` | Yes | `admin` | Creates a server-side mint job (`job_id`) |
| `/api/admin/mint-orchestrator/jobs` | `GET` | Yes | `admin` | Lists recent mint jobs with server progress |
| `/api/admin/mint-orchestrator/jobs/:jobId` | `GET` | Yes | `admin` | Returns a mint job snapshot |
| `/api/admin/mint-orchestrator/jobs/:jobId/next-batch` | `POST` | Yes | `admin` | Reserves next batch idempotently (`job_id + idempotency_key`) and enforces `createdBy` authority |
| `/api/admin/mint-orchestrator/jobs/:jobId/batches/:batchNo/submit` | `POST` | Yes | `admin` | Submits signed item signatures and enforces `createdBy` authority |
| `/api/admin/mint-orchestrator/jobs/:jobId/reconcile` | `POST` | Yes | `admin` | Reconciles signature confirmations via devnet RPC with `createdBy` authority check |
| `/api/admin/mint-orchestrator/jobs/:jobId/reconcile/das` | `POST` | Yes | `admin` | Reconciles submitted items via paginated DAS lookup with `createdBy` authority check |
| `/api/admin/core-candy-machine/snapshot/finalize` | `POST` | Yes | `admin` | Verifies minted quantity (DAS), persists `asset_mint_snapshots` + `asset_mint_onchain_proofs`, computes `Create Asset` gate |
| `/api/admin/assets/uploads/signed-url` | `POST` | Yes | `admin` | Issues signed upload contract; optional `editSessionId` keeps collection-editor uploads temporary until save |
| `/api/admin/assets/uploads/:uploadId/finalize` | `POST` | Yes | `admin` | Validates upload against signed contract (`draftId` + optional `editSessionId`) and persists finalized file ref |
| `/api/admin/assets/uploads/orphan-reconciler` | `POST` | Yes | `admin` | Reconciles orphaned session uploads and purges only non-promoted temporary files |
| `/api/admin/collections/:id` | `GET` | Yes | `admin` | Returns collection detail only after centralized ownership verification against marketplace entry and snapshot evidence |
| `/api/admin/collections/:id` | `PATCH` | Yes | `admin` | Updates one editable collection section only after payload validation and centralized ownership verification |
| `/api/admin/collections/:id/location-maps` | `GET` | Yes | `admin` | Returns the normalized location/maps section contract only after centralized ownership verification |
| `/api/admin/collections/:id/location-maps/autocomplete` | `GET` | Yes | `admin` | Returns Google Maps autocomplete suggestions only after centralized ownership verification |
| `/api/admin/collections/:id/location-maps/resolve` | `GET` | Yes | `admin` | Resolves a selected Google place into the reduced `googleMapsPlace` payload only after centralized ownership verification |
| `/api/webhooks/helius/mint-orchestrator` | `POST` | No (SIWS) | None | Ingests Helius events, validates optional webhook secret, deduplicates retries, reconciles job signatures |
| `/api/webhooks/stripe/identity` | `POST` | No (SIWS) | None | Validates Stripe signature, deduplicates event id, updates KYC/compliance status |

See reusable tracing playbook: `docs/purchase-tracing.md`.

## Trust Boundaries
- Client responsibilities:
  - Request nonce, sign SIWS message, submit signature.
  - Request purchase challenge, sign canonical challenge message, and attach signature in prepare request.
  - Edit profile fields from UI, while ownership and validation remain server-enforced.
  - Trigger Stripe-hosted verification flow using server-issued session URL.
  - Choose between `Explorar ahora` and `Completar perfil` after first auth; that decision affects navigation only.
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
  - In checkout flow, cart/order/payment APIs are wallet-bound server-side, never trust client-provided authority, and derive any onboarding reward discount from persisted reward state only.
  - Airwallex session is server-to-server (`client_id/api_key` -> bearer token), and webhook outcomes are only accepted after HMAC signature verification.
  - Backend signs purchase transactions as mandatory Candy Guard `thirdPartySigner`.
  - Enforce permanent job mutation authority: admin actor for manual mutations must match job `createdBy`.
  - Persist final Core Candy Machine snapshot + on-chain proof evidence and compute `Create Asset` eligibility.
  - Persist the onboarding reward ledger, enforce the 7-day qualification deadline plus 72-hour KYC review grace, and move reward state through `pending_profile`, `pending_kyc`, `pending_review`, `earned`, `reserved`, `consumed`, or `expired`.
  - Reserve, release, and consume the reward atomically with order state transitions so the discount remains one-time-use.
  - For admin asset uploads, validate admin session first and treat optional `editSessionId` as server-checked lifecycle metadata, never as client authority.
  - For admin collection detail writes, validate the section payload server-side, reject immutable cover changes, and bind updates to the authenticated admin wallet through ownership evidence.
- External webhook responsibilities:
  - Helius pushes signature lifecycle events.
  - Server never trusts webhook payload blindly: optional secret + dedupe + signature-level state transition checks.
- On-chain checks:
  - Reconcile endpoint validates transaction confirmation state via devnet RPC.

## Replay Protection
- Nonce TTL: 5 minutes.
- Nonce binding: SIWS message nonce must match signed nonce cookie value.
- Nonce invalidation: signed nonce cookie is cleared after verify attempt (success or failure), forcing fresh nonce for retries.
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

## Landing Featured Properties Data Source (BRI-65)
- `Featured Properties` cards on `/` are sourced server-side from `listMarketplaceProperties({})` and trimmed to the first 3 active records.
- Static property cards from `app/data/home*.json` remain as controlled fallback only when marketplace source returns zero records or is unavailable.
- When marketplace has records, landing always prioritizes those records over fallback cards.

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
| Checkout cart/order without SIWS session | `401` + `UNAUTHORIZED` | User must connect wallet and authenticate |
| Airwallex webhook missing/invalid signature | `400` + `INVALID_SIGNATURE` | Reject event, no state transition |
| Airwallex event duplicated | `200` with `duplicate_event` reason | Keep idempotent state, no repeated side effects |
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

## BRI-39 Home Copy + CTA Alignment

## BRI-68 Home Title Metadata Impact
- El cambio en `app/page.tsx` fija `title.absolute = "Home | BRIDS"` para la página de inicio.
- No modifica el flujo SIWS, nonce, cookies (`siws_nonce`/`siws_session`), verificación de firma ni controles RBAC.
- No se agregan ni alteran endpoints de autenticación/autorización.
- Scope:
  - Home UX copy and CTA routing updates for `Hero`, `Features`, `Promo`, `First investment`, `How to start`, and `FAQ` context chips.
  - New informational sections for tokenization process and app overview.
- Auth/session impact:
  - No change in SIWS challenge/nonce/session lifecycle.
  - No change in cookie trust boundaries.
  - No change in signature verification path (still server-side only).
- Navigation alignment:
  - Marketplace CTAs point to `/marketplace`.
  - Transparency CTAs point to `/transparencia`.
  - Wallet onboarding CTA points to `/protected/perfil`.

## BRI-39 Follow-up: Feature Icons
- Home `Features` cards now read icon values from locale data (`app/data/home*.json`) instead of a static bullet marker.
- Change is presentational only and does not alter auth/session boundaries, SIWS flow, nonce lifecycle, or signature verification.

## BRI-12 Wallet Connection Migration (`@solana/web3.js` -> `@solana/kit`)
- Scope:
  - SIWS server verification path migrates wallet public key handling to `@solana/kit`.
  - Wallet modal auth synchronization between browser contexts is hardened.
- Behavior:
  - Server verification normalizes incoming wallet address with `address(...)` and verifies signature bytes derived from `getAddressEncoder()`.
  - Client emits auth sync events on login/logout and revalidates session on sync/focus/visibility changes.
- Security boundary:
  - Session authority remains server-side only.
  - Sync channel is advisory for UX state; authorization decisions continue to use `httpOnly` cookie + server checks.

## STORY-010-03 Route and Template Infrastructure Impact
- Scope touched only public route architecture and reusable rendering templates.
- No change in SIWS primitives:
  - nonce issuance/consumption,
  - signature verification,
  - auth cookie/session lifecycle,
  - role resolution and RBAC boundaries.
- Story-010-03 remains a non-auth functional change.

## STORY-010-04 Technical SEO Infrastructure Impact
- Scope touched metadata generation, canonical resolution, robots/sitemap routes, and index/noindex policy wiring.
- No change in SIWS primitives:
  - nonce issuance/consumption,
  - signature verification,
  - auth cookie/session lifecycle,
  - role resolution and RBAC boundaries.
- Story-010-04 remains a non-auth functional change.

## STORY-010-05 Structured Data JSON-LD Layer Impact
- Scope touched JSON-LD emitters, schema validation, and semantic script injection in public pages.
- No change in SIWS primitives:
  - nonce issuance/consumption,
  - signature verification,
  - auth cookie/session lifecycle,
  - role resolution and RBAC boundaries.
- Story-010-05 remains a non-auth functional change.

## STORY-010-06 AI-readable and Machine Endpoints Impact
- Scope touched public machine-readable files and APIs:
  - `/llms.txt`, `/ai.txt`, `/knowledge.json`
  - `/api/knowledge`, `/api/entities`, `/api/definitions`
- No change in SIWS primitives:
  - nonce issuance/consumption,
  - signature verification,
  - auth cookie/session lifecycle,
  - role resolution and RBAC boundaries.
- Story-010-06 remains a non-auth functional change.

## STORY-010-08 Semantic Layer for Entities and Relations Impact
- Scope touched semantic rendering context and knowledge linking for:
  - `/knowledge/articles/[slug]`
  - `/knowledge/definitions/[slug]`
  - `/api/entities` semantic enrichment.
- No change in SIWS primitives:
  - nonce issuance/consumption,
  - signature verification,
  - auth cookie/session lifecycle,
  - role resolution and RBAC boundaries.
- Story-010-08 remains a non-auth functional change focused on semantic content modeling.

## STORY-010-09 Feeds, Exports, and Internal Search Readiness Impact
- Scope touched public feed/export/search-discovery endpoints:
  - `/feeds/rss`, `/feeds/json`, `/feeds/recent`, `/feeds/export`, `/feeds/search-index`
  - `public/feeds/manifest.json`
- No change in SIWS primitives:
  - nonce issuance/consumption,
  - signature verification,
  - auth cookie/session lifecycle,
  - role resolution and RBAC boundaries.
- Story-010-09 remains a non-auth functional change focused on machine-readable distribution and search preparation.

Last Updated: 2026-04-14 14:20:00 UTC

## STORY-010-10 Observability + Security + Deploy Impact
- Story-010-10 adds operational endpoints and telemetry hooks without changing SIWS authority boundaries.
- New endpoints in auth-adjacent operational surface:
  - `POST /api/analytics/events` (public, privacy-friendly event ingestion)
  - `GET /api/health` (public runtime health snapshot)
  - `GET /api/admin/monitoring/analytics` (admin-only analytics summary)
  - `GET /api/admin/monitoring/logs` (admin-only operability logs)
- Security hardening now applies globally through response headers and CSP policy in `next.config.ts`.
- Client analytics instrumentation is telemetry-only and does not grant or alter auth/session state.
- Explicit scope lock preserved: no non-code editorial interface is introduced in EPIC-010.

## BRI-63 Landing UI States Removal Impact
- Scope touched only public landing presentation:
  - removed `UiStatesSection` from `app/page.tsx`.
  - deleted `components/sections/ui-states.tsx`.
- No auth boundary changes:
  - nonce lifecycle unchanged,
  - SIWS signature verification unchanged,
  - cookie/session model unchanged,
  - role resolution and admin enforcement unchanged.

## EPIC-011 / BRI-81 Admin Collections List
- Added `GET /api/admin/collections` as an admin-only read endpoint for the collections console.
- The route requires:
  - authenticated SIWS session
  - server-resolved `admin` role
  - authenticated session `pubkey`
- The handler delegates ownership and consistency logic to the server-side collections read model instead of trusting request input or client state.
- No changes were made to nonce issuance, SIWS verification, cookie behavior, or role derivation.

## EPIC-011 / BRI-82 Admin Collections Screen Consumption
- `/admin/collections` now consumes the approved admin collections list contract on the server side.
- The page forwards the current request cookie context to `GET /api/admin/collections` instead of deriving client-trusted list state in the browser.
- Rendering remains read-only in this slice:
  - loading handoff
  - empty handoff
  - error handoff
  - minimal success rendering
- No changes were made to SIWS challenge issuance, signature verification, or session creation.

## EPIC-011 / BRI-92 Admin Collections State UX
- `/admin/collections` now renders polished loading, empty, and error states for the same server-derived page state.
- The UI copy explicitly preserves the trust boundary: ownership, snapshots, and editable sections are checked server-side.
- Empty/error CTAs are navigation-only affordances and do not grant access, mutate collection data, or bypass admin session checks.
- No changes were made to SIWS challenge issuance, signature verification, cookie behavior, or role derivation.

## EPIC-011 / BRI-93 Admin Collection Cards UI
- `/admin/collections` now renders the success state as visual collection cards instead of a minimal row list.
- Cards remain fully backed by the same server-derived read-model payload and do not introduce client-authoritative ownership logic.
- CTA surfaces added in cards are presentation-only in this slice; no auth/session or admin guard behavior changed.

## EPIC-011 / BRI-94 Admin Collection Detail Navigation
- Linked cards now navigate to `/admin/collections/[id]`.
- The destination route re-fetches detail server-side through the existing admin detail contract instead of trusting client route state.
- Non-linked cards remain blocked until the health/manual-review flow exists, so this slice does not widen admin authority boundaries.

## EPIC-011 / BRI-95 Read-Only Detail Shell
- `/admin/collections/[id]` now renders a stable read-only detail shell instead of a minimal handoff card.
- The shell still consumes the same server-fetched detail payload and does not introduce any client-authoritative ownership or editability logic.
- Cover lock semantics, section scaffolding, and document links are presentation-only in this slice; no auth/session, SIWS, or admin guard behavior changed.

## EPIC-011 / BRI-123 Clean-Code Admin UI Refactor
- `AdminShell`, the admin collections workspace, and the read-only detail shell were refactored into smaller presentation units.
- The refactor does not change route guards, session reads, SIWS verification, cookie handling, or admin role derivation.
- Navigation, cards, and detail sections remain presentation-only consumers of the same server-side auth and ownership contracts.

## EPIC-011 / BRI-96 Summary Editor
- `/admin/collections/[id]` now mounts a client-side editor only for the `Fractional investment summary` section.
- The edit loop still depends on the same authenticated admin request path:
  - existing `siws_session` cookie
  - server-side `admin` role derivation
  - server-side ownership validation inside `PATCH /api/admin/collections/[id]`
- The client only manages local draft/saving feedback and never becomes the authority for ownership, session validity, or editable scope.

## EPIC-011 / BRI-97 Property Information Editor
- `/admin/collections/[id]` now mounts a second client-side editor for the `Property information` section.
- Both text editors still persist through the same authenticated admin PATCH route and the same server-side ownership guard.
- No new auth flow, nonce behavior, cookie handling, or client-authoritative permission model was introduced.

## EPIC-011 / BRI-98 Gallery Tabs Shell
- `/admin/collections/[id]` now mounts a dedicated gallery shell with separate tabs for marketplace gallery and property imagery.
- The new tab state is presentation-only and does not change the authenticated request path, admin role derivation, or server-side ownership enforcement.
- No upload mutation, nonce, cookie, or client-authoritative permission behavior was introduced in this slice.

## EPIC-011 / BRI-99 Documents Editor
- `/admin/collections/[id]` now mounts a client-side documents editor that persists through the same authenticated admin PATCH route used by the other section editors.
- Document edits remain scoped to the `documents` section and still rely on the existing server-side ownership guard and admin role derivation.
- No new auth flow, nonce lifecycle, cookie handling, or client-authoritative permission model was introduced.

## EPIC-011 / BRI-100 API Regression Hardening
- `GET /api/admin/collections/[id]` and `PATCH /api/admin/collections/[id]` now carry explicit regression coverage around canonical ownership resolution and validation failures before repository access.
- The authenticated PATCH route now treats malformed JSON as `400 INVALID_COLLECTION_PAYLOAD` instead of falling through as a generic server failure.
- No new auth flow, nonce lifecycle, cookie handling, or client-authoritative permission model was introduced; this slice only hardens the existing admin-only route contract.

## EPIC-011 / BRI-111 Backend Location Maps Contract
- `GET /api/admin/collections/[id]/location-maps` now exposes a dedicated admin-only section contract for Google Maps/location UI.
- The route derives current location context, reduced place payload, and outbound/embed URLs only after the same server-side ownership check used by the main detail route.
- No new auth flow, nonce lifecycle, cookie handling, or client-authoritative permission model was introduced; this slice only narrows a read contract for later autocomplete/edit flows.

## EPIC-011 / BRI-112 Address Autocomplete
- `/admin/collections/[id]` now mounts a location editor that can search Google Maps addresses and resolve a selected place locally before persistence.
- `GET /api/admin/collections/[id]/location-maps/autocomplete` and `/resolve` remain server-authoritative, session-protected helpers behind the same ownership boundary as the rest of the detail surface.
- No new auth flow, nonce lifecycle, cookie handling, or client-authoritative permission model was introduced; this slice only adds lookup UX and reduced place resolution.

## EPIC-011 / BRI-114 Location Save/Cancel and QA
- The location editor now persists through the same authenticated `PATCH /api/admin/collections/[id]` route used by the other detail sections, with `section = googleMapsPlace`.
- The browser still stages autocomplete selection locally first, then commits only the reduced payload through the authenticated PATCH route when `Save location` is pressed.
- Focused Playwright and responsive QA now cover the location section without adding any new auth/session path.

## EPIC-011 / BRI-101 Playwright Admin Collections Flow
- `/admin/collections` and `/admin/collections/[id]` now have a deterministic Playwright browser flow that still begins with a real admin SIWS authentication step.
- The supporting fixture path is intentionally read-only and server-gated:
  - it applies only to `GET /api/admin/collections` and `GET /api/admin/collections/[id]`,
  - it activates only when the `brids_admin_collections_fixture` cookie is present,
  - and it is disabled in production (`NODE_ENV === "production"` returns no fixture).
- The fixture does not bypass auth or authority:
  - proxy/admin role checks still require a valid SIWS session,
  - detail access still flows through the authenticated server handlers,
  - section save coverage still uses the same authenticated PATCH route contract and server-side validation/ownership checks.
- No new auth flow, nonce lifecycle, cookie handling, or client-authoritative permission model was introduced in this slice.
