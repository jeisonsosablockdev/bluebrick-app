# implementation(shared): hybrid auth bidirectional linking and safe account consolidation

## Status

- Solution artifact
- Depends on:
  - `docs/fixes/fix-hybrid-auth-bidirectional-linking-and-safe-account-consolidation.md`
  - `docs/features/feature-shared-hybrid-auth-workos-wallet-bri-154.md`

## Goal

Implement a safe, explicit consolidation model that covers both directions:

- `mail/account -> wallet`
- `wallet -> mail/account`

and resolves pre-existing split-account scenarios without weakening the wallet-first trust model.

## Decision Summary

### 1. Consolidation direction

When automatic consolidation is allowed, the wallet-backed account always wins.

### 2. Automatic consolidation eligibility

Automatic consolidation is allowed only when:

- the user explicitly initiated a linking/consolidation flow
- the user proves control of both identities during that flow
- source account is federated-only
- target account is wallet-backed
- source account is not admin-capable
- target account is not elevated in a way the policy marks review-required
- source account has only low-risk account-bound data that the backend can migrate atomically today

### 3. Manual review boundary

Return a review-required result instead of auto-merging when:

- either account is admin-capable
- source account has any linked wallet
- the system detects non-migratable or ambiguous state
- the user did not prove both sides in the same short-lived operation context

### 4. No wallet reassignment

Automatic consolidation never transfers a wallet to another account.

Instead:

- if the wallet already belongs to account `B`
- and the user proves control of federated account `A`
- the system absorbs `A` into `B` when safe

## Proposed Runtime Design

## Flow A: wallet -> mail/account

### UX entry

Expose a first-class `Link email` or `Link federated sign-in` CTA from a wallet-authenticated surface.

Recommended initial surface:

- `/protected/perfil`

Optional secondary surface later:

- global wallet modal when wallet-authenticated and no federated identity is linked

### Server sequence

1. User starts from a valid SIWS wallet-authenticated session.
2. Backend issues a short-lived pending `federated_link_context` cookie/state bound to:
   - `targetAccountId`
   - `walletPublicKey`
   - operation type
   - issuance timestamp
3. Backend redirects the user into WorkOS sign-in with a dedicated completion `returnTo`.
4. After WorkOS callback, a completion route reads:
   - active WorkOS identity
   - pending federated-link context
   - current SIWS wallet session
5. Completion route resolves one of three outcomes:
   - `same_account`: already linked, succeed idempotently
   - `link_new_identity`: WorkOS identity not linked anywhere yet, attach it to the wallet-backed account
   - `consolidate_into_wallet_account`: WorkOS identity exists on another federated-only account, auto-merge only if safe
6. On success, redirect to a clear success destination.
7. On unsafe conflict, redirect to a review-required destination and clear the pending context.

## Flow B: mail/account -> wallet

### Existing path to preserve

Keep the current guarded SIWS wallet-link route.

### New conflict handling

When `/api/auth/link/wallet/verify` proves the wallet but finds that the wallet is already linked to another account:

1. Resolve the current federated account.
2. Resolve the wallet-backed target account for the signed wallet.
3. If both account ids already match, succeed idempotently.
4. If they differ:
   - auto-consolidate only if the current federated account is federated-only and low-risk
   - otherwise return review-required instead of raw dead-end conflict
5. After successful consolidation, continue the same post-link steps:
   - session issuance
   - profile email prefill
   - referral-intent promotion

## Flow C: split accounts already exist

This is the recovery model for users who independently created both sides first.

The fix treats this as explicit consolidation, not implicit merge.

Supported safe automatic recovery:

- federated-only account `A`
- wallet-backed account `B`
- user proves control of WorkOS for `A`
- user proves fresh SIWS for wallet in `B`
- backend absorbs `A` into `B`

Unsupported for automatic merge:

- account `A` also has wallet identities
- admin-capable accounts
- ambiguous material state

Those cases must fail into review-required handling.

## Repository And Domain Changes

## 1. Raw hybrid auth resolution helper

Add a lower-level helper that can read both auth layers without collapsing them into fail-closed anonymous semantics.

Need:

- current WorkOS account identity
- current wallet identity
- their independently resolved BRIDS account ids
- whether they conflict

Reason:

- explicit consolidation flows must inspect both sides even when the normal request model would intentionally hide them behind `sessionConflict`

## 2. Federated-link operation context

Add a new pending operation context for `wallet -> mail/account`.

Requirements:

- signed token + server-stored context
- short-lived
- single-use
- cleared on success, failure, logout, or mismatch

Suggested fields:

- `targetAccountId`
- `walletPublicKey`
- `issuedAt`
- `expiresAt`
- `operation = federated_link`

## 3. Account consolidation helper

Add a repository/service helper with a name like:

