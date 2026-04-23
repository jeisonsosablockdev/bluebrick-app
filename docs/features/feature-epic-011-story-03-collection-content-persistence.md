# EPIC-011 Story 03: Editable Collection Content Persistence

## Summary
- Added the first schema slice for collection editor persistence in `marketplace_entries`.
- New editable off-chain columns:
  - `gallery_images_json`
  - `property_images_json`
  - `fractional_investment_summary`
  - `property_information`
  - `google_maps_place_json`
  - `updated_by`

## Notes
- `image_url` remains the immutable cover field and was not changed by this slice.
- Gallery and property images now have explicit, separate JSON storage with empty-array defaults.
- Textual editor fields remain nullable until bootstrap and manual editing slices populate them.
- Google Maps persistence remains a reduced JSON payload and is still separate from address text fields already present on the entry.
- Column comments were added to document the separation between editable marketplace content and historical snapshot evidence.

## Validation
- Added migration contract coverage for:
  - approved column names and types
  - immutable cover protection at the migration level
  - schema comments documenting editorial vs snapshot separation
