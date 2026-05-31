# S23 Plan: Marketplace Read Result Contract

## Scope
- Priority: P2.
- Planned branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s23-read-result-contract`.
- Runtime scope when implemented: `lib/property-marketplace-server.ts`.
- Tests: `tests/lib/property-marketplace-server.test.ts`.

## Problem
Marketplace persisted-read failures can currently collapse into a normal empty array path. The server layer needs a typed way to distinguish successful reads from degraded reads before the page can display or log that state.

## Solution
Introduce a minimal internal read result contract that can represent:
- successful persisted read
- successful snapshot fallback
- degraded persisted read with fallback
- empty configured source

The public list/detail functions should keep their current return shape unless this slice explicitly introduces a backward-compatible metadata helper.

## TDD Contract
1. Add a failing server test that simulates persisted read failure.
2. Assert the new internal/helper contract returns degraded metadata.
3. Assert existing `listMarketplaceProperties` behavior remains backward-compatible.
4. Implement only the read result contract.

## Out Of Scope
- Rendering degraded UI on `/marketplace`.
- Structured logging.
- Refactoring repository modules.

## Acceptance Criteria
- Degraded read state is representable in tests.
- Existing callers are not broken.
- No UI behavior changes.
