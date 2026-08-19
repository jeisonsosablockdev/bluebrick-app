CREATE TABLE IF NOT EXISTS asset_mint_snapshots (
  id TEXT PRIMARY KEY,
  mint_job_id TEXT NOT NULL UNIQUE REFERENCES mint_jobs(id) ON DELETE RESTRICT,
  draft_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  collection_address TEXT NOT NULL,
  candy_machine_address TEXT NOT NULL,
  expected_quantity INTEGER NOT NULL CHECK (expected_quantity > 0),
  form_snapshot JSONB NOT NULL,
  blockchain_snapshot JSONB NOT NULL,
  verification_method TEXT NOT NULL CHECK (verification_method IN ('das_get_assets_by_group', 'candy_machine_items_loaded')),
  verification_status TEXT NOT NULL CHECK (verification_status IN ('verified', 'failed', 'degraded')),
  verification_error_json JSONB,
  verified_at TIMESTAMPTZ,
  marketplace_handoff_status TEXT NOT NULL CHECK (marketplace_handoff_status IN ('pending', 'ready', 'consumed', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS asset_mint_snapshots_collection_address_idx
  ON asset_mint_snapshots(collection_address);

CREATE INDEX IF NOT EXISTS asset_mint_snapshots_candy_machine_address_idx
  ON asset_mint_snapshots(candy_machine_address);

CREATE INDEX IF NOT EXISTS asset_mint_snapshots_verification_status_idx
  ON asset_mint_snapshots(verification_status);

CREATE INDEX IF NOT EXISTS asset_mint_snapshots_marketplace_handoff_status_idx
  ON asset_mint_snapshots(marketplace_handoff_status);

CREATE TABLE IF NOT EXISTS asset_mint_onchain_proofs (
  id TEXT PRIMARY KEY,
  snapshot_id TEXT NOT NULL REFERENCES asset_mint_snapshots(id) ON DELETE CASCADE,
  tx_kind TEXT NOT NULL CHECK (tx_kind IN ('create-collection', 'create-candy-machine', 'add-config-lines', 'mint')),
  tx_label TEXT NOT NULL,
  tx_signature TEXT NOT NULL,
  expected_address TEXT,
  confirmation_status TEXT NOT NULL CHECK (confirmation_status IN ('submitted', 'confirmed', 'failed')),
  slot BIGINT,
  tx_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (snapshot_id, tx_signature)
);

CREATE INDEX IF NOT EXISTS asset_mint_onchain_proofs_snapshot_id_idx
  ON asset_mint_onchain_proofs(snapshot_id);

CREATE INDEX IF NOT EXISTS asset_mint_onchain_proofs_confirmation_status_idx
  ON asset_mint_onchain_proofs(confirmation_status);

DROP TRIGGER IF EXISTS asset_mint_snapshots_set_updated_at ON asset_mint_snapshots;
CREATE TRIGGER asset_mint_snapshots_set_updated_at
BEFORE UPDATE ON asset_mint_snapshots
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();
