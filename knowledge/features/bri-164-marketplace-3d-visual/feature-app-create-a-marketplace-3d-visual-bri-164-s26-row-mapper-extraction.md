---
type: Feature Spec
title: Feature App Create A Marketplace 3d Visual BRI- 164 S26 Row Mapper Extraction
description: Feature App Create A Marketplace 3d Visual BRI- 164 S26 Row Mapper Extraction - migrated from knowledge/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-app-create-a-marketplace-3d-visual-bri-164-s26-row-mapper-extraction.md
---

# S26 Plan: Marketplace Row Mapper Extraction

## Scope
- Priority: P2.
- Planned branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s26-row-mapper-extraction`.
- Runtime scope when implemented: `lib/property-marketplace-server.ts` plus one new mapper module.
- Tests: `tests/lib/property-marketplace-server.test.ts`.

## Problem
Persisted row types and row-to-domain mapping live inside the broad marketplace server module.

## Solution
Extract persisted row mapping and create-input-to-detail mapping into a focused mapper module. Keep public exports stable through `lib/property-marketplace-server.ts`.

## TDD Contract
1. Add or preserve tests for persisted row mapping outcomes before extraction.
2. Move mapping code only.
3. Assert list/detail behavior remains unchanged.

## Out Of Scope
- SQL read/write extraction.
- Selector extraction.
- Solana sync extraction.

## Acceptance Criteria
- Mapping code is isolated.
- Public marketplace server behavior is unchanged.
- No runtime behavior changes.

## Implementation Evidence
- Preserved the existing server mapping tests before extraction.
- Extracted persisted row mapping and create-input-to-detail mapping into `lib/marketplace/property-row-mapper.ts`.
- Kept SQL and write-path location-label derivation in `lib/property-marketplace-server.ts`.
- Targeted test command: `npm run test -- tests/lib/property-marketplace-server.test.ts`.
- Targeted result: `4` tests passed.
