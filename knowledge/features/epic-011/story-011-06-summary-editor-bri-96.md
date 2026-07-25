---
type: Feature Spec
title: STORY- 011 06 Summary Editor BRI- 96
description: STORY- 011 06 Summary Editor BRI- 96 - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/epic-011/story-011-06-summary-editor-bri-96.md
---

# STORY-011-06 / BRI-96 Summary Editor

## What changed
- Mounted a dedicated client editor for `Fractional investment summary` inside `/admin/collections/[id]`.
- Kept the rest of the detail shell server-rendered and read-only for later slices.
- Added an isolated section save loop using `PATCH /api/admin/collections/[id]` with `section: "summary"`.

## Why
- `STORY-011-06` requires section-by-section save/cancel behavior instead of a global editor state.
- The summary slice is the first editable section and establishes the modular pattern for later editors.
- The refactor from `BRI-123` stays intact because layout primitives, mutation wiring, and state logic remain separated.

## Validation
- `tests/lib/admin-collection-summary-client.test.ts`
- `tests/app/admin-collection-detail-page.test.ts`
