---
type: Feature Spec
title: Feature Shared HyBRI-d Auth Clean Code BRI- 159 Implementation
description: Feature Shared HyBRI-d Auth Clean Code BRI- 159 Implementation - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/feature-shared-hybrid-auth-clean-code-bri-159-implementation.md
---

# implementation(shared): clean-code refactor for hybrid auth account consolidation flows

## Status

- Solution artifact
- Depends on:
  - `knowledge/features/feature-shared-hybrid-auth-clean-code-bri-159.md`
  - `knowledge/fixes/fix-hybrid-auth-bidirectional-linking-and-safe-account-consolidation.md`
  - `knowledge/fixes/fix-hybrid-auth-bidirectional-linking-and-safe-account-consolidation-implementation.md`

## Goal

Improve readability and maintainability of the recently added hybrid auth consolidation code without changing external behavior.

## Decision Summary

### 1. Refactor boundaries stay behavior-preserving

This slice may improve decomposition, naming, and duplication, but it must not:

- alter account eligibility rules
- change error codes
- change redirect status semantics
- weaken replay or trust-boundary protections

### 2. Repository cleanup remains transaction-first

The merge flow in `lib/accounts/repository.ts` will keep one transaction owner and move internal steps into named helpers that operate on the active DB client.

### 3. UI cleanup uses one status catalog

Auth-link status strings and tone selection will come from one shared helper so the wallet modal and protected-profile banner do not drift independently.

## Slice Plan

### S03 - documentation slice

- add the refactor artifact pair
- link the cleanup track from the original hybrid auth fix docs

### S04 - repository and UI cleanup

- extract repository helper functions from `mergeFederatedOnlyAccountIntoWalletAccount`
- extract shared auth-link status metadata used by both UI surfaces
- update targeted tests if shape changes require it

## Test-Plan-First Contract

Run at minimum:

- `npx vitest run tests/lib/account-repository.test.ts`
- `npx vitest run tests/app/protected-perfil-page.test.ts`

Run before closing:

- `npm run validate`

## Risks

- Refactoring a transaction-heavy merge path can accidentally change error timing or rollback behavior.
- Shared UI status extraction can introduce copy regressions if one surface depended on a special-case branch.

## Completion Gate

- Repository merge path is split into smaller intention-revealing helpers.
- Auth-link status presentation uses one canonical source.
- Targeted tests pass.
- Full `npm run validate` passes or any unrelated blocker is clearly documented.
