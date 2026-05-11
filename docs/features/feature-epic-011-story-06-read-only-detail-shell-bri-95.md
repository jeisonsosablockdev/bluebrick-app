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
