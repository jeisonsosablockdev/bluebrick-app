---
type: Fix Spec
title: Fix HyBRI-d Auth Bidirectional Linking And Safe Account Consolidation
description: Fix HyBRI-d Auth Bidirectional Linking And Safe Account Consolidation - migrated from knowledge/
tags: [fixes]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/fixes/fix-hybrid-auth-bidirectional-linking-and-safe-account-consolidation.md
---

# fix(shared): hybrid auth bidirectional linking and safe account consolidation

## Status

- Planning artifact
- Scope: hybrid auth, account linking, conflict recovery
- Related canonical docs:
  - `knowledge/auth-flow.md`
  - `knowledge/session-model.md`
  - `knowledge/features/feature-shared-hybrid-auth-workos-wallet-bri-154.md`

## Summary

BRIDS currently supports the explicit `mail/account -> wallet` linking path, but it does not offer the symmetric `wallet -> mail/account` path and it does not provide a workable consolidation mechanism when a user has already created two separate BRIDS accounts:

- a federated/account-first account
- and a separate wallet-first account

The current system fails closed when those two session layers point at different `account_id` values. That is correct as a safety default, but it is incomplete as a user-facing recovery model.

This fix introduces an explicit, server-controlled identity consolidation mechanism so the user can intentionally prove control of both sides and recover into one BRIDS account without weakening wallet authority.

Follow-up cleanup note:

- The implementation also opened a dedicated clean-code refactor track in `knowledge/features/feature-shared-hybrid-auth-clean-code-bri-159.md` to reduce repository orchestration size and remove duplicated auth-link status presentation logic without changing the trust model.

## Problem

Today the hybrid auth model has three gaps:

1. There is no first-class `wallet -> mail/account` linking mechanism.
2. If a user creates two separate accounts first and only later tries to combine them, the system has no explicit consolidation path.
3. `sessionConflict` is technically safe but operationally incomplete because the user can end up in a dead-end state instead of a guided recovery flow.

## Why It Matters

This is not only a UX issue. It is also an identity integrity issue.

If BRIDS never offers an explicit recovery flow, users will keep producing split identity states:

- one account holding the wallet-bound truth
- another account holding federated continuity or referral intent

That creates friction, support load, and pressure to introduce dangerous shortcuts later. The fix must solve the real recovery problem now while preserving the strongest trust anchor:

- wallet ownership stays cryptographic
- federated identity stays low-authority
- account consolidation never happens silently or heuristically

## Current Behavior And Gaps

### Case A: mail/account first, wallet later

This is the only path that is mostly implemented today.

- User signs in with WorkOS.
- BRIDS creates or resumes a low-authority `account_id`.
- User later signs SIWS through the guarded wallet-link route.
- If the wallet is not already linked elsewhere, the wallet is attached to the current account.

Gap:

- If that wallet already belongs to another wallet-first account, the flow stops with conflict instead of entering an explicit consolidation path.

### Case B: wallet first, mail/account later

This path is missing today.

- User can authenticate with SIWS and get a wallet-first BRIDS account.
- There is no symmetric server-controlled path to link a WorkOS identity back onto that wallet-backed account.

Gap:

- The user cannot intentionally attach a federated identity to the wallet-backed account through a dedicated flow.

### Case C: split accounts already exist

This is the high-value recovery case.

Example:

- Day 1: user signs in with WorkOS and creates federated account `A`
- Day 2: user signs in directly with SIWS and creates wallet-first account `B`
- Day 3: user tries `mail -> wallet` or `wallet -> mail`

Current behavior:

- BRIDS detects that WorkOS and SIWS resolve to different accounts
- request composition fails closed with `sessionConflict`
- there is no guided consolidation path

Gap:

- The user may fully control both identities and still cannot recover into one account.

## Expected Outcome

After this fix:

1. BRIDS supports an explicit `wallet -> mail/account` linking mechanism.
2. BRIDS supports an explicit `mail/account -> wallet` consolidation path when the wallet is already linked to another BRIDS account.
3. BRIDS may automatically consolidate only when all of the following are true:
   - the user has explicitly entered a consolidation flow
   - the user proves control of both identities in that same flow
   - the account being absorbed is federated-only and low-risk
   - no admin, financially active, compliance-sensitive, or other privileged state requires manual review
4. BRIDS never silently merges accounts based on email similarity, browser state, or heuristic matching.
5. When automatic consolidation is not safe, BRIDS fails closed into a dedicated review-required path instead of leaving the user in an unexplained conflict state.

## Closed Decisions For This Fix

### 1. Winning account

The wallet-backed account is the winning account whenever a safe automatic consolidation is allowed.

Reason:

- wallet-bound truth is already the stronger authority model in BRIDS
- profile, KYC, referrals, checkout, and admin privileges are wallet-derived or wallet-bound

### 2. What can be absorbed automatically

Only a federated-only account may be absorbed automatically into a wallet-backed account.

That means the absorbed account must not have:

- any linked wallet identity
- admin-capable wallet state
- financially active or compliance-sensitive material requiring manual review

### 3. What must never be moved automatically

BRIDS must never automatically reassign a wallet from one account to another.

If a wallet already belongs to account `B`, then safe automatic consolidation means:

- absorb federated-only account `A` into wallet-backed account `B`
- never transfer the wallet from `B` into `A`

### 4. Required proof

Any consolidation flow must prove control of both sides in one bounded operation:

- federated side: active WorkOS account session
- wallet side: fresh SIWS proof bound to the current operation context

### 5. Review-required boundary

Automatic consolidation is blocked when any of the following is true:

- either side is admin-capable
- the absorbed side is not federated-only
- the absorbed side has state the fix cannot safely migrate deterministically
- the operation context is stale, mismatched, or replayed

## Non-Goals

This fix does not introduce:

- heuristic auto-merge by matching emails
- automatic wallet reassignment between accounts
- federated-only authorization for wallet-bound actions
- generic multi-email account management

## Open Questions

These questions should be resolved in the implementation artifact before code opens:

1. Which low-risk account-bound rows are migrated automatically today?
2. Which exact conflict outcomes redirect to manual review vs. inline retry?
3. Whether admin wallet accounts should always require manual review for federated consolidation, even when the losing side is federated-only.
