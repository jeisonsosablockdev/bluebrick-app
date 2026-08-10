CREATE TABLE IF NOT EXISTS purchase_webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  event_id TEXT,
  event_fingerprint TEXT NOT NULL,
  signature TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('confirmed', 'failed')),
  slot BIGINT,
  error_message TEXT,
  payload JSONB NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS purchase_webhook_events_provider_fingerprint_uidx
  ON purchase_webhook_events(provider, event_fingerprint);

CREATE UNIQUE INDEX IF NOT EXISTS purchase_webhook_events_provider_event_id_uidx
  ON purchase_webhook_events(provider, event_id)
  WHERE event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS purchase_webhook_events_signature_received_idx
  ON purchase_webhook_events(signature, received_at DESC);

CREATE INDEX IF NOT EXISTS purchase_webhook_events_status_received_idx
  ON purchase_webhook_events(status, received_at DESC);
