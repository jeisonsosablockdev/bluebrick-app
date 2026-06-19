---
type: Feature Spec
title: Feature EPIC- 011 STORY- 05 Navigation To Detail View BRI- 94
description: Feature EPIC- 011 STORY- 05 Navigation To Detail View BRI- 94 - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-epic-011-story-05-navigation-to-detail-view-bri-94.md
---

# EPIC-011 Story 05: Navigation To Detail View

## Summary
- Wired ready collection cards in `/admin/collections` to the approved detail route `/admin/collections/[id]`.
- Kept unavailable entries explicitly blocked in the index with a review-state CTA instead of speculative navigation.
- Added a minimal detail-route handoff page that consumes the approved `GET /api/admin/collections/:id` contract without implementing the full editor yet.

## Boundaries
- No section editor rendering.
- No new mutation contract.
- No health/manual-review queue implementation in this slice.

## Validation
- Added page coverage for the new detail route handoff.
- Updated index page coverage to assert live navigation for linked entries.
