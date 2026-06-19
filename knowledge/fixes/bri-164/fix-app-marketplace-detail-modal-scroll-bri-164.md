---
type: Fix Spec
title: Fix App Marketplace Detail Modal Scroll BRI- 164
description: Fix App Marketplace Detail Modal Scroll BRI- 164 - migrated from docs/
tags: [fixes]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/fixes/fix-app-marketplace-detail-modal-scroll-bri-164.md
---

# Fix: Marketplace detail modal scroll containment

## Linear
- Parent issue: `BRI-164`

## Problem
Opening a property detail from `/marketplace` creates two competing scroll areas: the modal detail panel scrolls, while the marketplace page behind it can also keep scrolling. This makes the backdrop feel detached from the detail surface and allows the underlying marketplace content to move underneath the modal.

The current modal surface also uses a full-height panel inside a padded fixed overlay. At desktop sizes this can make the panel border appear visually outside the veil near the top edge.

## Why It Matters
The marketplace detail entry should feel like a focused inspection layer. Double scroll breaks that focus, makes the top edge look misaligned, and creates a less polished experience for the property detail flow.

## Expected Outcome
When a marketplace property detail modal is open:
- the page behind the modal does not scroll
- the modal panel remains contained within the backdrop veil
- only the intended detail surface can scroll when content exceeds the viewport
- closing the modal restores the original page scroll behavior

## Scope
Change only the `/marketplace` in-grid detail modal behavior and shell styling in `MarketplaceGridClient`.

Keep unchanged:
- the dedicated `/marketplace/[id]` detail route
- property detail content sections
- purchase CTA behavior
- Mapbox marketplace map behavior
- Google Maps embed behavior in detail content

## Gaps Today
- No regression test confirms scroll locking while the modal is open.
- The modal panel uses `h-full`, which gives the surface less breathing room inside the overlay.
- The overlay does not explicitly prevent scroll chaining to the background document.

## Open Questions
- None for this slice. The desired behavior is a focused modal on `/marketplace` with background scroll locked while open.

## Acceptance Criteria
- Opening a marketplace detail modal locks `body` and `html` document scrolling.
- Closing the modal restores the previous document scroll styles.
- The overlay clips/contains the modal within the veil.
- The modal panel uses viewport-safe max height instead of full-height sizing.
- Existing detail loading, retry, close, and full-page link behavior remains intact.
