---
type: Feature Spec
title: Feature EPIC- 011 STORY- 02 Admin Collections Read Model
description: Feature EPIC- 011 STORY- 02 Admin Collections Read Model - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/epic-011/feature-epic-011-story-02-admin-collections-read-model.md
---

# EPIC-011 Story 02: Admin Collections Read Model

## Summary
- Added a dedicated backend read-model contract for admin collections.
- Added the first read-only API surface for the collections list:
  - `GET /api/admin/collections`
- Added minimal read-only consumption of that contract in:
  - `app/admin/collections/page.tsx`
  - `app/admin/collections/loading.tsx`
- The read model classifies each owned marketplace entry as:
  - `linked`
  - `missing_snapshot`
  - `inconsistent`
- Matching is ownership-aware and uses:
  - `marketplace_entries.collection_address`
  - `marketplace_entries.asset_mint_address` as the persisted candy machine address
  - `asset_mint_snapshots.collection_address`
  - `asset_mint_snapshots.candy_machine_address`

## Notes
- `GET /api/admin/collections` now delegates directly to the read model and requires an authenticated admin session with a server-side pubkey.
- The route intentionally remains read-only and does not add PATCH/detail behavior yet.
- The admin collections page now consumes the endpoint contract server-side and renders explicit `loading`, `error`, `empty`, and minimal `success` states.
- The page remains intentionally simple so the richer index UI work stays deferred to `STORY-011-05` / `BRI-74`.
- Only `linked` rows expose editable sections in the contract.

## Validation
- Added focused unit coverage for:
  - exact dual match => `linked`
  - no match => `missing_snapshot`
  - partial one-side match => `inconsistent`
  - exact match winning over partial matches
- Added route coverage for:
  - `403` when the caller is not an authenticated admin with a pubkey
  - `200` when the route returns the read-model payload
  - `500` when the delegated read model throws
- Added page render coverage for:
  - loading handoff
  - empty state
  - error state
  - success state with minimal summary + row rendering
