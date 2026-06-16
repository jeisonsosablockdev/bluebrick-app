---
type: Fix Spec
title: Fix App Marketplace Side Pin Compact BRI- 164 Implementation
description: Fix App Marketplace Side Pin Compact BRI- 164 Implementation - migrated from docs/
tags: [fixes]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/fixes/fix-app-marketplace-side-pin-compact-bri-164-implementation.md
---

# Implementation: Compact marketplace side pin card

## Branch
`fix/app-marketplace-side-pin-compact-bri-164`

## Runtime Scope
- `components/marketplace/MarketplaceMapShell.tsx`

## Test Scope
- `tests/components/marketplace-map-shell.test.ts`

## Test-First Plan
1. Add coverage that the side panel pin card renders the compact sizing classes.
2. Preserve existing fallback and map shell rendering tests.
3. Preserve click/selection semantics by leaving the button structure unchanged.

## Implementation Plan
1. Reduce side pin card padding from the large desktop treatment to a compact treatment.
2. Reduce title and location text sizes.
3. Reduce spacing and badge sizing.
4. Keep the card full-width in the panel so the click target remains easy to use.

## Validation Plan
- `npm test -- tests/components/marketplace-map-shell.test.ts`
- `npm run validate:docs-governance`
- `npm run build`

## Validation Results
- RED confirmed: the compact side-card class expectations failed against the previous large card treatment.
- `npm test -- tests/components/marketplace-map-shell.test.ts` passed.
- `npm run validate:docs-governance` passed.
- `npm run build` passed.
- `npm run validate` passed.
- Local production screenshot captured at `http://localhost:3100/marketplace`; the side panel card is compact and no marketplace error boundary rendered.
