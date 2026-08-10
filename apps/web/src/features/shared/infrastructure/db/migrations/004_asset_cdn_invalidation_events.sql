CREATE TABLE IF NOT EXISTS asset_cdn_invalidation_events (
  id UUID PRIMARY KEY,
  actor_pubkey TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('manual', 'finalize-replace')),
  upload_id UUID REFERENCES asset_upload_contracts(upload_id) ON DELETE SET NULL,
  paths JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),
  provider_request_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS asset_cdn_invalidation_events_source_idx
  ON asset_cdn_invalidation_events(source);

CREATE INDEX IF NOT EXISTS asset_cdn_invalidation_events_status_idx
  ON asset_cdn_invalidation_events(status);

CREATE INDEX IF NOT EXISTS asset_cdn_invalidation_events_created_at_idx
  ON asset_cdn_invalidation_events(created_at);
