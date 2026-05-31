# S36 Plan: Detail Property Information Extraction

## Scope
- Priority: P2.
- Planned branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s36-detail-property-info`.
- Runtime scope when implemented: property information card.
- Tests: focused property information component coverage.

## Problem
Property notes, detailed location, postal code, and highlights are embedded inside the broad detail component.

## Solution
Extract a `PropertyInformationCard` component.

## TDD Contract
1. Add failing tests for detailed location, optional postal code, and highlights.
2. Extract only the property information card.
3. Assert location formatting remains stable.

## Out Of Scope
- Google Maps card.
- Investment summary.
- Economics cards.

## Acceptance Criteria
- Property information card is isolated.
- Optional postal code behavior remains unchanged.
- No other card moves in this slice.
