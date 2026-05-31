# S28 Plan: Marketplace Write Repository Extraction

## Scope
- Priority: P2.
- Planned branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s28-write-repository-extraction`.
- Runtime scope when implemented: marketplace persisted create SQL.
- Tests: `tests/lib/property-marketplace-server.test.ts` and `tests/api/admin-marketplace-entries-route.test.ts` if needed.

## Problem
Marketplace create SQL is coupled to reads, mapping, selectors, and sync logic.

## Solution
Extract create/write SQL into a focused write repository module while preserving duplicate-entry behavior.

## TDD Contract
1. Add or preserve tests for successful create.
2. Add or preserve tests for duplicate id conflict.
3. Extract write SQL only.
4. Assert admin route behavior remains unchanged.

## Out Of Scope
- Read repository changes.
- Admin safe-error response changes from S22.
- Selector extraction.

## Acceptance Criteria
- Write repository owns create SQL.
- Duplicate entry error mapping remains stable.
- No UI behavior changes.
