---
type: Feature Spec
title: Feature Shared HyBRI-d Auth Workos Wallet BRI- 154
description: Feature Shared HyBRI-d Auth Workos Wallet BRI- 154 - migrated from knowledge/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-shared-hybrid-auth-workos-wallet-bri-154.md
---

# feature(shared): hybrid federated login plus wallet-linked auth (BRI-154)

## Status

- Planning artifact
- Parent issue: `BRI-154`
- Integration branch: `feature/shared-hybrid-auth-workos-wallet-bri-154-integration`
- Current slice: `feature/shared-hybrid-auth-workos-wallet-bri-154-s09-login-modal-ui-clarity`

Operational guardrail added during implementation:

- WorkOS entry routes must fail closed when the environment is not fully configured.
- The federated CTA must stay hidden whenever WorkOS is unavailable, so the UI cannot send users into a broken `/sign-in` path.

Current UI polish focus:

- The sign-in modal must present one clear login choice at a time.
- Mail and wallet entry points must be exposed through an explicit method switcher instead of stacked competing actions.
- The `Mail` and `Wallet` method toggles must reuse BRIDS pill-button language: active state uses the primary gradient and inactive state uses the dark outline treatment.
- Secondary controls such as referral code, copy address, and disconnect actions must only appear when the current state makes them usable.
- The email sign-in CTA must use the same primary pill treatment as the rest of BRIDS primary actions instead of a one-off secondary style.

Operational hardening added during fixes:

- Wallet linking must fail closed for identity mismatches, but optional referral-intent promotion must fail open. A referral persistence error must never block account-to-wallet linking or session issuance once SIWS verification has succeeded.

Current profile-capture focus:

- When a user authenticates through WorkOS, BRIDS may trust the provider email as federated account identity data.
- BRIDS may copy that email into `user_profiles.email` only on the server side and only when the wallet profile email is currently empty.
- BRIDS must never import or sync provider avatar/photo data into the BRIDS profile.
- BRIDS must not overwrite an existing profile email unless an explicit future policy approves that behavior.

This is a planning artifact. It defines scope, guardrails, sequencing, and the design decisions for the feature. The identity model is closed in this document now. Lower-level persistence and implementation mechanics still belong to later execution slices.

## Summary

Design a hybrid authentication model for BRIDS that allows a user to start with federated login and later link a Solana wallet, while preserving wallet-based authority for financial, regulated, and on-chain actions.

This initiative does not replace SIWS. It introduces a lower-friction account entry path and a later wallet-linking step for users who are not ready to install Phantom on day one.

## Problem

Today BRIDS is effectively wallet-first:

- A user must already control a Solana wallet to authenticate.
- Session identity is centered on `wallet_public_key`.
- Several account, compliance, and protected flows assume wallet presence from the start.

That model is correct for high-trust actions, but it creates unnecessary onboarding friction for a user who only wants to create an account, provide basic profile data, and continue later from a familiar login method.

## Product Goal

Support two entry paths for the same human:

1. Federated login first, without an existing wallet.
2. Wallet login through Phantom/SIWS, either immediately or after linking a wallet later.

The same BRIDS account must be able to evolve from a basic account into a wallet-linked account without splitting identity or weakening trust boundaries.

## Core Principles

- BRIDS database remains the source of truth for account state.
- Wallet-based authentication remains the strong identity for sensitive actions.
- Federated-only accounts stay low-authority.
- No critical financial, regulated, or on-chain action is authorized from federated identity alone.
- Wallet linking must be explicit and cryptographically verified.
- Existing SIWS protections remain in force and are not bypassed by the federated path.

## Identity Model Decision

The decisions in this section are closed for the feature unless a later change is explicitly approved in this same document.

### 1. Account Identity

Introduce an internal `user_id` as the canonical application account identifier for:

- basic account existence
- federated authentication continuity
- basic profile data
- user preferences and onboarding progress

This `user_id` is intentionally low-authority. By itself, it must not unlock high-risk mutations.

Decision:

- `user_id` is the canonical account container for BRIDS.
- `user_id` is not the strong authority for financial, regulated, or privileged actions.
- `user_id` may exist before any wallet is linked.

