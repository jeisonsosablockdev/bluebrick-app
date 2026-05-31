# S27 Plan: Marketplace Read Repository Extraction

## Scope
- Priority: P2.
- Planned branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s27-read-repository-extraction`.
- Runtime scope when implemented: marketplace persisted read SQL.
- Tests: `tests/lib/property-marketplace-server.test.ts` or a new focused repository test.

## Problem
Marketplace persisted read SQL is coupled to mapping, selectors, writes, and sync logic in one server module.

## Solution
Extract persisted read SQL and location-column support into a focused read repository module.

## TDD Contract
1. Add or preserve tests for persisted read success and fallback behavior.
2. Extract read SQL only.
3. Assert list/detail/map source callers still receive the same data.

## Out Of Scope
- Write SQL extraction.
- Row mapper changes beyond importing the S26 mapper.
- Logging changes unless already completed in S25.

## Acceptance Criteria
- Read repository owns read SQL.
- Existing public functions remain stable.
- No behavior changes beyond prior approved observability slices.
