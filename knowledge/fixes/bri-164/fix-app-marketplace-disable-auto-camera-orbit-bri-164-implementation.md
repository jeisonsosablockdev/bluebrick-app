---
type: Fix Spec
title: Fix App Marketplace Disable Auto Camera Orbit BRI- 164 Implementation
description: Fix App Marketplace Disable Auto Camera Orbit BRI- 164 Implementation - migrated from knowledge/
tags: [fixes]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/fixes/bri-164/fix-app-marketplace-disable-auto-camera-orbit-bri-164-implementation.md
---

# Implementation: Disable marketplace automatic camera orbit

## Branch
`fix/app-marketplace-disable-auto-camera-orbit-bri-164`

## Runtime Scope
- `components/marketplace/useMarketplaceMapViewState.ts`

## Test Scope
- `tests/components/marketplace-map-client.test.ts`
- `tests/components/use-marketplace-map-view-state.test.ts`

## Test-First Plan
1. Change the marketplace map client regression test so advancing timers past the former orbit delay expects a stable `viewState`.
2. Preserve the existing hover focus test.
3. Preserve the existing selected-pin centering test.
4. Preserve the existing equivalent-move render-loop regression test.

## Implementation Plan
1. Remove the deferred orbit timer from `useMarketplaceMapViewState`.
2. Stop importing and applying `createMarketplaceMapOrbitViewState` in the runtime hook.
3. Return the deterministic camera/focused view state directly as `displayedViewState`.
4. Keep `focusPin` and `applyMapMove` unchanged.

## Validation Plan
- `npm test -- tests/components/marketplace-map-client.test.ts tests/components/use-marketplace-map-view-state.test.ts`
- `npm test -- tests/components/marketplace-experience.test.ts tests/components/marketplace-map-shell.test.ts`
- `npm run validate:docs-governance`
- `npm run build`
- `npm run validate`
- Local production browser check against `/marketplace`

## Validation Results
- RED confirmed: the updated marketplace map client test failed before runtime changes because the old S13 timer changed `latitude`, `longitude`, `bearing`, and `pitch` at the former 4500 ms delay.
- `npm test -- tests/components/marketplace-map-client.test.ts tests/components/use-marketplace-map-view-state.test.ts` passed.
- `npm test -- tests/components/marketplace-experience.test.ts tests/components/marketplace-map-shell.test.ts` passed.
- `npm run lint` passed.
- `npm run validate:docs-governance` passed.
- `npm run build` passed.
- `npm run validate` passed.
- Local production browser check against `http://localhost:3100/marketplace` returned `200`, mounted one marketplace map client, and did not render `Marketplace could not be loaded`, `Maximum update depth`, or React error `#185` after waiting 9 seconds.
- Observed local-only aborted requests for Vercel Speed Insights/RSC navigation; no page errors were emitted.

## Linear Sync
After merge, update `BRI-164` with:
- automatic camera orbit disabled
- hover/selection preserved
- validation results
