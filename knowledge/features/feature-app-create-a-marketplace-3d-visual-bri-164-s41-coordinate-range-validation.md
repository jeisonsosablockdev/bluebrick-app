# S41 Plan: Coordinate Range Validation

## Scope
- Priority: P2.
- Planned branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s41-coordinate-range-validation`.
- Runtime scope when implemented: `lib/marketplace-map-pins.ts`.
- Tests: `tests/lib/marketplace-map-pins.test.ts`.

## Problem
The public map pin projection validates finite coordinates but does not enforce latitude and longitude ranges.

## Solution
Add range-specific validation at the public pin projection boundary:
- latitude must be between `-90` and `90`
- longitude must be between `-180` and `180`

## TDD Contract
1. Add failing tests for out-of-range latitude.
2. Add failing tests for out-of-range longitude.
3. Assert valid US coordinates still project unchanged.
4. Implement only range validation.

## Out Of Scope
- Admin location form validation.
- Mapbox lazy loading.
- Camera math changes.

## Acceptance Criteria
- Invalid coordinates cannot become markers.
- Existing valid pins remain unchanged.
- No UI behavior changes except invalid pins being excluded.
