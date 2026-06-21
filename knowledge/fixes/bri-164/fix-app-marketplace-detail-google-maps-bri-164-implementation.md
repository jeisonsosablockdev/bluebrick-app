---
type: Fix Spec
title: Fix App Marketplace Detail Google Maps BRI- 164 Implementation
description: Fix App Marketplace Detail Google Maps BRI- 164 Implementation - migrated from knowledge/
tags: [fixes]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/fixes/fix-app-marketplace-detail-google-maps-bri-164-implementation.md
---

# Implementation Plan: Marketplace Detail Google Maps Preview (BRI-164)

## Status
- Implementation slice
- Depends on: `knowledge/fixes/fix-app-marketplace-detail-google-maps-bri-164.md`
- Branch: `fix/app-marketplace-detail-google-maps-bri-164-s08-detail-map`

## Goal
Make marketplace property detail pages show the Google Maps preview for the property location while preserving the detail page as a traditional entry page.

## Technical Plan
1. Extend the public `PropertyDetail` contract with the reduced Google Maps place payload used by admin collection location flows.
2. Select `google_maps_place_json` from persisted `marketplace_entries` when the column exists.
3. Normalize invalid or missing Google Maps payloads to `null`.
4. Preserve the Google Maps place payload during admin marketplace entry creation when present.
5. Add a marketplace detail location section that:
   - builds an official Google Maps Embed API URL from `placeId` first,
   - falls back to coordinates or address query,
   - uses only public client-safe embed configuration,
   - renders an outbound Google Maps link as a safe fallback.
6. Keep Mapbox-specific code limited to `/marketplace` and do not introduce Mapbox into `/marketplace/[id]`.

## Test-First Contract
- Add or tighten component coverage before implementation for the missing iframe on `PropertyDetailContent`.
- Add read-model coverage proving persisted `google_maps_place_json` is selected and mapped into `PropertyDetail`.
- Add route/API coverage only if the creation payload path needs a new contract assertion.

## Files Expected To Change
- `knowledge/fixes/fix-app-marketplace-detail-google-maps-bri-164.md`
- `knowledge/fixes/fix-app-marketplace-detail-google-maps-bri-164-implementation.md`
- `knowledge/features/feature-app-create-a-marketplace-3d-visual-bri-164.md`
- `knowledge/features/feature-app-create-a-marketplace-3d-visual-bri-164-implementation.md`
- `lib/property-service.ts`
- `lib/property-marketplace-server.ts`
- `lib/admin/marketplace-entry-location-columns.ts`
- `app/api/admin/marketplace/entries/route.ts`
- `components/marketplace/PropertyDetailContent.tsx`
- targeted tests under `tests/`

## Risks
- Public Google Maps iframe rendering requires `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY` or equivalent public embed key configuration.
- Existing persisted entries may have coordinates but no reduced place payload; the detail must still build a useful query from address/location fields.
- The public detail must not leak server-only Google Maps API keys into client-rendered code.

## Completion Gates
- Targeted tests pass.
- `npm run typecheck` passes.
- The detail page remains independent from the Mapbox marketplace surface.
- Any missing live embed key is documented as a configuration fallback, not a code failure.
