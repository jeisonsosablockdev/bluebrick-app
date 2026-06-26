---
type: Feature Spec
title: STORY- 011 09 Address Autocomplete BRI- 112
description: STORY- 011 09 Address Autocomplete BRI- 112 - migrated from knowledge/
tags: [features]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/features/story-011-09-address-autocomplete-bri-112.md
---

# STORY-011-09 / BRI-112

## Summary
- added Google Maps address autocomplete to the collection location section
- added protected admin routes for autocomplete suggestions and place resolution
- resolved selected places locally into the reduced `googleMapsPlace` payload without persisting yet

## Why
- the location section needed a real selection flow before section-level save/cancel and persistence wiring
- this slice keeps lookup/resolution server-side and leaves persistence for the next step

## Scope
- `components/admin/admin-collection-location-editor.tsx`
- `lib/admin/admin-collection-location-client.ts`
- `lib/admin/google-maps-places-service.ts`
- `app/api/admin/collections/[id]/location-maps/autocomplete/route.ts`
- `app/api/admin/collections/[id]/location-maps/resolve/route.ts`

## Validation
- `npx vitest run tests/lib/google-maps-places-service.test.ts tests/api/admin-collection-location-autocomplete-route.test.ts tests/api/admin-collection-location-resolve-route.test.ts tests/components/admin-collection-location-editor.test.ts tests/app/admin-collection-detail-page.test.ts tests/lib/admin-collection-location-contract.test.ts tests/api/admin-collection-location-maps-route.test.ts`
- `npm run typecheck`
