---
type: Feature Spec
title: STORY- 011 08 Appdata Plugin Fields Aggregation BRI- 107
description: STORY- 011 08 Appdata Plugin Fields Aggregation BRI- 107 - migrated from knowledge/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/story-011-08-appdata-plugin-fields-aggregation-bri-107.md
---

# Feature: STORY-011-08 AppData plugin fields aggregation (BRI-107)

## Summary
- Extended the admin collections blockchain read model with an `appdata` block sourced from `asset_mint_snapshots.blockchain_snapshot`.
- Reused the canonical `validateAppDataEconomicV1` contract from `lib/core-candy-machine-admin.ts` so the read-only panel only exposes schema-approved AppData values.
- Invalid or missing AppData payloads now degrade to `null` fields instead of leaking partial or speculative plugin data.

## Scope
- `lib/admin/collection-blockchain-panel.ts`
- `lib/admin/admin-collections-e2e-fixture.ts`
- `tests/lib/admin-collection-blockchain-panel.test.ts`
- `tests/api/admin-collection-detail-route.test.ts`
- `tests/app/admin-collection-detail-page.test.ts`

## Notes
- This slice only normalizes backend payloads for UI consumption.
- The dedicated read-only panel rendering for AppData remains the responsibility of `BRI-108`.

## Validation
- `npx vitest run tests/lib/admin-collection-blockchain-panel.test.ts tests/api/admin-collection-detail-route.test.ts tests/app/admin-collection-detail-page.test.ts`
