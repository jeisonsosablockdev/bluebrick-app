---
type: Feature Spec
title: Feature App Marketplace Detail Media Carousel BRI- 164
description: Feature App Marketplace Detail Media Carousel BRI- 164 - migrated from knowledge/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-app-marketplace-detail-media-carousel-bri-164.md
---

# Feature: Marketplace detail project media carousel

## Linear
- Parent issue: `BRI-164`

## Problem
The marketplace property detail route already separates project media by type, but each group renders as a static grid. When a group has several images, such as a `PROPERTY` group with five images, the section becomes visually heavy and pushes detail content down.

## Why It Matters
Project media should support property exploration without overwhelming the detail page. A carousel keeps each media type distinct while making multiple images easier to scan.

## Expected Outcome
On `/marketplace/[id]`, the `Project media` section:
- keeps media separated by type
- renders each media type as its own carousel
- shows one active image per group
- shows the image count per group
- provides previous/next controls when a group has more than one image
- keeps single-image groups simple without inactive controls

## Scope
Included:
- `PropertyDetailMediaSection`
- Component tests for project media carousel behavior
- Documentation artifact pair for the slice

Excluded:
- Admin upload/edit flows
- Data model or database changes
- Mapbox marketplace map behavior
- `/marketplace` list/map layout behavior

## UI/UX Notes
Using `ui-ux-pro-max` guidance:
- Accessibility: controls need explicit labels and visible focus states.
- Touch: carousel controls must meet minimum 44px target size.
- Performance: images must keep reserved dimensions/aspect ratio to avoid layout shift.
- Layout: avoid turning the whole section into horizontal page scroll.
- Motion: this slice does not add automatic motion; navigation is user-controlled.

## Open Questions
- None for this slice. The existing `galleryImages` and `propertyImages` arrays are sufficient.

## Acceptance Criteria
- A media group with five property images shows a `5 images` count.
- Only one primary image per media group is displayed at a time.
- Previous and next buttons cycle through images in the group.
- Single-image groups do not render carousel controls.
- Existing empty-media behavior remains unchanged.
