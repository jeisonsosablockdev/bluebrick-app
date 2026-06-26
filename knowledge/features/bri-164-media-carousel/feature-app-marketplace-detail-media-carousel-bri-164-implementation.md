---
type: Feature Spec
title: Feature App Marketplace Detail Media Carousel BRI- 164 Implementation
description: Feature App Marketplace Detail Media Carousel BRI- 164 Implementation - migrated from knowledge/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-app-marketplace-detail-media-carousel-bri-164-implementation.md
---

# Implementation: Marketplace detail project media carousel

## Branch
`feature/app-marketplace-detail-media-carousel-bri-164`

## Runtime Scope
- `components/marketplace/PropertyDetailMediaSection.tsx`

## Test Scope
- `tests/components/property-detail-media-section.test.ts`

## Workflow
- Frontend cycle: `/marketplace/[id]` browser-facing detail UI.
- Skill: `ui-ux-pro-max`
- Motion note: no new automatic animation is introduced; interaction is button-driven.

## Test-First Plan
1. Extend media section tests with a `propertyImages` group containing five images.
2. Assert the group renders as a carousel with a count and one active image.
3. Assert next/previous controls cycle through the images.
4. Assert single-image groups do not render inactive controls.
5. Keep the existing empty-media test unchanged.

## Implementation Plan
1. Keep existing media grouping and duplicate URL filtering.
2. Add per-group active index state keyed by media type.
3. Render a carousel shell per media group:
   - header label and image count
   - aspect-ratio image viewport
   - previous/next controls for multi-image groups
   - active image position indicator
4. Preserve Next Image dimensions/sizing to avoid layout shift.
5. Use accessible labels for carousel controls.

## Validation Plan
- `npm test -- tests/components/property-detail-media-section.test.ts`
- `npm run validate:docs-governance`
- `npm run build`
- `npm run validate`
- Browser evidence for `/marketplace/[id]` when feasible.

## Validation Results
- RED confirmed: carousel regression failed while media groups rendered as static grids.
- `npm test -- tests/components/property-detail-media-section.test.ts` passed.
- `npm run validate:docs-governance` passed.
- `npm run build` passed.
- `npm run validate` passed.
- Local production browser evidence at `http://localhost:3100/marketplace/fix-flip-518-hunter-ln-518` confirmed:
  - `PROPERTY` group has `5 images`
  - initial carousel state shows `1 / 5`
  - `Next Property image` control advances to `2 / 5`
  - single-image `Gallery` group does not render inactive next/previous controls

## Linear Sync
- Update `BRI-164` after merge with summary, commits, PR, and validation evidence.
