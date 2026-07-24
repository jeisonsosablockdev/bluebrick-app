---
type: Fix Spec
title: Fix App Marketplace Map Pin Contrast BRI- 164 Implementation
description: Fix App Marketplace Map Pin Contrast BRI- 164 Implementation - migrated from knowledge/
tags: [fixes]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/fixes/fix-app-marketplace-map-pin-contrast-bri-164-implementation.md
---

# Implementation: Marketplace map pin contrast

## Branch
`fix/app-marketplace-map-pin-contrast-bri-164`

## Runtime Scope
- `components/marketplace/MarketplaceMapMarker.tsx`

## Test Scope
- `tests/components/marketplace-map-marker.test.ts`

## Test-First Plan
1. Add regression coverage that the marker button uses a darker high-opacity background.
2. Add regression coverage that the previous translucent `bg-cyan-300/15` class is absent.
3. Preserve existing hover activation and content assertions.

## Implementation Plan
1. Replace the marker card background with a darker slate/cyan high-opacity treatment.
2. Keep the existing cyan border, text, hover scale, leader line, and anchor dot.
3. Keep the sold-percent badge unchanged unless contrast remains insufficient.

## Validation Plan
- `npm test -- tests/components/marketplace-map-marker.test.ts`
- `npm run validate:docs-governance`
- `npm run build`

## Validation Results
- RED confirmed: marker contrast coverage failed while the marker still used `bg-cyan-300/15`.
- `npm test -- tests/components/marketplace-map-marker.test.ts` passed.
- `npm run validate:docs-governance` passed.
- `npm run build` passed.
- `npm run validate` passed.
- Local production screenshot at `http://localhost:3100/marketplace` confirmed the map pin has a darker background and the marketplace error boundary did not render.
