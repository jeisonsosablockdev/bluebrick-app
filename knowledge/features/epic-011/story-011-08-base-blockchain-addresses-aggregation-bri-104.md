---
type: Feature Spec
title: STORY- 011 08 Base Blockchain Addresses Aggregation BRI- 104
description: STORY- 011 08 Base Blockchain Addresses Aggregation BRI- 104 - migrated from knowledge/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/story-011-08-base-blockchain-addresses-aggregation-bri-104.md
---

# STORY-011-08 Base Blockchain Addresses Aggregation (`BRI-104`)

## Summary
- Added a dedicated server-side helper for the first read-only blockchain payload in admin collection detail.
- `GET /api/admin/collections/[id]` now returns a `blockchain` block alongside `ownership` and `content`.
- The detail page renders a minimal read-only section for collection, candy machine, and asset mint addresses.

## Scope
- Implemented `lib/admin/collection-blockchain-panel.ts` as the aggregation boundary for STORY-011-08.
- Reused ownership data for `collectionAddress` and `candyMachineAddress`.
- Read `asset_mint_snapshots.blockchain_snapshot` to resolve `assetMintAddress` when the snapshot exposes it.
- Kept authorities, guards, explorer links, and appdata out of this slice.

## Fallback Behavior
- If the snapshot does not expose an asset mint address yet, the panel still renders collection and candy machine addresses and leaves `assetMintAddress` as `null`.
- If the database is unavailable or the snapshot lookup fails, the helper falls back to the ownership-derived addresses instead of failing the detail route.

## Validation
- `npx vitest run tests/lib/admin-collection-blockchain-panel.test.ts tests/api/admin-collection-detail-route.test.ts tests/app/admin-collection-detail-page.test.ts`
- `npm run typecheck`
