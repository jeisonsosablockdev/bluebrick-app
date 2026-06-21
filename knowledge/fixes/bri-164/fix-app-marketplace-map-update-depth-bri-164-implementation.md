---
type: Fix Spec
title: Fix App Marketplace Map Update Depth BRI- 164 Implementation
description: Fix App Marketplace Map Update Depth BRI- 164 Implementation - migrated from knowledge/
tags: [fixes]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/fixes/fix-app-marketplace-map-update-depth-bri-164-implementation.md
---

# Implementation: Marketplace map update-depth deployment error

## Branch
`fix/app-marketplace-map-update-depth-bri-164`

## Runtime Scope
- `components/marketplace/useMarketplaceMapViewState.ts`

## Test Scope
- `tests/components/use-marketplace-map-view-state.test.ts`

## Changes
- Added a regression test for duplicate/equivalent Mapbox move events.
- Added a view-state equality guard in the map camera hook.
- `applyMapMove` now returns the current state unchanged, or `null` for the untouched aggregate camera, when the incoming move is equivalent.

## Validation
- `npm test -- tests/components/use-marketplace-map-view-state.test.ts` passed.
- `npm test -- tests/components/use-marketplace-map-view-state.test.ts tests/components/marketplace-map-client.test.ts tests/components/marketplace-experience.test.ts tests/components/marketplace-map-shell.test.ts` passed.
- `npm run validate:docs-governance` passed.
- `npm run build` passed.
- Local production browser check against `http://localhost:3100/marketplace` returned `200` and did not render `Marketplace could not be loaded`, `Minified React error #185`, or a maximum update-depth console error.
