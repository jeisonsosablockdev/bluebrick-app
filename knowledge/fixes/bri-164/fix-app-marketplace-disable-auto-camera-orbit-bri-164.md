---
type: Fix Spec
title: Fix App Marketplace Disable Auto Camera Orbit BRI- 164
description: Fix App Marketplace Disable Auto Camera Orbit BRI- 164 - migrated from knowledge/
tags: [fixes]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/fixes/fix-app-marketplace-disable-auto-camera-orbit-bri-164.md
---

# Fix: Disable marketplace automatic camera orbit

## Linear
- Parent issue: `BRI-164`

## Problem
The deployed `/marketplace` page can render the marketplace error boundary with:

`Maximum update depth exceeded`

In production this can also appear as React minified error `#185`.

## Suspected Root Cause
The BRI-164 marketplace map currently includes S13 deferred automatic camera motion.

That behavior:
- waits for the initial render window
- starts a timer
- increments an orbit step
- applies `createMarketplaceMapOrbitViewState`
- changes the controlled Mapbox `viewState` automatically

Because the Mapbox client is controlled by React, this automatic movement can repeatedly schedule camera state updates and collide with Mapbox move reporting. That makes it the highest-risk source for the maximum update-depth error.

## Scope
Disable only the slow automatic camera orbit.

Keep:
- selected-pin camera centering
- marker hover focus behavior
- manual/user camera move handling
- pins, leader lines, labels, style, token fallback, and list behavior

## Non-Goals
- Do not disable Mapbox interaction globally.
- Do not remove `onMove`.
- Do not remove marker hover focus.
- Do not redesign the map.
- Do not change marketplace detail behavior.

## Expected Outcome
The map no longer changes camera position by itself after load.

Manual/intentional camera changes still work through the existing selected-pin and focus paths.

## Acceptance Criteria
- Advancing timers past the former S13 delay does not mutate `viewState`.
- Hovering a marker still focuses/zooms that pin.
- Selecting a pin still centers the selected listing.
- Equivalent Mapbox move events still do not schedule duplicate renders.
- `/marketplace` no longer renders the marketplace error boundary during a local production check.
