ALTER TABLE marketplace_entries
  ADD COLUMN IF NOT EXISTS gallery_images_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS property_images_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS fractional_investment_summary TEXT,
  ADD COLUMN IF NOT EXISTS property_information TEXT,
  ADD COLUMN IF NOT EXISTS google_maps_place_json JSONB,
  ADD COLUMN IF NOT EXISTS updated_by TEXT;

COMMENT ON COLUMN marketplace_entries.gallery_images_json IS
  'Editable marketplace gallery images. Distinct from the immutable cover image and historical snapshot evidence.';

COMMENT ON COLUMN marketplace_entries.property_images_json IS
  'Editable marketplace property images. Distinct from gallery_images_json and historical snapshot evidence.';

COMMENT ON COLUMN marketplace_entries.fractional_investment_summary IS
  'Editable long-form investment summary for admin collections.';

COMMENT ON COLUMN marketplace_entries.property_information IS
  'Editable long-form property information for admin collections.';

COMMENT ON COLUMN marketplace_entries.google_maps_place_json IS
  'Reduced Google Maps payload for admin collections. Complements address text without replacing historical snapshot evidence.';

COMMENT ON COLUMN marketplace_entries.updated_by IS
  'Last admin or process that updated editable marketplace collection content.';
