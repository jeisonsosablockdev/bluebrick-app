# S23 Plan: Marketplace Server Boundary Refactor

## Scope
- Priority: P2.
- Planned branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s23-server-boundaries`.
- Runtime scope when implemented:
  - `lib/property-marketplace-server.ts`
  - new focused server modules under `lib/marketplace/` or another approved local convention
  - existing tests in `tests/lib/property-marketplace-server.test.ts`

## Problem
`lib/property-marketplace-server.ts` is a 646-line module that owns several responsibilities:
- persisted row types
- DB read SQL
- DB write SQL
- row-to-domain mapping
- create-input mapping
- snapshot fallback
- marketplace filtering
- city list projection
- map pin source projection
- Solana realtime sync status
- best-effort persistence of sync metadata

Why this matters:
- A developer changing one concern must understand unrelated concerns.
- Tests must import one broad module even when only one behavior is under change.
- Future marketplace changes are more likely to cause shotgun surgery or accidental coupling.

## Solution
Split the server module by responsibility while keeping the public API stable.

Suggested target modules:
- `lib/marketplace/property-row-mapper.ts`
  - persisted row types
  - row-to-`PropertyDetail` mapping
  - create-input-to-detail mapping
- `lib/marketplace/property-repository.ts`
  - persisted marketplace read/write SQL
  - location-column support integration
- `lib/marketplace/property-selectors.ts`
  - filters
  - list item projection
  - city options
  - map pin source projection
- `lib/marketplace/property-sync-status.ts`
  - Solana realtime sync status
  - best-effort sync metadata persistence
- `lib/property-marketplace-server.ts`
  - compatibility facade that exports the current public functions.

## TDD Plan
1. Add or preserve tests around current public functions before extraction.
2. Extract one responsibility at a time with no behavior changes.
3. Keep `lib/property-marketplace-server.ts` as a facade until imports can be migrated safely.
4. Run targeted server tests after every extraction.
5. Run `npm run validate` before merge.

## Acceptance Criteria
- Existing exported functions keep the same names and behavior.
- No UI or API route behavior changes in this refactor slice.
- Each new module has one clear responsibility.
- `lib/property-marketplace-server.ts` becomes a thin facade rather than the implementation owner.
- Tests prove persisted entries, snapshot fallback, map source projection, and detail retrieval still work.
