# S43 Plan: Web Vitals Recheck

## Scope
- Priority: P2.
- Planned branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s43-web-vitals-recheck`.
- Runtime scope when implemented: none unless a measurement script needs a non-runtime fixture.
- Evidence scope: Lighthouse/browser comparison against S15.

## Problem
After S42, the team needs objective evidence that the Mapbox lazy boundary improved or at least did not regress the marketplace route.

## Solution
Run a fresh local production Web Vitals/SEO check and update the feature artifact with the measured delta.

## TDD Contract
1. No runtime TDD is expected unless a test fixture changes.
2. Run the same class of evidence as S15.
3. Compare mobile LCP, mobile TBT, desktop TBT, and SEO score.
4. Document the result and any remaining risk.

## Out Of Scope
- Implementing additional performance fixes.
- UI changes.
- Coordinate validation.

## Acceptance Criteria
- S15 baseline and S43 results are comparable.
- Any remaining performance risk is explicitly documented.
- No runtime changes are mixed into the measurement slice.
