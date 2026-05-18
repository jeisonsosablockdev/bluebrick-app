CREATE TABLE IF NOT EXISTS web_push_delivery_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key TEXT NOT NULL UNIQUE,
  notification_type TEXT NOT NULL,
  wallet_public_key TEXT NOT NULL REFERENCES account_wallet_identities(wallet_public_key) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  destination_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'completed_with_failures', 'failed')),
  total_subscriptions INTEGER NOT NULL DEFAULT 0,
  delivered_count INTEGER NOT NULL DEFAULT 0,
  pruned_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  created_by_type TEXT NOT NULL CHECK (created_by_type IN ('admin', 'system')),
  created_by_id TEXT NOT NULL,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS web_push_delivery_jobs_wallet_status_idx
  ON web_push_delivery_jobs (wallet_public_key, status, created_at DESC);

CREATE TABLE IF NOT EXISTS web_push_delivery_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES web_push_delivery_jobs(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES web_push_subscriptions(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('delivered', 'pruned', 'failed')),
  http_status INTEGER,
  error_code TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT web_push_delivery_attempts_job_subscription_uidx UNIQUE (job_id, subscription_id)
);

CREATE INDEX IF NOT EXISTS web_push_delivery_attempts_job_status_idx
  ON web_push_delivery_attempts (job_id, status, created_at DESC);
