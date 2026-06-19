---
type: Feature Spec
title: Feature App Create A Marketplace 3d Visual BRI- 164 S27 Read Repository Extraction
description: Feature App Create A Marketplace 3d Visual BRI- 164 S27 Read Repository Extraction - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s27-read-repository-extraction.md
---

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

## Implementation Evidence
- Preserved persisted read success, map source, detail, and degraded fallback coverage before extraction.
- Extracted read SQL and location-column support into `lib/marketplace/property-read-repository.ts`.
- Left write SQL in `lib/property-marketplace-server.ts` for S28.
- Targeted test command: `npm run test -- tests/lib/property-marketplace-server.test.ts`.
- Targeted result: `4` tests passed.
