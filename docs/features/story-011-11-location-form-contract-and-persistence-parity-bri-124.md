# STORY-011-11 Location form contract and persistence parity

## Summary
- Extends the canonical admin collection location contract toward parity with `/admin/assets/new`.
- Adds explicit storage and read-model support for `stateProvince`, `geoLat`, and `geoLng`.

## Slice log
### BRI-126
- Added migration `021_marketplace_entry_location_form_fields.sql`.
- Extended `AdminCollectionContentRecord` and repository reads to surface:
  - `stateProvince`
  - `geoLat`
  - `geoLng`
- Preserved legacy compatibility by normalizing absent storage values to `null`.

### BRI-127
- Added shared canonical location-form normalization in `lib/admin/admin-collection-location-form.ts`.
- Country normalization now accepts ISO-2 or deterministic localized names from `COUNTRIES` and persists ISO-2 uppercase.
- `stateProvince` keeps visible business text, while deterministic division codes normalize to their readable names.
- `geoLat` and `geoLng` now share one range-validated decimal parser for future create/bootstrap/PATCH reuse.

### BRI-137
- Wired `POST /api/admin/marketplace/entries` to normalize canonical location input through the shared location-form contract.
- `/admin/assets/new` now sends `stateProvince`, `geoLat`, and `geoLng` when creating the marketplace entry.
- Marketplace-entry persistence now stores `state_province`, `geo_lat`, and `geo_lng` alongside the existing location fields.

### BRI-138
- Extended bootstrap/snapshot mapping to emit canonical location fields only when the snapshot contains enough valid data.
- Invalid or non-deterministic bootstrap location data now raises `location_form_invalid` and keeps the row in manual review instead of overwriting persisted location state.
- Repository bootstrap apply now persists canonical location fields when present in the bootstrap payload.

## Validation
- `npx vitest run tests/lib/collection-content-repository.test.ts tests/db/marketplace-entry-location-form-fields-migration.test.ts`
- `npm run typecheck`
