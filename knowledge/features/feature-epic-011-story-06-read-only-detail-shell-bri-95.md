---
type: Feature Spec
title: Feature EPIC- 011 STORY- 06 Read Only Detail Shell BRI- 95
description: Feature EPIC- 011 STORY- 06 Read Only Detail Shell BRI- 95 - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/feature-epic-011-story-06-read-only-detail-shell-bri-95.md
---

# EPIC-011 Story 06: Read-Only Detail Shell

## Summary
- Replaced the minimal detail handoff in `/admin/collections/[id]` with a stable read-only detail shell.
- The page now exposes:
  - locked cover semantics sourced from Candy Machine metadata
  - read-only metadata side panel
  - section scaffolding for summary, property information, gallery, and documents
  - responsive content layout ready for later section editors

## Boundaries
- No editing controls yet.
- No blockchain read-only panel.
- No maps integration.

## Validation
- Added detail-page render coverage for the shell sections and read-only cover semantics.
- Existing route contract remains server-rendered and continues to consume `GET /api/admin/collections/:id`.
