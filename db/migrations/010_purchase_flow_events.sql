CREATE TABLE IF NOT EXISTS purchase_flow_events (
  id TEXT PRIMARY KEY,
  flow_id TEXT NOT NULL,
  endpoint TEXT NOT NULL CHECK (endpoint IN ('quote', 'challenge', 'prepare', 'submit')),
  phase TEXT NOT NULL CHECK (phase IN ('request', 'success', 'error')),
  wallet_public_key TEXT,
  property_id TEXT,
  attempt_id TEXT,
  idempotency_key TEXT,
  status_code INTEGER,
  error_code TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS purchase_flow_events_flow_created_idx
  ON purchase_flow_events(flow_id, created_at ASC);

CREATE INDEX IF NOT EXISTS purchase_flow_events_wallet_created_idx
  ON purchase_flow_events(wallet_public_key, created_at DESC);
