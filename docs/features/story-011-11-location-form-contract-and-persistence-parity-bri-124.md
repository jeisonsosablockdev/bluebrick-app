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

## Validation
- `npx vitest run tests/lib/collection-content-repository.test.ts tests/db/marketplace-entry-location-form-fields-migration.test.ts`
- `npm run typecheck`
