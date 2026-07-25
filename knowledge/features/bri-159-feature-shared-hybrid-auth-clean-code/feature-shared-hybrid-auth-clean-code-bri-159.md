---
type: Feature Spec
title: Feature Shared HyBRI-d Auth Clean Code BRI- 159
description: Feature Shared HyBRI-d Auth Clean Code BRI- 159 - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/bri-159-feature-shared-hybrid-auth-clean-code/feature-shared-hybrid-auth-clean-code-bri-159.md
---

# feature(shared): clean-code refactor for hybrid auth account consolidation flows (BRI-159)

## Status

- Documentation slice
- Parent issue: `BRI-159`
- Integration branch baseline: `fix/shared-hybrid-auth-bidirectional-linking-and-safe-account-consolidation-bri-159-integration`
- Current slice: `refactor/shared-hybrid-auth-clean-code-bri-159-s03-documentation-slice`

## Summary

This follow-up slice cleans up the hybrid auth consolidation work without changing product behavior, security policy, or redirect outcomes.

The refactor focuses on two hotspots introduced or expanded by the bidirectional linking fix:

- repository-level account consolidation orchestration in `lib/accounts/repository.ts`
- duplicated auth-link status presentation logic in the wallet modal and protected profile banner

## Why

The shipping fix solved the account-recovery problem, but it left debt in the implementation shape:

- `mergeFederatedOnlyAccountIntoWalletAccount` owns too many responsibilities inside one function
- auth-link status strings and branching logic are duplicated across multiple UI surfaces

If that shape remains, future auth changes become harder to review, harder to test in isolation, and easier to regress.

## Scope

### 1. Repository merge cleanup

- Split validation, low-risk state checks, referral-intent handling, federated-identity reassignment, and final account deletion into focused helpers.
- Preserve the same transaction boundaries and error codes.

### 2. Shared auth-link status presentation

- Extract a single canonical status catalog for copy and variant selection.
- Keep `components/WalletModal.tsx` and `components/dashboard/auth-link-status-banner.tsx` as thin consumers.

## Non-Goals

- No change to automatic consolidation eligibility.
- No change to `wallet -> mail` or `mail -> wallet` redirect contracts.
- No redesign of wallet modal structure beyond targeted duplication cleanup.

## Validation

- `npx vitest run tests/lib/account-repository.test.ts`
- `npx vitest run tests/app/protected-perfil-page.test.ts`
- `npm run validate`

## Notes

- This refactor intentionally starts from the `BRI-159` integration baseline because it is cleanup work on the same hybrid-auth initiative.
