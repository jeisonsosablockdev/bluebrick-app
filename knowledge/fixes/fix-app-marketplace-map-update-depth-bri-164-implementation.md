# Implementation: Marketplace map update-depth deployment error

## Branch
`fix/app-marketplace-map-update-depth-bri-164`

## Runtime Scope
- `components/marketplace/useMarketplaceMapViewState.ts`
- `components/marketplace/MarketplaceMapClient.tsx`
- `components/marketplace/MarketplaceExperience.tsx`

## Test Scope
- `tests/components/use-marketplace-map-view-state.test.ts`
- `tests/components/marketplace-map-client.test.ts`
- `tests/components/marketplace-experience.test.ts`

## Root Cause (three-layer cascade)

### Layer 1 — padding reference equality in `areViewStatesEqual`
`left.padding === right.padding` compared object references, never returning `true`
when padding existed. This prevented the bail-out inside `createMovedViewState`
from firing, so every `applyMapMove` call scheduled a state update.

### Layer 2 — unstable `cameraViewState` reference
`cameraViewState` was re-created on every render. When passed as fallback to
`createMovedViewState`, the reference inequality combined with the broken padding
check meant `setMovedViewState` was called on every render → infinite loop.

### Layer 3 — controlled `viewState` prop on `<Map>`
Even with Layers 1-2 fixed, the Mapbox `onMove` event fires again when the
controlled `viewState` prop is updated, restarting the cycle. Any floating-point
rounding by Mapbox between event frames means `areViewStatesEqual` may never
settle, sustaining the loop indefinitely.

## Changes

### `useMarketplaceMapViewState.ts`
- Added `arePaddingsEqual()` — deep structural comparison of `top/bottom/left/right`
  instead of reference equality.
- Wrapped `cameraViewState` in `useMemo([cameraKey])` so the fallback object
  reference is stable between renders and only recomputed when the pin set or
  selected pin actually changes.
- Added regression test: same-state move with a new padding object reference must
  not schedule an extra render.

### `MarketplaceMapClient.tsx` (definitive fix for Layer 3)
- Replaced controlled `viewState` + `onMove` pattern with uncontrolled
  `initialViewState`. Mapbox now manages its own camera state internally.
- Pin focus is driven imperatively via `mapRef.current.getMap().easeTo()` — no
  React state is involved in camera position.
- Removed dependency on `useMarketplaceMapViewState` from this component entirely.
- Updated test mock and all assertions from `viewState` → `initialViewState`.
- Hover test now verifies `onPinHover` callback instead of checking a React prop.

### `MarketplaceExperience.tsx`
- Memoized `pins` via `useMemo([mapSources])` — a fresh array on every render
  was destabilizing `cameraKey` in the hook, preventing its `useMemo` guard.
- Memoized `mapNode` via `useMemo([pins, selectedPinId, …])` — prevented
  `DeferredMarketplaceMapClient` from receiving new prop references on each render.

## Validation
- `npx tsc --noEmit --project tsconfig.typecheck.json` — no errors.
- `npx vitest run tests/components/use-marketplace-map-view-state.test.ts tests/components/marketplace-map-client.test.ts tests/components/marketplace-experience.test.ts` — **12/12 passed**.
- Moving, zooming, and panning the Mapbox map no longer triggers
  "Maximum update depth exceeded" (React error #185).
