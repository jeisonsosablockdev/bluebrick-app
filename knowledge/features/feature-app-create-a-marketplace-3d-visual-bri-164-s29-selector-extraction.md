# S29 Plan: Marketplace Selector Extraction

## Scope
- Priority: P2.
- Planned branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s29-selector-extraction`.
- Runtime scope when implemented: marketplace filters, list projection, city projection, and map source projection.
- Tests: `tests/lib/property-marketplace-server.test.ts` and map source tests.

## Problem
Filtering and projection logic lives in the same module as DB and Solana concerns.

## Solution
Extract pure selectors for:
- filtering marketplace details
- projecting list items
- projecting city options
- projecting map pin sources

## TDD Contract
1. Add direct tests for selector outputs before extraction.
2. Move only pure selector logic.
3. Assert server facade still returns identical list, city, map, and detail results.

## Out Of Scope
- Coordinate range validation from S41.
- Repository changes.
- UI changes.

## Acceptance Criteria
- Selectors are pure and directly testable.
- Public marketplace server exports remain stable.
- No behavior changes.
