CREATE TABLE IF NOT EXISTS mint_jobs (
  id TEXT PRIMARY KEY,
  emission_id TEXT NOT NULL UNIQUE,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('queued', 'preparing', 'signing', 'submitting', 'confirming', 'partial', 'completed', 'failed')),
  total_items INTEGER NOT NULL CHECK (total_items > 0),
  prepared_items INTEGER NOT NULL DEFAULT 0 CHECK (prepared_items >= 0),
  submitted_items INTEGER NOT NULL DEFAULT 0 CHECK (submitted_items >= 0),
  confirmed_items INTEGER NOT NULL DEFAULT 0 CHECK (confirmed_items >= 0),
  failed_items INTEGER NOT NULL DEFAULT 0 CHECK (failed_items >= 0),
  collection_address TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mint_job_batches (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES mint_jobs(id) ON DELETE CASCADE,
  batch_no INTEGER NOT NULL CHECK (batch_no > 0),
  batch_token TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('prepared', 'submitted', 'confirming', 'confirmed', 'partial', 'failed')),
  prepared_count INTEGER NOT NULL DEFAULT 0 CHECK (prepared_count >= 0),
  submitted_count INTEGER NOT NULL DEFAULT 0 CHECK (submitted_count >= 0),
  confirmed_count INTEGER NOT NULL DEFAULT 0 CHECK (confirmed_count >= 0),
  failed_count INTEGER NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, batch_no),
  UNIQUE (job_id, batch_token)
);

CREATE TABLE IF NOT EXISTS mint_job_items (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES mint_jobs(id) ON DELETE CASCADE,
  batch_id TEXT REFERENCES mint_job_batches(id) ON DELETE SET NULL,
  serial_no INTEGER NOT NULL CHECK (serial_no > 0),
  asset_pubkey TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'prepared', 'submitted', 'confirmed', 'failed')),
  signature TEXT,
  last_error TEXT,
  submitted_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, serial_no),
  UNIQUE (job_id, asset_pubkey)
);

CREATE TABLE IF NOT EXISTS mint_item_signatures (
  id TEXT PRIMARY KEY,
  job_item_id TEXT NOT NULL REFERENCES mint_job_items(id) ON DELETE CASCADE,
  batch_id TEXT REFERENCES mint_job_batches(id) ON DELETE SET NULL,
  signature TEXT NOT NULL UNIQUE,
  confirmation_status TEXT NOT NULL CHECK (confirmation_status IN ('submitted', 'confirmed', 'failed')),
  slot BIGINT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  event_id TEXT,
  event_fingerprint TEXT NOT NULL,
  signature TEXT,
  event_type TEXT,
  slot BIGINT,
  payload JSONB NOT NULL,
  processing_status TEXT NOT NULL DEFAULT 'received' CHECK (processing_status IN ('received', 'processed', 'failed')),
  error_message TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  UNIQUE (provider, event_fingerprint)
);

CREATE UNIQUE INDEX IF NOT EXISTS webhook_events_provider_event_id_unique
  ON webhook_events(provider, event_id)
  WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS mint_jobs_status_idx ON mint_jobs(status);
CREATE INDEX IF NOT EXISTS mint_job_batches_job_id_idx ON mint_job_batches(job_id);
CREATE INDEX IF NOT EXISTS mint_job_batches_status_idx ON mint_job_batches(status);
CREATE INDEX IF NOT EXISTS mint_job_items_job_id_idx ON mint_job_items(job_id);
CREATE INDEX IF NOT EXISTS mint_job_items_status_idx ON mint_job_items(status);
CREATE INDEX IF NOT EXISTS mint_job_items_signature_idx ON mint_job_items(signature);
CREATE INDEX IF NOT EXISTS mint_item_signatures_job_item_id_idx ON mint_item_signatures(job_item_id);
CREATE INDEX IF NOT EXISTS webhook_events_provider_signature_idx ON webhook_events(provider, signature);

CREATE OR REPLACE FUNCTION set_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mint_jobs_set_updated_at ON mint_jobs;
CREATE TRIGGER mint_jobs_set_updated_at
BEFORE UPDATE ON mint_jobs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();

DROP TRIGGER IF EXISTS mint_job_batches_set_updated_at ON mint_job_batches;
CREATE TRIGGER mint_job_batches_set_updated_at
BEFORE UPDATE ON mint_job_batches
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();

DROP TRIGGER IF EXISTS mint_job_items_set_updated_at ON mint_job_items;
CREATE TRIGGER mint_job_items_set_updated_at
BEFORE UPDATE ON mint_job_items
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();
