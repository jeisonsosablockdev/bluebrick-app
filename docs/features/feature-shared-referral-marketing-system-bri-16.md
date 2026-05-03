# Feature: Shared Referral Marketing System (`BRI-16`)

## Slice `S01` - Wallet-First Referral Schema Alignment
- Added canonical migration [023_referral_wallet_first_schema.sql](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/db/migrations/023_referral_wallet_first_schema.sql) for the referral domain.
- Kept the schema aligned to the repo's existing `wallet_public_key` identity model instead of introducing a new `users(id)` dependency.
- Anchored reward eligibility to the current NFT purchase pipeline:
  - `purchase_attempts`
  - `purchase_webhook_events`
  - Helius-reconciled confirmation flow
- Anchored KYC gating to the current compliance pipeline:
  - `user_profiles`
  - `kyc_cases`
- Added payout batching support with `referral_payout_items` so admin distributions stay auditable at reward-event level.
- Added migration contract coverage in [referral-wallet-first-schema-migration.test.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/tests/db/referral-wallet-first-schema-migration.test.ts).

## Slice `S02` - Referral Domain Repository on Existing Wallet Model
- Added [lib/referrals/domain.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/lib/referrals/domain.ts) to centralize referral invariants:
  - opaque code generation
  - active attribution statuses
  - 30-day eligibility window derivation
  - expiration status resolution
- Added [lib/referrals/repository.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/lib/referrals/repository.ts) as the first persistence layer for:
  - one opaque code per referrer wallet
  - first-auth referral binding
  - active-wallet uniqueness enforcement
  - KYC promotion to `kyc_verified`
  - expiry of stale attributions with wallet release
- Exposed `ensureProfileExists` from [lib/compliance/profile-repository.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/lib/compliance/profile-repository.ts) so referrals reuse the current compliance/profile creation path instead of duplicating wallet bootstrap logic.
- Added [referrals-repository.test.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/tests/lib/referrals-repository.test.ts) to lock the binding contract before wiring it into auth/webhook flows.

## Slice `S03` - Reward Lifecycle Engine
- Added [lib/referrals/reward-engine.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/lib/referrals/reward-engine.ts) as a pure backend reward service on top of the referral schema.
- The reward engine now owns:
  - active reward-rule registration by collection
  - idempotent purchase signal ingestion per `purchaseAttemptId + nftMintAddress`
  - transition to `pending_qualification` when purchase arrives before KYC
  - transition to `pending_settlement` when KYC is already satisfied
  - settlement to `accrued`, `rejected`, or `risk_hold` after the holding window
- Added [referral-reward-engine.test.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/tests/lib/referral-reward-engine.test.ts) to lock:
  - fixed `10 USDC` reward behavior
  - duplicate purchase protection
  - KYC-late promotion flow
  - holding-period settlement outcomes

## Slice `S04` - Helius + Stripe Hook Integration
- Wired [lib/purchase-webhook-reconciliation.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/lib/purchase-webhook-reconciliation.ts) to the reward engine after confirmed purchase reconciliation.
- Confirmed purchase events now extract NFT mint candidates from Helius enhanced payloads using:
  - `events.nft.nfts[].mint`
  - `tokenTransfers[].mint` when marked `NonFungible`
  - `accountData[].tokenBalanceChanges[].mint` as fallback for 0-decimal NFT balance changes
- Wired [lib/kyc/stripe-webhook-handler.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/lib/kyc/stripe-webhook-handler.ts) so `identity.verification_session.verified` now:
  - marks the referral attribution as KYC-approved
  - promotes any `pending_qualification` reward events to `pending_settlement`
  - keeps AML screening as the downstream compliance continuation
- Extended [purchase-webhook-reconciliation.test.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/tests/lib/purchase-webhook-reconciliation.test.ts) and [stripe-webhook-handler-process.test.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/tests/lib/stripe-webhook-handler-process.test.ts) to lock the webhook-to-reward side effects.

## Slice `S05` - Admin Payout Batching
- Added [lib/referrals/payout-service.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/lib/referrals/payout-service.ts) to batch `accrued` referral rewards into admin-approved payout batches before any distribution happens.
- Payout batching now:
  - resolves eligible reward events from the canonical referral attribution chain
  - creates auditable payout rows plus event-level payout items
  - transitions reward events from `accrued` to `pending_admin_distribution`
  - marks linked reward events as `paid` only after an explicit admin execution step with payout signature evidence