### 2. Wallet Identity

Retain `wallet_public_key` as the high-trust identity required for:

- wallet ownership proof
- SIWS authentication
- financial actions
- regulated/compliance-gated flows
- on-chain or pre-on-chain sensitive operations

Decision:

- `wallet_public_key` remains the strong identity for wallet-bound execution.
- wallet authority is proven only through real SIWS authentication and server-side verification.
- wallet presence alone is not enough for a link operation unless the wallet proof is tied to the correct active account session.

### 3. Federated Identity

Federated identity is the low-friction entry point for a user who does not yet have a Solana wallet.

Decision:

- WorkOS identity is an account-access identity, not a financial authority.
- A federated identity can create and resume an account.
- A federated identity can never independently grant wallet ownership, admin authority, compliance clearance, or financial execution rights.

### 4. Identity Linking

A single BRIDS account may own multiple linked identities over time:

- one federated identity from WorkOS AuthKit
- one or more linked wallet identities, subject to product rules

Linking a wallet must require a real SIWS verification step and must resolve to the existing `user_id`, not create a duplicate account.

The SIWS proof used for wallet linking is not sufficient on its own. The linking attempt must also be bound to the currently authenticated WorkOS account identity so that a valid wallet signature cannot be replayed to attach the wallet to a different signed-in account.

Decision:

- Linking is an explicit, authenticated action.
- Linking from the federated path requires:
  - an active WorkOS session
  - a server-issued pending link context bound to that account identity
  - a fresh SIWS proof bound to that same context
- The backend must reject the link if the active WorkOS account at completion time is not the same account that initiated the link.
- A wallet may be linked to only one BRIDS account at a time.
- A federated identity may be linked to only one BRIDS account at a time.
- A linked wallet is globally unique across BRIDS account identities. The same `wallet_public_key` must never authenticate, link, or resolve into two different BRIDS accounts, even if the competing sessions come from different federated emails.
- The pending link context must be:
  - single-use
  - short-lived, with a maximum validity window of 5 minutes
  - bound to the initiating `user_id`, WorkOS account identity, and intended operation
  - invalidated on success, failure, logout, session rotation, or account-context change
- A stale, reused, or mismatched pending link context must fail closed.

### 5. Session Model Decision

BRIDS will treat WorkOS and SIWS as separate session layers that are composed server-side into one request authority model.

Decision:

- `workos_session` and `siws_session` remain isolated cookies.
- The backend derives request authority from the combination of:
  - active `user_id`
  - linked `wallet_public_key`, if present
  - wallet-authenticated state, if present
  - admin/compliance capability derived from the linked wallet and server-side records
- If both sessions are present and resolve to different BRIDS accounts, the request must fail closed.
- If only a WorkOS session exists, the request is a low-authority account session.
- If only a SIWS session exists, the request is a wallet-authenticated session that resolves through the wallet-linked account model.

### 6. Account State Decision

The system will recognize distinct authority states for the same account.

Decision:

- `anonymous`: no WorkOS session, no SIWS session
- `account_only`: WorkOS session, no linked wallet authenticated for the request
- `wallet_linked`: account has a linked wallet on record, but no active SIWS step-up on the request
- `wallet_authenticated`: account session includes a valid SIWS-authenticated linked wallet
- `financially_enabled`: wallet-authenticated and all required financial/compliance gates pass
- `admin_wallet_authenticated`: wallet-authenticated and wallet-derived admin authority passes

These are capability states, not separate account types.

### 7. Login Resolution Decision

Decision:

- Federated-first signup creates an account-only BRIDS account with a `user_id`.
- Direct SIWS login on an unknown wallet creates a wallet-first BRIDS account when no active WorkOS session is present.
- SIWS performed while a WorkOS session is actively in a linking flow is treated as a link attempt to that current account, not as a request to create a new account.
- SIWS login on a wallet already linked to an account must always resolve to that existing BRIDS account.
- WorkOS login on a federated identity already linked to an account must always resolve to that existing BRIDS account.
- If a signed-in federated account attempts to link a wallet that is already linked elsewhere, BRIDS must fail closed and preserve the existing wallet-to-account binding. A second email account must not be able to authenticate as that wallet by linking or replaying SIWS from another account context.

