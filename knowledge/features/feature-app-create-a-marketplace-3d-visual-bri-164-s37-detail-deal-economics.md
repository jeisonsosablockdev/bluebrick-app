# S37 Plan: Detail Deal Economics Extraction

## Scope
- Priority: P2.
- Planned branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s37-detail-deal-economics`.
- Runtime scope when implemented: deal economics card.
- Tests: focused deal economics component coverage.

## Problem
Deal economics conditional metric rendering is mixed into the broad detail component.

## Solution
Extract a `PropertyDealEconomicsCard` component.

## TDD Contract
1. Add failing tests for visible positive metrics.
2. Add failing tests proving empty/non-positive metrics remain hidden.
3. Extract only the deal economics card.

## Out Of Scope
- Fees and projected return card.
- Execution/governance cards.
- Formatting changes unless S32 is already complete.

## Acceptance Criteria
- Deal economics rendering is isolated.
- Conditional metric behavior is unchanged.
- No other card moves in this slice.
