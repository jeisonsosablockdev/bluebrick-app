CREATE TABLE IF NOT EXISTS asset_upload_contracts (
  upload_id UUID PRIMARY KEY,
  actor_pubkey TEXT NOT NULL,
  draft_id UUID NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('galleryImage', 'propertyImage', 'brochureFile', 'legalDoc', 'financialDoc')),
  original_file_name TEXT NOT NULL,
  sanitized_file_name TEXT NOT NULL,
  object_key TEXT NOT NULL UNIQUE,
  bucket TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
  content_md5_base64 TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalized_at TIMESTAMPTZ,
  final_file_ref_id UUID
);

CREATE TABLE IF NOT EXISTS asset_uploaded_files (
  file_ref_id UUID PRIMARY KEY,
  upload_id UUID NOT NULL UNIQUE REFERENCES asset_upload_contracts(upload_id) ON DELETE CASCADE,
  actor_pubkey TEXT NOT NULL,
  draft_id UUID NOT NULL,
  bucket TEXT NOT NULL,
  object_key TEXT NOT NULL,
  cdn_url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL CHECK (size_bytes > 0),
  content_md5_base64 TEXT NOT NULL,
  etag TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE asset_upload_contracts
  ADD CONSTRAINT asset_upload_contracts_final_file_ref_id_fkey
  FOREIGN KEY (final_file_ref_id) REFERENCES asset_uploaded_files(file_ref_id)
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS asset_upload_contracts_draft_id_idx ON asset_upload_contracts(draft_id);
CREATE INDEX IF NOT EXISTS asset_upload_contracts_expires_at_idx ON asset_upload_contracts(expires_at);
CREATE INDEX IF NOT EXISTS asset_upload_contracts_created_at_idx ON asset_upload_contracts(created_at);
CREATE INDEX IF NOT EXISTS asset_uploaded_files_draft_id_idx ON asset_uploaded_files(draft_id);
CREATE INDEX IF NOT EXISTS asset_uploaded_files_created_at_idx ON asset_uploaded_files(created_at);
