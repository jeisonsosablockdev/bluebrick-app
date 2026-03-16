CREATE TABLE IF NOT EXISTS asset_import_jobs (
  id UUID PRIMARY KEY,
  actor_pubkey TEXT NOT NULL,
  draft_id UUID,
  idempotency_key TEXT,
  source_file_name TEXT NOT NULL,
  source_mime_type TEXT NOT NULL,
  source_size_bytes BIGINT NOT NULL CHECK (source_size_bytes > 0),
  state TEXT NOT NULL CHECK (
    state IN ('queued', 'processing', 'completed', 'completed_with_errors', 'failed', 'delayed')
  ),
  total_rows INTEGER NOT NULL CHECK (total_rows >= 0),
  processed_rows INTEGER NOT NULL DEFAULT 0 CHECK (processed_rows >= 0),
  failed_rows INTEGER NOT NULL DEFAULT 0 CHECK (failed_rows >= 0),
  warnings_count INTEGER NOT NULL DEFAULT 0 CHECK (warnings_count >= 0),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 3 CHECK (max_attempts >= 1 AND max_attempts <= 10),
  last_error TEXT,
  error_report_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  last_transition_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS asset_import_jobs_actor_idempotency_unique
  ON asset_import_jobs(actor_pubkey, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS asset_import_jobs_actor_created_idx
  ON asset_import_jobs(actor_pubkey, created_at DESC);
CREATE INDEX IF NOT EXISTS asset_import_jobs_state_idx
  ON asset_import_jobs(state, created_at DESC);

CREATE TABLE IF NOT EXISTS asset_import_job_rows (
  id BIGSERIAL PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES asset_import_jobs(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL CHECK (row_number > 0),
  row_data JSONB NOT NULL,
  validation_status TEXT NOT NULL DEFAULT 'pending' CHECK (
    validation_status IN ('pending', 'valid', 'invalid', 'committed')
  ),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, row_number)
);

CREATE INDEX IF NOT EXISTS asset_import_job_rows_job_status_idx
  ON asset_import_job_rows(job_id, validation_status, row_number);

CREATE TABLE IF NOT EXISTS asset_import_job_errors (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES asset_import_jobs(id) ON DELETE CASCADE,
  row_number INTEGER,
  column_name TEXT,
  error_code TEXT NOT NULL,
  error_message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS asset_import_job_errors_job_idx
  ON asset_import_job_errors(job_id, row_number, created_at DESC);

CREATE TABLE IF NOT EXISTS asset_import_job_dlq (
  id UUID PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES asset_import_jobs(id) ON DELETE CASCADE,
  attempt_count INTEGER NOT NULL,
  reason TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS asset_import_job_dlq_job_idx
  ON asset_import_job_dlq(job_id, created_at DESC);

DROP TRIGGER IF EXISTS asset_import_jobs_set_updated_at ON asset_import_jobs;
CREATE TRIGGER asset_import_jobs_set_updated_at
BEFORE UPDATE ON asset_import_jobs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();