### 8. Merge And Conflict Decision

Decision:

- BRIDS will not auto-merge accounts based on email, profile fields, or user assumptions.
- If a user independently creates:
  - a federated-only account
  - and a separate wallet-first account
  BRIDS will treat them as separate until the user proves control of both identities in an explicit consolidation flow.
- Consolidation must be explicit and server-controlled. It must never happen silently from heuristic matching.
- A consolidation or recovery flow must require proof of control for both sides of the conflict:
  - active authenticated control of the federated account context
  - fresh SIWS proof for the wallet-linked account context
- If BRIDS cannot prove both sides with high confidence, the flow must fail closed.
- If the affected account has financially active, compliance-relevant, or admin-sensitive state, consolidation or recovery must require manual review rather than automatic reassignment.
- If a wallet is already linked to another BRIDS account, a link attempt from the current account must fail closed and must not transfer the wallet.
- If two different federated emails each try to claim the same wallet, the wallet remains bound to its current BRIDS account and the second claim must fail closed until an explicit server-controlled consolidation or recovery flow is completed.
- If both WorkOS and SIWS sessions are present but map to different accounts outside an explicit consolidation flow, BRIDS must fail closed and require the user to restart from a known account context.

### 9. Wallet Unlink Decision

Decision:

- Wallet unlinking is allowed only when it does not break account safety or ownership continuity.
- BRIDS must block unlinking when the wallet is:
  - the only linked wallet on an account with active financial assets
  - the only linked wallet backing regulated or compliance-relevant state
  - the only linked wallet that currently grants administrative authority
- A safe replacement path must exist before such a wallet can be removed.
- Unlinking must be treated as a security-sensitive mutation and require strong reauthentication.

### 10. Strong Reauthentication Decision

Decision:

- Strong reauthentication for identity-link mutations means:
  - the request resolves to the expected BRIDS account context
  - the account session is still active and unrotated
  - a fresh SIWS challenge is verified server-side for the linked wallet
  - the SIWS proof is bound to the specific operation context with a short validity window of 5 minutes or less
- For federated-initiated identity-link mutations, the active WorkOS account identity must still be the same identity that initiated the operation context, even if AuthKit rotates an internal session id between requests.
- Strong reauthentication is mandatory for:
  - wallet linking completion
  - wallet unlinking
  - federated identity linking or unlinking on admin-capable accounts
  - any consolidation or recovery flow that could change which account owns a wallet

### 11. Referral Intent Decision

BRIDS must preserve a valid referral across federated-first onboarding without turning federated login into the final source of referral truth.

Decision:

- BRIDS will distinguish between:
  - `referral_intent`: provisional, account-bound, non-reward-bearing
  - `referral_attribution`: final, wallet-bound, reward-bearing
- A federated-first BRIDS account may store one active `referral_intent`.
- A `referral_intent` exists only to preserve onboarding continuity until the user links or authenticates a wallet.
- A `referral_intent` must never generate rewards, payout eligibility, or any financial/compliance side effect by itself.
- Final referral binding still happens only at the wallet-bound step:
  - first wallet authentication
  - or wallet linking completion
- On the final wallet-bound step, BRIDS may promote the active `referral_intent` into a final `referral_attribution` only if:
  - the wallet resolves to the same BRIDS account context
  - the referral code is still valid
  - self-referral checks still pass
  - no conflicting active wallet-bound attribution already exists
- Once promoted, the originating `referral_intent` must be consumed and invalidated atomically so it cannot be reused or promoted twice.
- If the wallet already has a final active attribution, BRIDS must preserve that wallet-bound truth and discard or close the provisional `referral_intent` without creating a duplicate.
- A federated account must not hold multiple concurrent active referral intents.
- In any conflict between provisional account referral state and existing wallet-bound referral state, wallet-bound truth wins and the system fails closed against duplication.

