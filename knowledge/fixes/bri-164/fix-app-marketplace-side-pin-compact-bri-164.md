---
type: Fix Spec
title: Fix App Marketplace Side Pin Compact BRI- 164
description: Fix App Marketplace Side Pin Compact BRI- 164 - migrated from knowledge/
tags: [fixes]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/fixes/fix-app-marketplace-side-pin-compact-bri-164.md
---

# Fix: Compact marketplace side pin card

## Linear
- Parent issue: `BRI-164`

## Problem
The `/marketplace` map side panel renders each pin entry too large on desktop.

The issue is the `Pins` panel card on the right side of the marketplace map shell, not the geographic marker rendered on top of the Mapbox map.

## Outcome
Reduce the side panel pin card visual weight by roughly 30% on desktop.

## Scope
Change only the side panel pin card sizing in `MarketplaceMapShell`.

Keep unchanged:
- Mapbox marker size on the map
- camera behavior
- selected-pin behavior
- map/list layout modes
- data projection
- marketplace detail page

## Acceptance Criteria
- The side panel pin card uses more compact padding, radius, gap, title text, location text, and percentage badge sizing.
- Pin selection and click behavior remain unchanged.
- The map marker on the geographic map remains unchanged.
