---
type: Feature Spec
title: STORY- 011 09 Persist Google Maps Place Json BRI- 113
description: STORY- 011 09 Persist Google Maps Place Json BRI- 113 - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/epic-011/story-011-09-persist-google-maps-place-json-bri-113.md
---

# STORY-011-09 / BRI-113

## Summary
- formalized the `googleMapsPlace` mutation client on top of the existing collection PATCH route
- added repository and route regression coverage for reduced place payload persistence
- kept the change aligned with the approved `google_maps_place_json` shape

## Why
- the editor needed a stable persistence path for the reduced Maps payload before save/cancel UX was wired
- this keeps `BRI-114` focused on section interaction and QA, not data contract risk

## Scope
- `lib/admin/admin-collection-location-client.ts`
- `tests/lib/admin-collection-location-client.test.ts`
- PATCH/detail and repository regression tests for `googleMapsPlace`

## Validation
- `npx vitest run tests/lib/admin-collection-location-client.test.ts tests/api/admin-collection-detail-route.test.ts tests/lib/collection-content-repository.test.ts tests/lib/admin-collection-patch-payload.test.ts`
- `npm run typecheck`
