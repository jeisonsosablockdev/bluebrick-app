# Implementation Plan: Marketplace 3D Visual (BRI-164)

## Status
- Solution artifact
- Depends on: `docs/features/feature-app-create-a-marketplace-3d-visual-bri-164.md`
- Mother/integration branch: `feature/app-create-a-marketplace-3d-visual-bri-164-integration`
- Current slice: `feature/app-create-a-marketplace-3d-visual-bri-164-s05-fallback-polish`

## Goal
Implement a single `/marketplace` experience that can cycle through four visual states while keeping the traditional list as the safe fallback and the detail page untouched.

The result should feel premium and discovery-driven, but still conversion-friendly and resilient when the map cannot load.

## Decision Summary
1. Keep `/marketplace` as the only page that hosts the map experience.
2. Leave the property detail page unchanged.
3. Use one button to cycle through the agreed view states.
4. Make the default experience map-first with the list still present when the map can initialize.
5. Fall back to list-only when Mapbox configuration is missing or the map fails.
6. Limit the map to USA.
7. Show only the property name and `% sold` on each pin.
8. Zoom the map toward a property when the pin is hovered.
9. Make the page feel like the user is discovering the property location, not just browsing a dataset.

## TDD Execution Model
- Every slice begins with failing tests for the behavior that slice owns.
- Implementation starts only after the slice's tests exist and fail for the new expectation.
- Each slice ends with the smallest possible green implementation and a short cleanup pass.
- The final audit slice uses the `code-refactoring-refactor-clean` skill to inspect the finished diff for smells, coupling, duplication, and naming issues.
- Behavior changes are not allowed in the final audit slice unless the user explicitly approves them.

## Technical Architecture
The implementation should use `Mapbox GL JS v3` as the rendering engine and `React Map GL` as the React integration layer.

Why this split:
- `Mapbox GL JS v3` gives us WebGL-backed rendering, which is what makes smooth pan/zoom/tilt and a premium 3D surface practical.
- The marketplace map is expected to stay responsive even as the inventory grows, so the GPU-backed path is the right fit for the long term.
- `React Map GL` keeps the map controllable from the existing React state model, which matters because this screen is state-driven and must cycle through multiple layout modes.
- The React layer keeps the map isolated from the rest of the marketplace page instead of forcing the whole route to become a large imperative canvas.

Implementation consequences:
- Keep the map inside a client island; do not make the full marketplace page client-only.
- Use the React layer to coordinate map readiness, hover focus, and state changes.
- Keep the list visible and functional even if the map engine is missing, slow, or temporarily unavailable.
- Read the Mapbox access token from a client-exposed env var and treat absence of configuration as a first-class fallback case.
- Reuse the canonical location payload already captured at item creation time, including `google_maps_place_json` and persisted coordinates (`geoLat`, `geoLng`), instead of creating a second location source.
- Project that canonical location payload into the public marketplace map model so the map can render real property pins without a separate geocoding flow in the marketplace route.
- Leave items without canonical US map coordinates in the list-only path instead of forcing approximate pins.

## Pin Rendering Strategy
Pins should be Mapbox markers, not Motion objects.

- Use `Marker` from `react-map-gl/mapbox` so Mapbox owns the geographic placement and the marker stays attached to the map camera correctly.
- Use Motion only for the visual shell inside the marker, such as a subtle scale-in, hover lift, glow, or floating accent.
- Keep the pin content compact: property name and `% sold`.
- Drive the hover event through the marker interaction, then let the map camera handle the zoom toward the hovered property.
- If pin density becomes large enough that DOM markers start to feel heavy, migrate the dense rendering path to a Mapbox layer and keep Motion only for the selected/highlighted pin or overlay.

## State Model
The marketplace page should behave like a small view-mode state machine.

Proposed cycle:
- `combined-map-top`: map on top, list below
- `list-only`
- `map-only`
- `combined-list-top`: list on top, map below

Fallback behavior:
- if the map cannot initialize, the state machine should collapse to `list-only`
- the page must not block the list while waiting for map readiness
- once the map is ready, it should render into the active map-capable state without breaking the page

## Slice Plan

### S01 - documentation slice
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s01-documentation`
- Outcome: govern the problem, the UX contract, the fallback behavior, and the implementation slice boundaries.

### S02 - tooling and map foundation
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s02-tooling`
- Scope:
  - TDD first: add failing tests for the Mapbox token helper, controlled map wrapper, and canonical location projection
  - install and wire `mapbox-gl` v3 plus `react-map-gl`
  - add the public Mapbox token env contract and client-safe fallback helper
  - establish the client-only map wrapper and CSS entrypoint
  - project the canonical item location payload into the public map model
  - add tests for missing-token fallback, controlled map setup, and location projection

