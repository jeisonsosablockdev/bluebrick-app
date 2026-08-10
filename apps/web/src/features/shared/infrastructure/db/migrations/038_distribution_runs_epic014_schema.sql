-- Migration 038: Distribution Engine EPIC-014 Schema Alignment
-- SPEC-S03-A (EPIC-014): Configure Distribution Snapshot & Asset Resolution fields

-- Add EPIC-014 snapshot parameters to distribution_runs
ALTER TABLE distribution_runs
  ADD COLUMN IF NOT EXISTS scope_type TEXT DEFAULT 'candy_machine',
  ADD COLUMN IF NOT EXISTS scope_address TEXT,
  ADD COLUMN IF NOT EXISTS candy_machine_address TEXT,
  ADD COLUMN IF NOT EXISTS eligibility_start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS eligibility_end_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS snapshot_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS available_treasury_earnings_minor BIGINT,
  ADD COLUMN IF NOT EXISTS distribution_pool_amount_minor BIGINT,
  ADD COLUMN IF NOT EXISTS pool_composition_basis TEXT DEFAULT 'equal_eligible_nft_count',
  ADD COLUMN IF NOT EXISTS final_rpc_commitment TEXT DEFAULT 'finalized',
  ADD COLUMN IF NOT EXISTS final_rpc_context_slot BIGINT,
  ADD COLUMN IF NOT EXISTS final_rpc_snapshot_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS unsold_inventory_policy TEXT DEFAULT 'exclude_unsold',
  ADD COLUMN IF NOT EXISTS investment_model TEXT,
  ADD COLUMN IF NOT EXISTS treasury_vault TEXT,
  ADD COLUMN IF NOT EXISTS rounding_remainder_minor BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_pool_time_weight_seconds BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS committee_review_status TEXT,
  ADD COLUMN IF NOT EXISTS committee_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS committee_approval_evidence JSONB;

-- Drop old strict status check to allow EPIC-014 state machine
ALTER TABLE distribution_runs DROP CONSTRAINT IF EXISTS distribution_runs_status_check;
ALTER TABLE distribution_runs ADD CONSTRAINT distribution_runs_status_check
  CHECK (status IN (
    'draft', 'calculating', 'ready_for_review', 'committee_review',
    'committee_rejected', 'approved_for_dispersion', 'executing',
    'executed', 'finalized', 'final', 'blocked', 'failed'
  ));

-- Add EPIC-014 calculation breakdown fields to distribution_items
ALTER TABLE distribution_items
  ADD COLUMN IF NOT EXISTS beneficiary_wallet TEXT,
  ADD COLUMN IF NOT EXISTS earning_start_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS earning_end_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS earning_seconds BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS asset_time_weight BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS wallet_time_weight BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pool_time_weight BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gross_amount_minor BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fee_amount_minor BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_amount_minor BIGINT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS claim_fee_policy_id TEXT,
  ADD COLUMN IF NOT EXISTS claim_fee_policy_version TEXT,
  ADD COLUMN IF NOT EXISTS compliance_snapshot TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'calculated',
  ADD COLUMN IF NOT EXISTS evidence_refs JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS distribution_runs_scope_address_idx
  ON distribution_runs (scope_address)
  WHERE scope_address IS NOT NULL;

CREATE INDEX IF NOT EXISTS distribution_items_beneficiary_wallet_idx
  ON distribution_items (run_id, beneficiary_wallet)
  WHERE beneficiary_wallet IS NOT NULL;

COMMENT ON COLUMN distribution_runs.scope_type IS
  'Financial scope for distribution. Strictly candy_machine in v1 (collection is never financial scope).';

COMMENT ON COLUMN distribution_runs.scope_address IS
  'Address of approved Candy Machine for the project. Sourced from project_candy_machine_sources.';

COMMENT ON COLUMN distribution_items.compliance_snapshot IS
  'Wallet compliance state at snapshot time (fully_verified, restricted_aml, suspended, etc.).';
