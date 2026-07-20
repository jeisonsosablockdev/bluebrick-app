---
type: Feature Spec
title: STORY- 011 08 Guard Fields Aggregation BRI- 106
description: STORY- 011 08 Guard Fields Aggregation BRI- 106 - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/story-011-08-guard-fields-aggregation-bri-106.md
---

# STORY-011-08 Guard Fields Aggregation (`BRI-106`)

## Summary
- Extended the read-only blockchain detail payload with visible Candy Guard fields for the admin collections detail shell.
- Kept the mapping backend-only and explicitly optional-field safe.

## Scope
- Added `guards` into the `blockchain` payload from `GET /api/admin/collections/[id]`.
- Resolved `startDateIso` from persisted snapshot values when present.
- Resolved `tokenPaymentMint` and `tokenPaymentDestination` from snapshot values when present, with fallback to current server-side USDC guard configuration.
- Rendered the guard values in the existing blockchain detail panel.

## Fallback Behavior
- Missing snapshot guard values degrade to server configuration where the current product policy already defines a canonical value.
- `startDateIso` remains `null` when not persisted in the snapshot.
- No write path or edit controls were introduced.

## Validation
- `npx vitest run tests/lib/admin-collection-blockchain-panel.test.ts tests/api/admin-collection-detail-route.test.ts tests/app/admin-collection-detail-page.test.ts`
- `npm run typecheck`
