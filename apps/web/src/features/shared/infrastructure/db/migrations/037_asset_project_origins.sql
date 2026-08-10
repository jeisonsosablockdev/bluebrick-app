-- Migration 037: Mint Provenance & Candy Machine Origins Registry
-- SPEC-S02-B (EPIC-014): Link each eligible asset to its approved Candy Machine mint origin

CREATE TABLE IF NOT EXISTS project_candy_machine_sources (
  id                        TEXT        PRIMARY KEY,
  project_id                TEXT        NOT NULL UNIQUE,
  candy_machine_address     TEXT        NOT NULL UNIQUE,
  collection_address        TEXT,
  authorized_supply         INTEGER,
  nft_price_minor           BIGINT,
  minimum_sold_count        INTEGER,
  funding_threshold_minor   BIGINT,
  unsold_inventory_policy   TEXT        NOT NULL DEFAULT 'exclude_unsold'
    CONSTRAINT pcm_sources_unsold_policy_check
    CHECK (unsold_inventory_policy IN ('exclude_unsold', 'include_unsold')),
  mint_authority_frozen_at  TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS project_candy_machine_sources_cm_idx
  ON project_candy_machine_sources (candy_machine_address);

CREATE TABLE IF NOT EXISTS asset_project_origins (
  id                    TEXT        PRIMARY KEY,
  asset_address         TEXT        NOT NULL UNIQUE,
  project_id            TEXT        NOT NULL,
  collection_address    TEXT,
  candy_machine_address TEXT        NOT NULL,
  candy_guard_address   TEXT,
  mint_signature        TEXT,
  mint_slot             BIGINT,
  mint_block_time       TIMESTAMPTZ,
  minter_wallet         TEXT,
  sale_evidence         JSONB,
  provenance_source     TEXT        NOT NULL
    CONSTRAINT asset_project_origins_source_check
    CHECK (provenance_source IN ('captured_at_mint', 'parsed_transaction', 'admin_backfill')),
  provenance_status     TEXT        NOT NULL
    CONSTRAINT asset_project_origins_status_check
    CHECK (provenance_status IN ('validated', 'needs_review', 'rejected')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_asset_project_origins_pcm_source
    FOREIGN KEY (project_id) REFERENCES project_candy_machine_sources(project_id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS asset_project_origins_project_cm_idx
  ON asset_project_origins (project_id, candy_machine_address);

CREATE INDEX IF NOT EXISTS asset_project_origins_status_idx
  ON asset_project_origins (provenance_status);

COMMENT ON TABLE project_candy_machine_sources IS
  'Registry mapping each BRIDS project to exactly one approved Candy Machine source of truth.';

COMMENT ON TABLE asset_project_origins IS
  'Mint provenance records verifying which Candy Machine minted each NFT. Unvalidated assets (needs_review) are mathematically excluded from financial scope.';

DROP TRIGGER IF EXISTS project_candy_machine_sources_set_updated_at ON project_candy_machine_sources;
CREATE TRIGGER project_candy_machine_sources_set_updated_at
  BEFORE UPDATE ON project_candy_machine_sources
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();

DROP TRIGGER IF EXISTS asset_project_origins_set_updated_at ON asset_project_origins;
CREATE TRIGGER asset_project_origins_set_updated_at
  BEFORE UPDATE ON asset_project_origins
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();