- Extended [lib/referrals/repository.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/lib/referrals/repository.ts) with referrer-centric attribution lookups for later dashboard/read-model slices.
- Extended [lib/referrals/reward-engine.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/lib/referrals/reward-engine.ts) with attribution-level reward listing and bulk status transitions so payout and dashboard flows reuse the same domain contracts.
- Added [referral-payout-service.test.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/tests/lib/referral-payout-service.test.ts) to lock admin payout approval and execution behavior in memory-first TDD.

## Slice `S06` - First Auth Referral Binding Contract
- Extended [app/api/auth/verify/route.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/app/api/auth/verify/route.ts) so the first SIWS verify payload can accept optional referral fields:
  - `referralCode`
  - `attributionSource`
  - `attributionMetadata`
- Referral binding now happens only when the wallet is still new at auth time; already-registered wallets explicitly return `skipped_existing_wallet` to block late attachment.
- Extended [lib/auth-client.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/lib/auth-client.ts) so the SIWS client contract can pass referral context end-to-end even before the UI slice consumes it.
- Added [auth-verify-route.test.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/tests/api/auth-verify-route.test.ts) to lock:
  - valid first-auth referral binding
  - skip on existing wallets
  - unchanged nonce-clear behavior on verification failure
- Synced canonical auth/session docs in [auth-flow.md](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/docs/auth-flow.md) and [session-model.md](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/docs/session-model.md).

## Slice `S07` - Client Referral Hint Capture and Manual Fallback
- Added [lib/referrals/client-state.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/lib/referrals/client-state.ts) to centralize client-only referral hint handling:
  - `?ref=` extraction from current URL
  - normalization/serialization of pre-auth referral state
  - local persistence in `brids_referral_hint`
  - source derivation (`link`, `manual`, `deep_link`)
  - Phantom mobile deep-link generation that preserves the full return URL
- Wired [WalletModal.tsx](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/components/WalletModal.tsx) so:
  - referral code is prefilled from `?ref=`
  - the code stays editable before first sign-in
  - manual edits override the auto-captured hint
  - the first SIWS verify payload sends referral context from the live client state
- Added [referral-client-state.test.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/tests/lib/referral-client-state.test.ts) to lock URL extraction, serialization safety, source derivation, and Phantom deep-link preservation.
- Updated [auth-flow.md](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/docs/auth-flow.md) and [session-model.md](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/docs/session-model.md) so the auth docs reflect pre-auth referral hint persistence as client-only state.

## Slice `S08` - Invitee Welcome Preview
- Added [lib/referrals/preview-service.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/lib/referrals/preview-service.ts) and exported repository lookup by code so public invitee UX can resolve referral preview without exposing full wallet identities.
- Added [app/api/referrals/preview/route.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/app/api/referrals/preview/route.ts) as a public read-only endpoint that returns:
  - normalized referral code
  - truncated `referrerWalletDisplay`
- Added [InviteeWelcomeBanner](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/components/referrals/invitee-welcome-banner.tsx) and mounted it on [app/page.tsx](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/app/page.tsx) so invitees arriving with `?ref=` get a subtle, immediate welcome hint before authentication.
- Added [referral-preview-route.test.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/tests/api/referral-preview-route.test.ts) to lock missing-code, valid-code, and unknown-code behavior.
- Synced endpoint documentation in [auth-flow.md](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/docs/auth-flow.md) and [session-model.md](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/docs/session-model.md).

## Slice `S09` - Protected Referral Summary API
- Added [lib/referrals/dashboard-service.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/lib/referrals/dashboard-service.ts) as the first referrer read model on top of the canonical wallet-first referral domain.
- The service now consolidates:
  - referrer referral code and share path
  - pending vs completed invitee counts
  - notification count for completed referrals
  - `accrued`, `pending_admin_distribution`, and `paid` totals
  - next milestone progress
  - privacy-safe invitee list with truncated wallet displays
