CREATE TABLE IF NOT EXISTS core_candy_machine_transaction_manifest (
  id TEXT PRIMARY KEY,
  flow_id TEXT NOT NULL,
  draft_id TEXT NOT NULL,
  created_by TEXT NOT NULL,
  collection_address TEXT NOT NULL,
  candy_machine_address TEXT NOT NULL,
  tx_index INTEGER NOT NULL CHECK (tx_index >= 0),
  tx_kind TEXT NOT NULL CHECK (
    tx_kind IN (
      'create-collection',
      'create-candy-machine',
      'add-config-lines',
      'mint',
      'add-app-data-plugin',
      'write-app-data',
      'add-owner-freeze-plugin'
    )
  ),
  serial INTEGER CHECK (serial IS NULL OR serial > 0),
  expected_address TEXT,
  transaction_base64_hash TEXT NOT NULL,
  signed_transaction_base64_hash TEXT,
  signature TEXT,
  status TEXT NOT NULL CHECK (status IN ('prepared', 'signed', 'submitted', 'confirmed', 'failed')),
  slot BIGINT,
  error_json JSONB,
  prepared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  signed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (flow_id, tx_index)
);

CREATE INDEX IF NOT EXISTS core_cm_tx_manifest_flow_idx
  ON core_candy_machine_transaction_manifest(flow_id, tx_index);

CREATE INDEX IF NOT EXISTS core_cm_tx_manifest_collection_idx
  ON core_candy_machine_transaction_manifest(collection_address);

CREATE INDEX IF NOT EXISTS core_cm_tx_manifest_status_idx
  ON core_candy_machine_transaction_manifest(status);

CREATE UNIQUE INDEX IF NOT EXISTS core_cm_tx_manifest_signature_uidx
  ON core_candy_machine_transaction_manifest(signature)
  WHERE signature IS NOT NULL;

DROP TRIGGER IF EXISTS core_candy_machine_transaction_manifest_set_updated_at
  ON core_candy_machine_transaction_manifest;
CREATE TRIGGER core_candy_machine_transaction_manifest_set_updated_at
BEFORE UPDATE ON core_candy_machine_transaction_manifest
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();
