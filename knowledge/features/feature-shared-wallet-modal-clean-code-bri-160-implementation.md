---
type: Feature Spec
title: Feature Shared Wallet Modal Clean Code BRI- 160 Implementation
description: Feature Shared Wallet Modal Clean Code BRI- 160 Implementation - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-shared-wallet-modal-clean-code-bri-160-implementation.md
---

# implementation(shared): WalletModal clean-code refactor

## Status
- Solution artifact
- Depends on:
  - `docs/features/feature-shared-wallet-modal-clean-code-bri-160.md`
  - `docs/features/feature-shared-hybrid-auth-clean-code-bri-159.md`
  - `docs/features/feature-shared-hybrid-auth-clean-code-bri-159-implementation.md`

## Goal
Restructure `components/WalletModal.tsx` into smaller, more maintainable units and simplify the auth-entry UI so `Mail` and `Wallet` directly start their flows.

## Decision Summary

### 1. Targeted UI simplification is allowed
- Remove the extra `Conectar e iniciar sesion` action in the unauthenticated wallet entry view.
- The `Mail` and `Wallet` controls become direct action triggers, not only a selector state.
- No auth trust-boundary or backend contract changes are allowed.
- No redirect or session-payload changes.
- No broader visual redesign beyond this simplification.

### 2. Prefer extraction over rewrite
- Keep the working logic intact where possible.
- Extract focused render units and helpers instead of rewriting the auth flow wholesale.

### 3. Clean-code gate is explicit
- The implementation must close with an explicit `clean-code` review, not only a generic reviewer summary.

## Slice Plan

### S01 - documentation slice
- create artifact pair
- define scope, non-goals, and test-plan-first contract

### S02 - WalletModal decomposition
- extract the most cohesive UI/action sections from `WalletModal`
- reduce mixed abstraction levels in the main component
- implement direct-action auth entry for `Mail` and `Wallet`
- preserve downstream auth/linking semantics and route contracts

### S03 - QA and reviewer closeout
- run targeted UI/auth verification
- complete explicit clean-code audit findings

## Test-Plan-First Contract

Minimum expected checks:
- affected Vitest coverage for modal/auth-entry behavior
- `npm run typecheck`
- `npm run validate`

Additional checks if the refactor changes browser-critical behavior:
- Playwright evidence for the auth modal surface

## Risks
- Extracting too aggressively could change subtle auth-state timing or visibility logic.
- UI cleanup can accidentally drift referral capture or button-state behavior if layout and orchestration are refactored together.

## Completion Gate
- `WalletModal` is materially smaller or clearly decomposed into narrower responsibilities.
- New boundaries are intention-revealing and preserve behavior.
- The unauthenticated modal starts auth directly from `Mail` and `Wallet` without the extra wallet CTA.
- Explicit clean-code pass is recorded with no unresolved blocking findings.
- Required validation passes.
