---
type: Feature Spec
title: Feature EPIC- 011 STORY- 05 Collection Cards Ui BRI- 93
description: Feature EPIC- 011 STORY- 05 Collection Cards Ui BRI- 93 - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/feature-epic-011-story-05-collection-cards-ui-bri-93.md
---

# EPIC-011 Story 05: Collection Cards UI

## Summary
- Replaced the basic success list rendering in `/admin/collections` with a visual card grid.
- Each collection card now renders:
  - read-only cover
  - title and update timestamp
  - validation badge
  - collection and candy machine identifiers
  - editable section chips (or non-editable notice)
  - core CTA surface (`Manage project` / `Needs review`)
- Kept loading, empty, and degraded/error states from `BRI-92` unchanged.

## Boundaries
- No API contract changes.
- No ownership/auth/session logic changes.
- No detail route navigation behavior changes in this slice.

## Validation
- Updated page render test coverage in `tests/app/admin-collections-page.test.ts`.
- Success state now validates card-grid-oriented copy and controls while preserving existing state contract expectations.
