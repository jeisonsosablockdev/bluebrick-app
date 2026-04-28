ALTER TABLE marketplace_entries
  ADD COLUMN IF NOT EXISTS state_province TEXT,
  ADD COLUMN IF NOT EXISTS geo_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS geo_lng DOUBLE PRECISION;

COMMENT ON COLUMN marketplace_entries.state_province IS
  'Canonical state or province for the admin location form parity flow.';

COMMENT ON COLUMN marketplace_entries.geo_lat IS
  'Canonical latitude for the admin location form parity flow.';

COMMENT ON COLUMN marketplace_entries.geo_lng IS
  'Canonical longitude for the admin location form parity flow.';
