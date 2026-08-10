-- Migration 039: Versioned Claim Fee Policies Engine
-- SPEC-S04-A (EPIC-014): Configurable, versioned fee policies with hierarchical scope (candy_machine > project > global)

CREATE TABLE IF NOT EXISTS claim_fee_policies (
  id                TEXT        PRIMARY KEY,
  scope_type        TEXT        NOT NULL
    CONSTRAINT claim_fee_policies_scope_type_check
    CHECK (scope_type IN ('global', 'project', 'candy_machine')),
  scope_address     TEXT        NOT NULL,
  token_mint        TEXT        NOT NULL,
  fee_mode          TEXT        NOT NULL
    CONSTRAINT claim_fee_policies_fee_mode_check
    CHECK (fee_mode IN ('flat', 'percentage')),
  flat_fee_minor    BIGINT      DEFAULT 0,
  percentage_bps    INTEGER     DEFAULT 0 CHECK (percentage_bps >= 0 AND percentage_bps <= 10000),
  min_fee_minor     BIGINT      DEFAULT 0,
  max_fee_minor     BIGINT,
  effective_from    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  effective_to      TIMESTAMPTZ,
  version           INTEGER     NOT NULL DEFAULT 1,
  is_active         BOOLEAN     NOT NULL DEFAULT true,
  created_by        TEXT        NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS claim_fee_policies_resolution_idx
  ON claim_fee_policies (scope_type, scope_address, token_mint, is_active, effective_from DESC);

-- Seed default global policy (0 fee default)
INSERT INTO claim_fee_policies (
  id, scope_type, scope_address, token_mint, fee_mode, flat_fee_minor,
  percentage_bps, min_fee_minor, effective_from, version, is_active, created_by
) VALUES (
  'policy_global_default', 'global', 'global', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  'flat', 0, 0, 0, NOW(), 1, true, 'system'
) ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE claim_fee_policies IS
  'Versioned claim fee policies. Hierarchy: candy_machine > project > global. Locked fee quotes reference specific version.';

DROP TRIGGER IF EXISTS claim_fee_policies_set_updated_at ON claim_fee_policies;
CREATE TRIGGER claim_fee_policies_set_updated_at
  BEFORE UPDATE ON claim_fee_policies
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();
