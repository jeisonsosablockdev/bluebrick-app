# implementation(shared): WalletModal clean-code refactor

## Status
- Solution artifact
- Depends on:
  - `docs/features/feature-shared-wallet-modal-clean-code-bri-160.md`
  - `docs/features/feature-shared-hybrid-auth-clean-code-bri-159.md`
  - `docs/features/feature-shared-hybrid-auth-clean-code-bri-159-implementation.md`

## Goal
Restructure `components/WalletModal.tsx` into smaller, more maintainable units while preserving all existing auth behavior.

## Decision Summary

### 1. Behavior-preserving refactor only
- No auth-flow contract changes.
- No redirect or session-payload changes.
- No visual redesign unless the change is incidental to decomposition and keeps the current UI contract.

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
- keep public behavior and copy intact

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
- UI cleanup can accidentally drift the modal contract if layout and orchestration are refactored together.

## Completion Gate
- `WalletModal` is materially smaller or clearly decomposed into narrower responsibilities.
- New boundaries are intention-revealing and preserve behavior.
- Explicit clean-code pass is recorded with no unresolved blocking findings.
- Required validation passes.
