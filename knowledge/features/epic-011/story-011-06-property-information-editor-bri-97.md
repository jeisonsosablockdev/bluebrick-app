---
type: Feature Spec
title: STORY- 011 06 Property Information Editor BRI- 97
description: STORY- 011 06 Property Information Editor BRI- 97 - migrated from knowledge/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/story-011-06-property-information-editor-bri-97.md
---

# STORY-011-06 / BRI-97 Property Information Editor

## What changed
- Mounted a dedicated client editor for `Property information` inside `/admin/collections/[id]`.
- Refactored the text-section editor pattern so `summary` and `property information` reuse the same mutation/state core.
- Kept gallery and documents read-only for later STORY-011-06 slices.

## Why
- `Property information` needs the same independent save/cancel semantics as `summary`.
- The shared text-section core prevents duplicated section state logic as more modular editors are added.
- This keeps the clean-code boundaries from `BRI-123` intact while extending the detail editor.

## Validation
- `tests/lib/admin-collection-text-section-client.test.ts`
- `tests/app/admin-collection-detail-page.test.ts`