- `mergeFederatedOnlyAccountIntoWalletAccount`

This helper must:

- run inside one transaction
- lock both account records
- verify source/target eligibility
- migrate allowed account-bound rows
- rebind the federated identity to the wallet-backed account
- delete the absorbed account
- return the winning account bundle

## 4. Low-risk row migration contract

Automatic consolidation may migrate only rows that are account-bound and safe today.

Current expected set:

- `account_federated_identities`
- `account_referral_intents`

Expected no-op or invariant checks:

- `web_push_subscriptions` should not exist on a federated-only account because ownership requires wallet auth
- `user_profiles.account_id` should not require remap for a federated-only account with zero wallets

If those assumptions are false at runtime, return review-required.

## 5. Referral precedence

During consolidation:

- wallet-bound referral truth wins
- provisional account referral intent may move only if the winning wallet account has no conflicting final attribution
- if a conflict exists, close or discard the provisional intent safely instead of duplicating attribution

## Routing Plan

## New routes

- `GET /api/auth/link/federated/start`
  - requires wallet-authenticated session
  - creates pending federated-link context
  - redirects to `/sign-in?returnTo=<completion-path>`

- `GET /auth/link/federated/complete`
  - server completion path after WorkOS callback
  - finalizes direct link or safe consolidation
  - clears pending context
  - redirects to success or review-required destination

## Changed routes

- `POST /api/auth/link/wallet/verify`
  - on `WALLET_ALREADY_LINKED`, do not stop immediately
  - resolve whether safe automatic consolidation can absorb the current federated-only account into the wallet-backed account

- `POST /api/auth/logout`
  - clear any new pending federated-link context

- `GET /api/auth/me`
  - keep current payload
  - ensure conflict-aware client surfaces can read `sessionConflict`

## UI Plan

## Minimum viable UX

1. Add a `Link email` CTA from `/protected/perfil` when:
   - wallet-authenticated
   - WorkOS is configured
   - no federated identity is linked yet

2. Add a user-visible success/error banner for:
   - federated link success
   - link expired
   - review required

3. Preserve the existing `mail/account -> wallet` UI path.

4. Improve the conflict message for unresolved consolidation so the user is not left in a raw dead-end state.

## Testing Plan First

## Unit / repository

- merge federated-only account into wallet-backed account
- reject merge when source has wallet identities
- reject merge when admin-capable account is involved
- migrate or safely discard referral intent according to precedence rules
- clear pending federated-link context on success/failure

## Route tests

- `GET /api/auth/link/federated/start` requires wallet auth
- `GET /auth/link/federated/complete` links a brand-new WorkOS identity onto the wallet account
- `GET /auth/link/federated/complete` auto-consolidates a federated-only account into the wallet account when safe
- `GET /auth/link/federated/complete` returns review-required on unsafe consolidation
- `POST /api/auth/link/wallet/verify` auto-consolidates safe split-account conflicts
- `POST /api/auth/link/wallet/verify` still fails closed on unsafe conflicts

## App / component tests

- profile surface shows `Link email` CTA for wallet-only users
- success and review-required banners render correctly
- no CTA is shown when federated identity is already linked

## Browser / auth evidence

- Playwright:
  - wallet-authenticated user reaches link-email CTA and redirect chain
  - federated-first user can still link wallet
  - conflict recovery path lands on deterministic outcome

- Synpress:
  - wallet-first path with real SIWS step-up remains functional

## Canonical Docs To Update During Implementation

Before closing implementation, update:

- `docs/auth-flow.md`
- `docs/session-model.md`

Must add:

- bidirectional linking
- explicit consolidation flow
- conflict and review-required outcomes
- updated trust boundaries
- replay/single-use operation context notes

## Slice Map

### s01 - domain and docs slice

- create fix artifact pair
- define winning-account and review-required rules
- update canonical auth/session docs when code lands

### s02 - auth context and operation context

- add raw hybrid auth resolver
- add federated-link context helpers
- extend logout clearing

### s03 - repository consolidation

- add transactional federated-only-into-wallet merge helper
- add low-risk eligibility checks
- add referral-intent handling

### s04 - wallet -> mail/account flow

- add start route
- add completion route
- add profile CTA and status messaging

### s05 - mail/account -> wallet conflict recovery

- extend wallet-link verify route
- add safe auto-consolidation path
- preserve current success behavior

### s06 - QA and docs hardening

- targeted vitest coverage
- Playwright + Synpress evidence
- canonical doc updates

## Tooling And Gates

- `npm test -- --run <targeted auth tests>`
- `npm run validate`
- Playwright auth coverage required
- Synpress wallet/auth coverage required

Implementation does not close until:

- required docs are updated
- targeted tests pass
- auth/browser evidence passes
- reviewer pass finds no unresolved blocking auth or trust-boundary issue
