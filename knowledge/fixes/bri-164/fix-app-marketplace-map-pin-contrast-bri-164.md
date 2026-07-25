---
type: Fix Spec
title: Fix App Marketplace Map Pin Contrast BRI- 164
description: Fix App Marketplace Map Pin Contrast BRI- 164 - migrated from knowledge/
tags: [fixes]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/fixes/bri-164/fix-app-marketplace-map-pin-contrast-bri-164.md
---

# Fix: Marketplace map pin contrast

## Linear
- Parent issue: `BRI-164`

## Problem
The property pin rendered directly on the Mapbox map is too transparent. The map labels and roads show through the pin card, making the property title harder to read.

## Outcome
Make the map pin background significantly darker and less transparent while preserving the current marker size, content, leader line, anchor dot, and interaction behavior.

## Scope
Change only the map marker visual shell in `MarketplaceMapMarker`.

Keep unchanged:
- side panel pin card
- map camera behavior
- selected pin behavior
- marketplace layout modes
- marketplace detail page

## Acceptance Criteria
- The marker card no longer uses the translucent `bg-cyan-300/15` treatment.
- The marker card uses a darker, high-opacity background.
- Hover state remains visibly related to the BRIDS cyan palette.
- Marker title and sold-percent text remain unchanged.