### S03 - marketplace view state foundation
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s03-state-foundation`
- Scope:
  - TDD first: add failing tests for the state machine and cycle button behavior
  - create the marketplace view-mode state machine
  - wire the single cycle button
  - define the four screen states
  - keep the detail page unchanged
  - add tests for state transitions

### S04 - map surface and pin rendering
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s04-map-surface`
- Scope:
  - TDD first: add failing tests for the marker rendering contract and hover-driven camera focus
  - add the USA-only Mapbox / React Map GL surface
  - render property pins with name and `% sold`
  - implement hover focus and zoom toward the hovered property
  - keep the list visible as the stable anchor

### S05 - fallback, loading, and polish
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s05-fallback-polish`
- Scope:
  - TDD first: add failing tests for the fallback-to-list behavior and loading state degradation
  - add the missing-token fallback to list-only
  - ensure slow map initialization does not block the list
  - refine loading and empty states
  - tune the premium visual treatment without sacrificing readability

### S06 - tests, browser validation, and docs sync
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s06-validation`
- Scope:
  - TDD first: add or tighten the regression tests that prove the final marketplace states and fallback behavior
  - add and update the relevant unit tests
  - verify the marketplace state cycle in browser testing
  - confirm the detail page remains unchanged
  - sync the final documentation trail if the implementation changes any assumptions

### S07 - clean-code audit and refactor hardening
- Branch: `feature/app-create-a-marketplace-3d-visual-bri-164-s07-clean-code-audit`
- Scope:
  - TDD first: add or tighten regression tests for any hotspot that will be cleaned up
  - run a final `code-refactoring-refactor-clean` audit on the completed diff
  - inspect the map, state, and data-projection layers for smells, duplication, naming issues, and tight coupling
  - apply only small behavior-preserving cleanup refactors
  - resolve or document any clean-code findings before closure
  - re-run the targeted tests and final validation after cleanup

### S08 - marketplace detail Google Maps preview fix
- Branch: `fix/app-marketplace-detail-google-maps-bri-164-s08-detail-map`
- Scope:
  - TDD first: add failing tests for the missing Google Maps iframe on `/marketplace/[id]`
  - keep the detail page as a traditional property detail entry, not a Mapbox 3D state surface
  - expose the canonical Google Maps place payload and/or address-derived embed URL to the detail component
  - render an official Google Maps Embed API iframe when a public embed key exists
  - render a stable outbound Google Maps link when embedding is not configured
  - preserve the `/marketplace` Mapbox list/map behavior unchanged

## Files Most Likely to Change
- `app/marketplace/page.tsx`
- `app/marketplace/loading.tsx`
- `components/marketplace/MarketplaceFilters.tsx`
- `components/marketplace/MarketplaceGridClient.tsx`
- new marketplace map and state-switching components under `components/marketplace/`
- new map foundation helpers under `lib/`
- `lib/property-service.ts`
- `lib/property-marketplace-server.ts`
- `package.json`
- `.env.example`
- `tests/lib/property-marketplace-server.test.ts`
- tests for the page, state machine, and map fallback

## Tooling Required
- Mapbox GL JS v3
- React Map GL
- Motion 12 for the pin and panel feel where appropriate
- Existing Next.js App Router stack
- Vitest for state and component coverage
- Browser-based validation for the marketplace surface

## Test-Plan-First Contract
Before implementation is considered complete:
1. Every slice starts by introducing failing tests for the behavior that slice owns.
2. Add unit tests for the map token helper, location projection, and fallback logic before implementation.
3. Add component tests for the controlled map wrapper, cycle button, and map-ready rendering before implementation.
4. Verify the page still falls back to list-only when map loading fails.
5. Run browser validation for the marketplace surface.
6. Confirm the detail page remains a normal detail entry point.
7. Finish with `npm run validate`.

## Guardrails
- Do not replace the traditional list.
- Do not change the detail page behavior.
- Do not expand the map beyond USA.
- Do not overcomplicate the pins with extra metadata.
- Do not let the map block the page when it is slow or unavailable.
- Do not turn the interaction into a noisy dashboard.
- Do not let reduced-motion and mobile users get a broken experience.

## Completion Gates
- The single-button state cycle works as agreed.
- The fallback to list-only is reliable.
- Hovering a pin zooms into the property.
- The marketplace detail page is unchanged.
- Browser validation confirms the surface feels intentional.
- The final clean-code audit slice has no unresolved blocking findings.
- `npm run validate` passes.

## Linear Sync
- After approval of S02, update `BRI-164` with the tooling contract, the canonical location projection plan, and the confirmed slice boundaries.
- After implementation, sync any final changes to the issue so Linear reflects the implemented behavior and validation status.
