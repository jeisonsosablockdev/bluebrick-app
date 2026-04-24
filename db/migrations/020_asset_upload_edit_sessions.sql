ALTER TABLE asset_upload_contracts
  ADD COLUMN IF NOT EXISTS edit_session_id UUID,
  ADD COLUMN IF NOT EXISTS promoted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS promoted_by TEXT,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS canceled_by TEXT;

DO $$
BEGIN
  ALTER TABLE asset_upload_contracts
    ADD CONSTRAINT asset_upload_contracts_promoted_requires_finalize_chk
    CHECK (promoted_at IS NULL OR finalized_at IS NOT NULL);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS asset_upload_contracts_edit_session_id_idx
  ON asset_upload_contracts(edit_session_id);

CREATE INDEX IF NOT EXISTS asset_upload_contracts_promoted_at_idx
  ON asset_upload_contracts(promoted_at);

CREATE INDEX IF NOT EXISTS asset_upload_contracts_canceled_at_idx
  ON asset_upload_contracts(canceled_at);

COMMENT ON COLUMN asset_upload_contracts.edit_session_id IS
  'Temporary edit-session identifier for collection-editor uploads before promotion on save.';

COMMENT ON COLUMN asset_upload_contracts.promoted_at IS
  'Timestamp when a temporary edit-session upload was promoted and must be retained.';

COMMENT ON COLUMN asset_upload_contracts.promoted_by IS
  'Admin wallet that promoted the edit-session upload during a successful save.';

COMMENT ON COLUMN asset_upload_contracts.canceled_at IS
  'Timestamp when an edit session was explicitly canceled, making unpromoted uploads eligible for cleanup.';

COMMENT ON COLUMN asset_upload_contracts.canceled_by IS
  'Admin wallet that canceled the edit session owning the temporary upload.';
