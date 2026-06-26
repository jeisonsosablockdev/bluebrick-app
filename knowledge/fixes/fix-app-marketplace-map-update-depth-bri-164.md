# Fix: Marketplace map update-depth deployment error

## Linear
- Parent issue: `BRI-164`

## Problem
The deployed `/marketplace` page can render the error boundary with:

`Minified React error #185`

React documents error #185 as a maximum update-depth failure, which means a component repeatedly schedules state updates until React stops the loop.

## Root Cause
The marketplace Mapbox client is controlled through `viewState`. When `react-map-gl` reports a move event that is equivalent to the current camera, `useMarketplaceMapViewState` still schedules a new `movedViewState`.

This occurs due to two reasons:
1. **Object Reference Equality on Padding**: The `padding` property comparison inside `areViewStatesEqual` (`left.padding === right.padding`) was comparing references. Mapbox passes new padding objects during movement, which broke the equality check even if the values were identical.
2. **Recreated Camera View State**: The `cameraViewState` object was computed on every render, preventing `areViewStatesEqual` from correctly bailing out since a new object reference was always returned.

This created an infinite update loop under React production builds, resulting in React Error #185.

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