- Added [app/api/protected/referrals/summary/route.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/app/api/protected/referrals/summary/route.ts) so the dashboard can consume a single wallet-bound referral summary contract.
- Added [referral-dashboard-service.test.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/tests/lib/referral-dashboard-service.test.ts) and [protected-referrals-summary-route.test.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/tests/api/protected-referrals-summary-route.test.ts) to lock the read model and the protected route contract.
- Synced the new protected endpoint in [auth-flow.md](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/docs/auth-flow.md) and [session-model.md](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/docs/session-model.md).

## Slice `S10` - Paginated Invitee Feed Hardening
- Split the referral dashboard backend contract into:
  - aggregate summary from [getReferralDashboardSummary](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/lib/referrals/dashboard-service.ts)
  - paginated invitee feed from [listReferralDashboardInvitees](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/lib/referrals/dashboard-service.ts)
- Added [listReferralAttributionsPageForReferrer](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/lib/referrals/repository.ts) so invitee reads are bounded server-side with `limit + offset` instead of returning the full set.
- Added [GET /api/protected/referrals/invitees](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/app/api/protected/referrals/invitees/route.ts) as a wallet-bound, no-store endpoint for privacy-safe invitee pagination.
- Kept privacy rules enforced in backend:
  - truncated wallet display only
  - day-level timestamps only
  - no client-authoritative referrer identity
- Added [referral-dashboard-service.test.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/tests/lib/referral-dashboard-service.test.ts) pagination coverage and [protected-referrals-invitees-route.test.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/tests/api/protected-referrals-invitees-route.test.ts) route contract coverage.

## Slice `S11` - Referrer Dashboard UI and Share Surface
- Added [ReferralProgramModule](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/components/dashboard/referral-program-module.tsx) as the visible referral surface inside the protected overview dashboard.
- The UI now consumes:
  - aggregate summary from `GET /api/protected/referrals/summary`
  - invitee feed from `GET /api/protected/referrals/invitees`
- Exposed MVP referrer actions:
  - `Copy link`
  - `Share by email`
- Kept the share action functional before the public social route lands by using a direct app fallback URL: `/?ref=<referralCode>`.
- Rendered referral KPIs and retention signals:
  - pending vs completed invitees
  - accrued / pending admin distribution / paid rewards
  - milestone progress bar
  - notification indicator
  - paginated invitee activity cards
- Wired the new module into [OverviewModule](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/components/dashboard/overview-module.tsx) so it appears both for empty-investment and active-investment dashboard states.
- Added [referral-program-module.test.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/tests/components/referral-program-module.test.ts) to lock copy-share behavior and invitee pagination on the client.

## Slice `S12` - Public Share Route and Dynamic Social Metadata
- Added [app/r/[code]/page.tsx](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/app/r/[code]/page.tsx) as the canonical public referral-share route.
- The route now:
  - resolves the referral code through the existing preview service
  - generates dynamic page metadata using the truncated referrer display
  - keeps the page `noindex`
  - redirects human users into the app onboarding flow at `/?ref=<referralCode>`
- Added [ReferralShareLanding](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/components/referrals/referral-share-landing.tsx) as a minimal public landing that:
  - exposes the referral code visibly
  - auto-redirects after a short delay
  - keeps a manual continue CTA for browsers that do not auto-forward
- Updated [ReferralProgramModule](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/components/dashboard/referral-program-module.tsx) so copy/share actions now use the public `/r/<code>` route instead of the temporary direct-app fallback.
- Added [referral-share-landing.test.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/tests/components/referral-share-landing.test.ts) to lock the redirect and manual-continue contract.

## Fix - Client-Safe Referral Domain Boundary
- Removed server-only `node:crypto` usage from [lib/referrals/domain.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/lib/referrals/domain.ts) so client-side referral consumers no longer pull an unsupported Node URI scheme into the browser bundle.
- Moved opaque referral code generation into the server-side [lib/referrals/repository.ts](/Users/jaymusicmachine/Documents/Desarrollo/solana-test-1/lib/referrals/repository.ts), which is the only layer that actually needs entropy for referral code creation.
- Verified the fix with:
  - `npm run validate`
  - `npm run build`

## Notes
- This slice intentionally does not apply the untracked draft referral migrations currently present in the workspace.
- Later slices must build repositories, workers and read models on top of this canonical wallet-first schema.
