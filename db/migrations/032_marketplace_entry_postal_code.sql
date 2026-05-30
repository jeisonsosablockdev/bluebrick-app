ALTER TABLE marketplace_entries
  ADD COLUMN IF NOT EXISTS postal_code TEXT;

COMMENT ON COLUMN marketplace_entries.postal_code IS
  'Canonical postal or ZIP code for admin location editing and marketplace display.';
