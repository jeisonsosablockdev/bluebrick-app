CREATE TABLE IF NOT EXISTS stake_action_attempts (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  wallet_public_key TEXT NOT NULL,
  asset_address TEXT NOT NULL,
  collection_address TEXT NOT NULL,
  candy_machine_address TEXT NOT NULL,
  property_id TEXT NOT NULL REFERENCES marketplace_entries(id) ON DELETE RESTRICT,
  property_title TEXT NOT NULL,
  product_action TEXT NOT NULL CHECK (product_action IN ('stake', 'unstake')),
  prepared_tx_message_base64 TEXT NOT NULL,
  tx_signature TEXT UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('prepared', 'submitted', 'validated', 'reconcile_pending', 'rejected', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS stake_action_attempts_wallet_created_idx
  ON stake_action_attempts (wallet_public_key, created_at DESC);

CREATE INDEX IF NOT EXISTS stake_action_attempts_asset_created_idx
  ON stake_action_attempts (asset_address, created_at DESC);

CREATE INDEX IF NOT EXISTS stake_action_attempts_status_created_idx
  ON stake_action_attempts (status, created_at DESC);

CREATE TABLE IF NOT EXISTS user_profile_stake_events (
  id TEXT PRIMARY KEY,
  webhook_event_id TEXT REFERENCES webhook_events(id) ON DELETE SET NULL,
  asset_address TEXT NOT NULL,
  owner_wallet TEXT NOT NULL,
  collection_address TEXT NOT NULL,
  candy_machine_address TEXT NOT NULL,
  property_id TEXT NOT NULL REFERENCES marketplace_entries(id) ON DELETE RESTRICT,
  property_title TEXT NOT NULL,
  product_action TEXT NOT NULL CHECK (product_action IN ('stake', 'unstake')),
  blockchain_action TEXT NOT NULL CHECK (blockchain_action IN ('freeze', 'unfreeze')),
  tx_signature TEXT NOT NULL,
  instruction_index INTEGER NOT NULL DEFAULT 0 CHECK (instruction_index >= 0),
  slot BIGINT,
  canonical_timezone TEXT NOT NULL DEFAULT 'America/Bogota',
  block_time TIMESTAMPTZ,
  observed_at TIMESTAMPTZ NOT NULL,
  validation_status TEXT NOT NULL CHECK (validation_status IN ('pending', 'validated', 'reconcile_pending', 'rejected')),
  validation_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_profile_stake_events_signature_asset_action_uidx
  ON user_profile_stake_events (tx_signature, asset_address, blockchain_action, instruction_index);

CREATE INDEX IF NOT EXISTS user_profile_stake_events_owner_time_idx
  ON user_profile_stake_events (owner_wallet, COALESCE(block_time, observed_at) DESC);

CREATE INDEX IF NOT EXISTS user_profile_stake_events_validation_idx
  ON user_profile_stake_events (validation_status, observed_at DESC);

COMMENT ON TABLE stake_action_attempts IS
  'Prepared and submitted stake/unstake attempts used to correlate wallet-signed transactions with Helius webhook observations.';

COMMENT ON TABLE user_profile_stake_events IS
  'Derived user-profile projection for BRIDS stake/unstake history, sourced from wallet-authenticated attempts and canonically revalidated webhook observations.';

DROP TRIGGER IF EXISTS stake_action_attempts_set_updated_at ON stake_action_attempts;
CREATE TRIGGER stake_action_attempts_set_updated_at
BEFORE UPDATE ON stake_action_attempts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();

