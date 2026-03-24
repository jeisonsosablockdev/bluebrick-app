CREATE TABLE IF NOT EXISTS purchase_attempts (
  id TEXT PRIMARY KEY,
  property_id TEXT NOT NULL,
  wallet_public_key TEXT NOT NULL,
  candy_machine_address TEXT NOT NULL,
  collection_address TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  quoted_price_lamports BIGINT,
  prepared_price_lamports BIGINT NOT NULL CHECK (prepared_price_lamports >= 0),
  cache_updated_at TIMESTAMPTZ,
  prepared_tx_message_b64 TEXT NOT NULL,
  tx_signature TEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('prepared', 'submitted', 'failed')),
  error_code TEXT,
  error_message TEXT,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS purchase_attempts_wallet_public_key_idx
  ON purchase_attempts(wallet_public_key);

CREATE INDEX IF NOT EXISTS purchase_attempts_candy_machine_address_idx
  ON purchase_attempts(candy_machine_address);

CREATE INDEX IF NOT EXISTS purchase_attempts_status_idx
  ON purchase_attempts(status);

CREATE INDEX IF NOT EXISTS purchase_attempts_created_at_idx
  ON purchase_attempts(created_at DESC);

DROP TRIGGER IF EXISTS purchase_attempts_set_updated_at ON purchase_attempts;
CREATE TRIGGER purchase_attempts_set_updated_at
BEFORE UPDATE ON purchase_attempts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();
