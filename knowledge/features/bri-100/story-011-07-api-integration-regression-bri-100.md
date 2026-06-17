---
type: Feature Spec
title: STORY- 011 07 Api Integration Regression BRI- 100
description: STORY- 011 07 Api Integration Regression BRI- 100 - migrated from docs/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/story-011-07-api-integration-regression-bri-100.md
---

# STORY-011-07 / BRI-100 / API and Integration Regression Coverage

## Summary
- Expanded regression coverage for `GET /api/admin/collections/[id]` and `PATCH /api/admin/collections/[id]`.
- Locked the route contract around canonical ownership resolution, immutable cover rejection, and malformed JSON handling.

## Delivered
- Added route-level regression tests for:
  - canonical `entryId` usage from the ownership helper during both read and update flows
  - blank collection ids propagating the ownership helper validation error without repository access
  - nested immutable cover mutations inside gallery payloads being rejected before ownership lookup
  - malformed JSON PATCH bodies returning `400 INVALID_COLLECTION_PAYLOAD`
- Hardened the PATCH route so invalid JSON no longer falls through as a generic `500`.

## Validation
- `npx vitest run tests/api/admin-collection-detail-route.test.ts`