## Authorization Guardrails

Federated-only users may:

- create an account
- sign in
- persist onboarding progress (in a staged, read-only state)
- access non-sensitive protected experiences that do not rely on wallet ownership
- initiate the wallet-linking flow

Federated-only users may not:

- edit basic profile fields (mutation requires wallet signature authority)
- purchase
- claim
- execute wallet-bound actions
- complete regulated flows that require wallet-bound identity
- act as an admin
- bypass compliance or ownership checks

High-value actions must require:

- a linked wallet
- active SIWS authentication for that wallet when the action is executed
- any additional compliance state required by the feature

Wallet unlinking is not a generic profile action. If a wallet is the only linked wallet protecting active financial assets, ownership records, or regulated account state, BRIDS must block unlinking until a safe replacement or account-resolution flow exists.

## Admin Identity Policy

Administrative identity is an explicit exception to the general user onboarding model.

For standard users, BRIDS may support:

- federated login first
- wallet linking later

For administrators, BRIDS must require:

- wallet first
- SIWS authentication first
- admin eligibility derived from a wallet already recognized by the BRIDS admin authority model

That means an admin account must not be created or elevated from federated login alone.

### Admin bootstrap rule

An admin account must begin from a valid admin wallet already present in the system.

Required sequence:

1. authenticate with the admin wallet through SIWS
2. resolve admin access from the wallet-based authority rule
3. only then allow the user to link a federated identity from profile or settings

### Admin federated linking rule

Federated login for admins is a convenience layer, not a source of privilege.

The federated identity may be linked only after the admin has already authenticated through the wallet path. The linked federated identity must resolve back to the same BRIDS account and must not independently grant admin authority.

### Admin authorization rule

Even after a federated identity is linked:

- admin role must continue to derive from wallet-based authority
- sensitive admin actions should require wallet step-up authentication
- linking or unlinking a federated identity for an admin account should be treated as a security-sensitive mutation

### Admin rationale

This preserves the strongest trust anchor for privileged access and avoids accidental elevation through email-based identity alone.

## Provider Direction

Primary direction for this feature:

- Federated auth provider: `WorkOS AuthKit`
- Wallet auth provider: existing `SIWS + Phantom`
- Account source of truth: BRIDS database

Rationale:

- WorkOS reduces the amount of custom federated auth infrastructure we would otherwise rebuild.
- BRIDS keeps control of account state, linking rules, and authorization gates.
- SIWS remains the source of wallet ownership proof instead of being replaced by email-based identity.

## Current-State Constraints

The current implementation is wallet-first and centered on SIWS:

- nonce issuance and verification are tied to SIWS cookies
- the active authenticated principal is a wallet public key
- RBAC is wallet-derived
- parts of profile, compliance, and protected routing assume wallet presence

This means the feature is not a UI-only change. It changes identity boundaries, session semantics, and authorization assumptions across app and server code.

## Expected Workstreams

### Workstream A: Identity and session implementation

- implement the internal account model as defined
- implement federated session semantics
- enforce how SIWS and federated sessions coexist
- enforce step-up wallet authentication for sensitive operations

### Workstream B: Linking and migration execution

- implement wallet linking for an existing federated account
- execute migration mapping for existing wallet-first users into the new account model
- enforce duplicate prevention and conflict rejection rules
- implement SIWS proof binding to the active WorkOS session during linking
- implement unlink blocking for financially active accounts
- implement provisional referral intent preservation for federated-first onboarding
- implement one-time promotion from provisional referral intent to final wallet-bound attribution

### Workstream C: Authorization boundaries

- apply low-authority vs high-authority classifications to the codebase
- update route, API, and service guards accordingly
- preserve admin and compliance safety boundaries
- enforce the admin-specific wallet-first exception and step-up rules

### Workstream D: QA and documentation

- update auth/session canonical docs
- keep this feature note as the source of truth for the design decisions of the feature
- verify browser flows for both entry paths and the wallet-linking path

## Proposed Slice Plan

### s01 - plan artifact

- create parent issue and branch strategy
- create initial feature note under `knowledge/features`
- capture the problem, constraints, closed identity model, and implementation gates

