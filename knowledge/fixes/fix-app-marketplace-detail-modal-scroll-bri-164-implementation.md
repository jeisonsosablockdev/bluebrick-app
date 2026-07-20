---
type: Fix Spec
title: Fix App Marketplace Detail Modal Scroll BRI- 164 Implementation
description: Fix App Marketplace Detail Modal Scroll BRI- 164 Implementation - migrated from knowledge/
tags: [fixes]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/fixes/fix-app-marketplace-detail-modal-scroll-bri-164-implementation.md
---

# Implementation: Marketplace detail modal scroll containment

## Branch
`fix/app-marketplace-detail-modal-scroll-bri-164`

## Runtime Scope
- `components/marketplace/MarketplaceGridClient.tsx`

## Test Scope
- `tests/components/marketplace-grid-client.test.ts`

## Workflow
- Frontend cycle: `/marketplace` browser-facing UI surface.
- Participants: planner, frontend, qa, docs, reviewer.
- Motion 12 note: this slice does not introduce new motion behavior; it keeps the existing `motion/react` modal transitions and only adjusts modal containment classes.

## Test-First Plan
1. Add a component regression test that opens a marketplace detail modal.
2. Assert `document.body` and `document.documentElement` scrolling are locked while the modal is mounted.
3. Assert closing the modal restores the original scroll styles.
4. Assert the overlay and panel expose containment classes that prevent the panel border from escaping the veil and prevent scroll chaining.

## Implementation Plan
1. Add a client-side scroll lock effect tied to `selectedId`.
2. Preserve existing document overflow styles and restore them on cleanup.
3. Render the modal through a `document.body` portal so the fixed overlay is not constrained by marketplace layout or Motion ancestors.
4. Add viewport-safe overlay and panel sizing:
   - overlay: fixed viewport, overflow hidden, top padding, backdrop blur
   - panel: max viewport height, internal vertical scroll, overscroll containment
5. Add stable test IDs for modal overlay and panel.
6. Keep existing detail fetch, close, retry, and full-page navigation behavior.

## Validation Plan
- `npm test -- tests/components/marketplace-grid-client.test.ts`
- `npm run validate:docs-governance`
- `npm run build`
- Browser evidence for `/marketplace` modal detail when feasible.

## Validation Results
- RED confirmed: the initial scroll-lock regression failed while `document.body.style.overflow` remained `auto`.
- RED confirmed: the portal regression failed while the overlay parent remained inside the marketplace component container.
- `npm test -- tests/components/marketplace-grid-client.test.ts` passed.
- `npm run validate:docs-governance` passed.
- `npm run build` passed.
- `npm run validate` passed.
- Local production browser evidence at `http://localhost:3100/marketplace` confirmed:
  - `bodyOverflow: hidden`
  - `documentOverflow: hidden`
  - `overlayParentIsBody: true`
  - `overlayTop: 0`
  - panel remains inside viewport and uses overscroll containment

## Linear Sync
- Update `BRI-164` with the visual modal containment fix after validation.
