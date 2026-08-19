-- Migration 035: Archival RPC Endpoints Registry
-- SPEC-S02-C (EPIC-014): Provision and validate archival RPC endpoints
-- Providers: helius-archive (primary), alchemy-archive (secondary)
-- No self-hosted nodes per P3 business premise.

CREATE TABLE IF NOT EXISTS archival_rpc_endpoints (
  id                TEXT        PRIMARY KEY,
  name              TEXT        NOT NULL UNIQUE
    CONSTRAINT archival_rpc_endpoints_name_check
    CHECK (name IN ('helius-archive', 'alchemy-archive')),
  url               TEXT        NOT NULL,
  provider          TEXT        NOT NULL
    CONSTRAINT archival_rpc_endpoints_provider_check
    CHECK (provider IN ('helius', 'alchemy')),
  is_primary        BOOLEAN     NOT NULL DEFAULT false,
  is_active         BOOLEAN     NOT NULL DEFAULT true,
  min_ledger_slot   BIGINT,
  last_checked_at   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS archival_rpc_endpoints_active_primary_idx
  ON archival_rpc_endpoints (is_active, is_primary DESC);

COMMENT ON TABLE archival_rpc_endpoints IS
  'Registry of archival Solana RPC endpoints. Only Helius Archive (primary) and Alchemy Archive (secondary) are permitted. No self-hosted nodes.';

COMMENT ON COLUMN archival_rpc_endpoints.min_ledger_slot IS
  'Cached minimumLedgerSlot from last health check. Used to validate endpoint has full ledger retention for required slot range.';

COMMENT ON COLUMN archival_rpc_endpoints.name IS
  'Canonical identifier. Restricted to helius-archive and alchemy-archive only (P3 business premise).';

DROP TRIGGER IF EXISTS archival_rpc_endpoints_set_updated_at ON archival_rpc_endpoints;
CREATE TRIGGER archival_rpc_endpoints_set_updated_at
  BEFORE UPDATE ON archival_rpc_endpoints
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();
