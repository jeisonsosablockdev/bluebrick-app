# S25 Plan: Map Data Quality and Web Vitals Boundary

## Scope
- Priority: P2.
- Planned branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s25-map-quality-web-vitals`.
- Runtime scope when implemented:
  - `lib/marketplace-map-pins.ts`
  - `lib/property-marketplace-server.ts` or the S23 selector module if already extracted
  - `components/marketplace/MarketplaceExperience.tsx`
  - `components/marketplace/MarketplaceMapClient.tsx`
  - related marketplace map tests

## Problem A: Coordinate Projection
The public map pin projection validates that coordinates are finite, but it does not enforce latitude and longitude ranges at the map projection layer.

Why this matters:
- Admin validation already enforces `geoLat` between `-90` and `90` and `geoLng` between `-180` and `180`, but public projection should still be defensive.
- Legacy/manual DB rows could bypass admin validation.
- A bad coordinate can create an incorrect pin or camera center.

## Solution A: Defensive Coordinate Ranges
Add range-specific validators at the pin projection boundary:
- `isValidLatitude(value): boolean`
- `isValidLongitude(value): boolean`
- filter out invalid pins before camera calculations.

Required tests:
- out-of-range latitude is excluded
- out-of-range longitude is excluded
- string numeric values still work if the public source type continues to allow them
- valid US coordinates still project unchanged

## Problem B: Web Vitals Boundary
S15 recorded mobile lab LCP `8.0s`, mobile TBT `870ms`, desktop TBT `830ms`, and early Mapbox resource loading in the default map-first experience.

Why this matters:
- The map creates the desired premium first impression, but the user should not pay the full Mapbox cost before the route becomes interactive.
- The list is the conversion anchor and should stay immediately usable.
- Deferred camera motion helps animation cost, but it does not fully solve initial Mapbox loading cost.

## Solution B: Measured Lazy Boundary
Add a measured performance boundary without changing the product contract.

Allowed options:
- Lazy hydrate the Mapbox island after the list and shell are usable.
- Delay map client import on mobile while preserving the default map-top layout once ready.
- Use an interaction or idle boundary only if it does not make the premium map feel broken.
- Keep list-only fallback when token/style/pin data is unavailable.

Not allowed:
- Remove the default map-top product direction without explicit approval.
- Hide the traditional list while waiting for Mapbox.
- Introduce a loading behavior that breaks reduced-motion users.

## TDD And Evidence Plan
1. Add unit tests for coordinate range filtering.
2. Add component tests proving list content renders before the map client boundary is ready.
3. Add tests proving missing token and no valid pins still fall back to list-only.
4. Capture browser evidence for first render behavior.
5. Re-run Lighthouse locally and compare against S15 baseline.
6. Run `npm run validate`.

## Acceptance Criteria
- Bad coordinates cannot reach Mapbox markers or camera calculations.
- The list remains immediately usable.
- The map remains the default premium state when it is ready and configured.
- Mobile Lighthouse trend improves or the remaining limitation is explicitly documented with evidence.
- `npm run validate` passes.
