# Fix Note: Marketplace Detail Google Maps Preview (BRI-164)

## Status
- Implementation slice
- Parent issue: `BRI-164`
- Mother/integration branch: `feature/app-create-a-marketplace-3d-visual-bri-164-integration`
- Slice branch: `fix/app-marketplace-detail-google-maps-bri-164-s08-detail-map`

## Summary
Restore the Google Maps preview on marketplace property detail pages without adding the Mapbox 3D marketplace experience to the detail route.

The `/marketplace` discovery page keeps the Mapbox-driven 3D/list state machine. The detail route remains a traditional property detail entry, but it should show the Google Maps place/address preview already captured by the admin location flow.

## Problem
The marketplace detail page currently shows textual location data but does not render the Google Maps preview. This breaks the expected continuity from admin item creation, where a property can have canonical location fields, coordinates, and a reduced Google Maps place payload.

## Scope
- `/marketplace/[id]` detail rendering.
- Public marketplace read model for persisted Google Maps place data.
- Google Maps embed/outbound URL construction for property detail.
- Tests proving the detail page renders a map iframe when embeddable data and public embed key exist.
- Fallback link when Google Maps embed configuration is unavailable.

## Non-Goals
- No Mapbox map or 3D state machine on the detail page.
- No marketplace list/layout behavior change.
- No wallet, auth, checkout, or on-chain behavior change.
- No Google Maps autocomplete changes.
- No database schema migration; this uses the existing `marketplace_entries.google_maps_place_json` column when present.

## Acceptance Criteria
- A detail property with `googleMapsPlace` and `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY` renders a Google Maps iframe.
- A detail property without a persisted place can still build a preview from canonical address/location fields when enough context exists.
- If the embed key is missing, the detail keeps a visible "Open in Google Maps" fallback instead of rendering a broken iframe.
- The public marketplace read model selects and normalizes `google_maps_place_json`.
- New marketplace creation preserves the Google Maps place payload when the admin creation form sends it.
- Existing marketplace Mapbox/list behavior is unchanged.

## Validation Direction
- Start with failing tests for detail component rendering and persisted place read-model projection.
- Run targeted tests for marketplace detail, location view helpers, and marketplace persistence.
- Run typecheck.
- Capture browser evidence if the local environment has a valid `NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY`.
