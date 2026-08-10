CREATE TABLE IF NOT EXISTS purchase_challenges (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  wallet_public_key TEXT NOT NULL,
  candy_machine_address TEXT NOT NULL,
  challenge_nonce TEXT NOT NULL UNIQUE,
  challenge_message TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('issued', 'consumed', 'failed', 'expired')),
  failure_reason TEXT,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS purchase_challenges_wallet_idx
  ON purchase_challenges(wallet_public_key);

CREATE INDEX IF NOT EXISTS purchase_challenges_property_idx
  ON purchase_challenges(property_id);

CREATE INDEX IF NOT EXISTS purchase_challenges_status_expires_idx
  ON purchase_challenges(status, expires_at);

DROP TRIGGER IF EXISTS purchase_challenges_set_updated_at ON purchase_challenges;
CREATE TRIGGER purchase_challenges_set_updated_at
BEFORE UPDATE ON purchase_challenges
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();

CREATE TABLE IF NOT EXISTS purchase_rate_limit_events (
  id TEXT PRIMARY KEY,
  endpoint TEXT NOT NULL CHECK (endpoint IN ('purchase_challenge', 'purchase_prepare')),
  wallet_public_key TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS purchase_rate_limit_events_endpoint_created_idx
  ON purchase_rate_limit_events(endpoint, created_at DESC);

CREATE INDEX IF NOT EXISTS purchase_rate_limit_events_wallet_endpoint_created_idx
  ON purchase_rate_limit_events(wallet_public_key, endpoint, created_at DESC);

CREATE INDEX IF NOT EXISTS purchase_rate_limit_events_ip_endpoint_created_idx
  ON purchase_rate_limit_events(ip_address, endpoint, created_at DESC);

ALTER TABLE purchase_attempts
  ADD COLUMN IF NOT EXISTS challenge_id TEXT;

ALTER TABLE purchase_attempts
  ADD COLUMN IF NOT EXISTS client_ip TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'purchase_attempts_challenge_id_fkey'
  ) THEN
    ALTER TABLE purchase_attempts
      ADD CONSTRAINT purchase_attempts_challenge_id_fkey
      FOREIGN KEY (challenge_id)
      REFERENCES purchase_challenges(id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS purchase_attempts_challenge_id_idx
  ON purchase_attempts(challenge_id);
