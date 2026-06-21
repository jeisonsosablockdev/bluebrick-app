---
type: Fix Spec
title: Fix App Marketplace Map Update Depth BRI- 164
description: Fix App Marketplace Map Update Depth BRI- 164 - migrated from knowledge/
tags: [fixes]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/fixes/fix-app-marketplace-map-update-depth-bri-164.md
---

# Fix: Marketplace map update-depth deployment error

## Linear
- Parent issue: `BRI-164`

## Problem
The deployed `/marketplace` page can render the error boundary with:

`Minified React error #185`

React documents error #185 as a maximum update-depth failure, which means a component repeatedly schedules state updates until React stops the loop.

## Root Cause
The marketplace Mapbox client is controlled through `viewState`. When `react-map-gl` reports a move event that is equivalent to the current camera, `useMarketplaceMapViewState` still schedules a new `movedViewState`.

That can create a production loop:
- controlled `viewState` renders
- Mapbox reports `onMove`
- `applyMapMove` writes equivalent state
- React renders again
- Mapbox reports the same move again

## Solution
Guard `applyMapMove` so equivalent camera states do not write React state.

The comparison covers:
- latitude
- longitude
- zoom
- pitch
- bearing
- padding

Width and height remain fixed placeholders and are preserved from the previous state.

## Test Plan
- Add a RED component test that applies the same displayed view state and expects no extra render.
- Run the focused hook test.
- Run marketplace component tests.
- Run production build.

## Acceptance Criteria
- `/marketplace` no longer trips React #185 from equivalent Mapbox move events.
- Selected pin focus and user map movement behavior remain intact.
- Existing marketplace map tests stay green.
