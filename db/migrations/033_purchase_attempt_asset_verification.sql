ALTER TABLE purchase_attempts
  ADD COLUMN IF NOT EXISTS expected_asset_addresses JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS verified_asset_addresses JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS asset_verification_status TEXT NOT NULL DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS asset_verification_error TEXT,
  ADD COLUMN IF NOT EXISTS asset_verification_checked_at TIMESTAMPTZ;

ALTER TABLE purchase_attempts
  ADD CONSTRAINT purchase_attempts_expected_asset_addresses_array
    CHECK (jsonb_typeof(expected_asset_addresses) = 'array'),
  ADD CONSTRAINT purchase_attempts_verified_asset_addresses_array
    CHECK (jsonb_typeof(verified_asset_addresses) = 'array'),
  ADD CONSTRAINT purchase_attempts_asset_verification_status_check
    CHECK (asset_verification_status IN ('not_required', 'pending', 'verified', 'failed'));

CREATE INDEX IF NOT EXISTS purchase_attempts_asset_verification_status_idx
  ON purchase_attempts (asset_verification_status);
