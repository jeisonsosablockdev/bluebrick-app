CREATE TABLE IF NOT EXISTS admin_push_campaigns (
  id UUID PRIMARY KEY,
  actor_pubkey TEXT NOT NULL,
  message_class TEXT NOT NULL CHECK (message_class IN ('product_update', 'compliance_update', 'ops_notice')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  destination_url TEXT,
  segment_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  audience_summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  audience_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('previewed', 'blocked', 'queued')),
  eligible_wallet_count INTEGER NOT NULL DEFAULT 0,
  eligible_subscription_count INTEGER NOT NULL DEFAULT 0,
  excluded_wallet_count INTEGER NOT NULL DEFAULT 0,
  queued_job_count INTEGER NOT NULL DEFAULT 0,
  reason_codes TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  queued_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS admin_push_campaigns_actor_created_idx
  ON admin_push_campaigns (actor_pubkey, created_at DESC);

CREATE INDEX IF NOT EXISTS admin_push_campaigns_status_created_idx
  ON admin_push_campaigns (status, created_at DESC);