### s02 - WorkOS tooling and CLI setup

- use the WorkOS AuthKit CLI installer (`npx workos-authkit@latest` or equivalent) to scaffold required environment variables and base provider components
- ensure the generated tooling aligns with the existing Next.js App Router architecture
- validate local development environment connectivity with the WorkOS dashboard securely

### s03 - DB schema and migration plan

- refine schema additions for internal accounts and linked identities from the closed feature-note decisions
- define migration and backfill strategy from wallet-first records
- define uniqueness and conflict rules
- enforce the global uniqueness of `wallet_public_key` at the data-model level so the same wallet cannot belong to two BRIDS accounts
- implement repository primitives for:
  - wallet-first account creation
  - federated-first account creation
  - wallet linking conflict rejection
  - federated identity linking conflict rejection

### s04 - WorkOS auth foundation

- integrate WorkOS AuthKit for federated login
- create the low-authority account session path
- ensure BRIDS persists the local account record as source of truth

### s05 - wallet linking flow

- add wallet linking for a federated account
- require real SIWS verification during linking
- ensure a linked wallet resolves to the same BRIDS account
- ensure CSRF and session-fixation protection by binding the SIWS nonce and resulting link operation to the active WorkOS session
- block unlinking when the wallet is the only linked wallet protecting active financial assets, ownership state, or other financially material account state
- reject any link attempt when the wallet is already bound to a different BRIDS account, even if the competing request comes from a different federated email
- establish a single-use, 5-minute wallet-link context that is invalidated on success, failure, logout, or account-context mismatch

### s06 - authorization guardrails

- enforce wallet-required rules for sensitive actions
- update route and service guards
- validate low-authority vs high-authority account capabilities
- enforce the admin wallet-first policy and federated-linking restriction
- fail closed when WorkOS and SIWS sessions resolve to different BRIDS accounts

### s07 - tests, docs, and QA

- update canonical auth and session docs
- add unit, integration, Playwright, and Synpress coverage
- collect browser evidence for critical flows
- add conflict tests proving that two different federated accounts cannot authenticate or link the same wallet

### s10 - referral intent model and invariants

- define the provisional `referral_intent` model attached to the BRIDS account
- define the one-active-intent-per-account invariant
- define the promotion boundary from `referral_intent` to final wallet-bound `referral_attribution`
- define conflict precedence where wallet-bound truth wins over provisional account state

### s11 - federated referral-intent persistence

- persist a provisional referral intent when a federated-first user arrives through a referral path or enters a referral code before wallet linking
- keep the referral intent non-financial and non-reward-bearing
- prevent duplicate concurrent provisional intents for the same BRIDS account
- define whether a pre-wallet user may update the provisional code before final wallet binding

### s12 - referral-intent promotion on wallet link

- promote a valid active referral intent at wallet linking or first wallet authentication
- consume the provisional intent atomically on successful promotion
- reject or safely close the intent when the wallet already has conflicting final referral state
- re-run validity and self-referral checks at final promotion time

### s13 - referral conflict and abuse coverage

- add tests for:
  - federated-first referral intent surviving the email login step
  - single promotion from provisional intent to final attribution
  - no duplicate attribution when wallet-bound referral state already exists

### Follow-up fix - federated post-auth decision UX

- federated login must not dump the user directly into `/protected` without context
- the federated sign-in CTA should return to the originating page with a one-time post-auth decision flag
- after successful federated login and before wallet linking, BRIDS should open the existing explore-vs-profile modal automatically
- that decision modal must use account-safe copy when no wallet is connected yet

### Follow-up fix - profile/support access for account-only sessions

- `/protected/perfil` must not redirect a federated-only account back to `/`
- the route should allow an account-only session to enter and understand the next step
- KYC remains wallet-gated, so the page must ask the user to connect a wallet there before enabling the regulated verification flow
  - self-referral rejection at promotion time
  - account-context mismatch failing closed during promotion
  - repeated promotion attempts or referral-code swapping being rejected or safely neutralized

## QA Notes

