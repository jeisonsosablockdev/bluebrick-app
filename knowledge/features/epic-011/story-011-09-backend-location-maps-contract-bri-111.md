---
type: Feature Spec
title: STORY- 011 09 Backend Location Maps Contract BRI- 111
description: STORY- 011 09 Backend Location Maps Contract BRI- 111 - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/epic-011/story-011-09-backend-location-maps-contract-bri-111.md
---

# STORY-011-09 / BRI-111

## Summary
- added a dedicated backend contract for the admin collection location/maps section
- exposed normalized location context, reduced place payload, outbound URL, and embed URL through one shape
- added a dedicated admin route for the section contract

## Why
- later slices need one stable contract for read render, autocomplete, and persistence
- this avoids coupling autocomplete to the full detail payload and keeps URL derivation centralized

## Scope
- `lib/admin/admin-collection-location-contract.ts`
- `app/api/admin/collections/[id]/location-maps/route.ts`
- focused route/contract tests

## Validation
- `npx vitest run tests/lib/admin-collection-location-contract.test.ts tests/api/admin-collection-location-maps-route.test.ts tests/lib/admin-collection-location-view.test.ts tests/app/admin-collection-detail-page.test.ts tests/api/admin-collection-detail-route.test.ts`
- `npm run typecheck`
