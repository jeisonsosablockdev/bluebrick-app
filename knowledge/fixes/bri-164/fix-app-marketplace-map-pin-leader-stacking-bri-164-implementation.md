---
type: Fix Spec
title: Fix App Marketplace Map Pin Leader Stacking BRI- 164 Implementation
description: Fix App Marketplace Map Pin Leader Stacking BRI- 164 Implementation - migrated from knowledge/
tags: [fixes]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/fixes/fix-app-marketplace-map-pin-leader-stacking-bri-164-implementation.md
---

# Implementation: Marketplace map pin leader stacking

## Branch
`fix/app-marketplace-map-pin-leader-stacking-bri-164`

## Runtime Scope
- `components/marketplace/MarketplaceMapClient.tsx`

## Test Scope
- `tests/components/marketplace-map-client.test.ts`

## Workflow
- Frontend cycle: `/marketplace` browser-facing UI surface.
- Motion note: this slice does not add or alter motion behavior.

## Test-First Plan
1. Add a regression test with two pins where the northern pin appears before the southern pin in the rendered marker order.
2. Assert the southern pin renders last so its card can visually cover crossed leader lines.
3. Preserve existing tests for marker content, hover zoom, selected-pin focus, and no auto camera motion.

## Implementation Plan
1. Sort pins into a render-only collection by descending latitude before mapping markers.
2. Keep the original `pins` array unchanged for camera midpoint/selection logic.
3. Render `MarketplaceMapMarker` from the sorted collection.

## Validation Plan
- `npm test -- tests/components/marketplace-map-client.test.ts`
- `npm run validate:docs-governance`
- `npm run build`
- `npm run validate`

## Validation Results
- RED confirmed: the marker order regression failed while pins rendered in source order.
- `npm test -- tests/components/marketplace-map-client.test.ts` passed.
- `npm run validate:docs-governance` passed.
- `npm run build` passed.
- `npm run validate` passed.
- Local production browser evidence at `http://localhost:3100/marketplace` confirmed marker render order:
  - `Fix & Flip Brandon 117`
  - `Fix & Flip 518 HUNTER LN 518`
- The southern/lower marker now renders after the northern marker, allowing its card to cover crossed leader lines.

## Linear Sync
- Update `BRI-164` after merge with the visual stacking fix and validation evidence.