- `npm run validate`
- `npm run e2e:playwright`
- `npm run e2e:synpress:user`
- Playwright smoke finished `10 passed`
- Synpress user finished `1 passed`

## Critique (Staff Engineer Review)

- **Verdict**: `approve with strict changes`
- **Critical Findings & Hard Requirements**:
  1. **Federated Session is a "Ghost" State**: I am rejecting the ability for a federated-only user to "edit basic profile fields". Without a cryptographically backed wallet signature (SIWS), a user session must not have the authority to mutate identity states, name, or emails in our system. The federated login must act **solely** as an initial linking mechanism and a read-only dashboard entry point. Any mutation requires an active SIWS step-up.
  2. **Mandatory CLI Tooling**: Manually wiring federated auth in Next.js App Router often leads to leaky middleware and insecure cookie handling. I've added a mandatory tooling slice (`s02`) to enforce the use of `npx workos-authkit@latest`. The team must follow the official installer guide to generate the secure base components before implementing the custom foundation.
  3. **Session Cookie Isolation**: The identity-model decision in this feature note successfully defines that the `workos_session` cookie and the `siws_session` cookie do not mix. If a WorkOS session exists without a SIWS session, the backend APIs must treat the request as `Role: Unverified/Guest`. 
  4. **Orphaned Account Resolution**: If Alice logs in via WorkOS today, leaves, and tomorrow logs in directly via SIWS with a new wallet, we now have two disconnected accounts. This feature note strictly defines the merge/conflict strategy for this scenario (hard rejection and explicit server-controlled consolidation), closing the door on silent takeovers.
  5. **Admin Exception Must Stay Wallet-First**: Administrative accounts are excluded from federated-first bootstrap. A valid admin wallet must exist and authenticate through SIWS before federated linking is offered, and federated identity must never become the source of admin privilege.
  6. **Account Takeover Resistance in Linking**: I have ensured slice `s05` mandates that the SIWS nonce generated for the linking step MUST be cryptographically bound to the active WorkOS session, and the resulting link operation must fail closed if the session context changes. This prevents an attacker from initiating a linking flow and tricking a victim into signing a payload that links the victim's wallet to the attacker's account.
  7. **Financial Unlink Protection**: I have ensured the implementation mandates blocking users from orphaning invested or otherwise financially active accounts by removing their only linked wallet without a safe replacement path.

## Implementation Gates

Implementation must not start until:

- the identity model captured in this feature note is accepted as closed
- the linking rules are documented
- authorization boundaries are listed and reviewed
- session strategy is agreed
- migration risks are understood
- the feature note defines how wallet linking is bound to the active WorkOS session
- the feature note defines unlink blocking rules for financially active accounts

Because this feature affects trust boundaries and session semantics, downstream implementation slices must execute the identity model already closed in this feature note rather than redefining it later.

## Risks To Address

- account duplication between federated users and wallet-first users
- accidental elevation of federated-only accounts
- broken assumptions in compliance and wallet-bound flows
- account takeover during wallet linking if the SIWS proof is not bound to the active WorkOS session
- financially active accounts becoming orphaned by unsafe wallet unlinking
- ambiguous session state when both federated and wallet identities exist
- RBAC drift if authorization continues to assume wallet-only identity
- accidental admin elevation if federated identity is treated as equivalent to wallet authority
- referral intent loss between federated login and later wallet linking
- duplicate referral attribution if provisional account state and wallet-bound state are both materialized
- referral-code swapping or self-referral attempts before final wallet binding

## Out of Scope For This Slice

- WorkOS implementation
- DB migrations
- final database schema design
- route or API changes
- SIWS flow changes
- UI implementation work
- provider rollout or deployment changes

Detailed persistence design, identity-link record shape, and low-level unlink-state enforcement belong to the later design and implementation slices, not to the planning portions of this feature note.

## Acceptance For This Slice

- parent Linear issue exists and captures the initiative
- integration branch exists from `develop`
- planning slice exists from the integration branch
- a feature note under `knowledge/features` captures the plan and guardrails
- the repository now has a stable planning artifact that future slices can update incrementally
