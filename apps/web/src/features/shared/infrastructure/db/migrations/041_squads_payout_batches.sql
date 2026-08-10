-- Migration 041: Squads Treasury Execution & Payout Batches Schema
-- SPEC-S04-C (EPIC-014): Squads v4 multisig batch payout execution, PDA tracking, and leg capping

-- Update status constraint on distribution_claims to align with full EPIC-014 claim lifecycle state machine
ALTER TABLE distribution_claims DROP CONSTRAINT IF EXISTS distribution_claims_status_check;
ALTER TABLE distribution_claims ADD CONSTRAINT distribution_claims_status_check
  CHECK (status IN (
    'quote_created', 'claim_requested', 'compliance_hold',
    'approved_for_dispersion', 'queued_for_payout', 'squads_proposed',
    'executing', 'executed', 'failed', 'expired',
    'compliance_hold_expired', 'clawback_to_treasury'
  ));

CREATE TABLE IF NOT EXISTS squads_payout_batches (
  id                        TEXT        PRIMARY KEY,
  project_id                TEXT        NOT NULL,
  run_id                    TEXT        NOT NULL REFERENCES distribution_runs(id) ON DELETE RESTRICT,
  token_mint                TEXT        NOT NULL,
  treasury_vault            TEXT        NOT NULL,
  squads_multisig_pda       TEXT,
  squads_vault_pda          TEXT,
  proposal_pda              TEXT,
  batch_pda                 TEXT,
  transaction_index         BIGINT,
  status                    TEXT        NOT NULL
    CONSTRAINT squads_payout_batches_status_check
    CHECK (status IN (
      'draft', 'proposed', 'approving', 'approved_for_execution',
      'executing', 'executed', 'partially_failed', 'failed', 'rejected'
    )),
  total_amount_minor        BIGINT      NOT NULL CHECK (total_amount_minor >= 0),
  total_fees_minor          BIGINT      NOT NULL DEFAULT 0 CHECK (total_fees_minor >= 0),
  item_count                INTEGER     NOT NULL CHECK (item_count >= 0),
  successful_count          INTEGER     NOT NULL DEFAULT 0 CHECK (successful_count >= 0),
  failed_count              INTEGER     NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
  creator                   TEXT        NOT NULL,
  approvers                 JSONB       DEFAULT '[]'::jsonb,
  executor                  TEXT,
  execution_signature       TEXT,
  execution_slot            BIGINT,
  execution_block_time      TIMESTAMPTZ,
  rejection_reason          TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS squads_payout_batches_run_idx
  ON squads_payout_batches (run_id);

CREATE INDEX IF NOT EXISTS squads_payout_batches_project_idx
  ON squads_payout_batches (project_id);

CREATE INDEX IF NOT EXISTS squads_payout_batches_status_idx
  ON squads_payout_batches (status);

COMMENT ON TABLE squads_payout_batches IS
  'Squads v4 treasury payout batch proposals. Max 20 legs per proposal to avoid CU overflow.';

DROP TRIGGER IF EXISTS squads_payout_batches_set_updated_at ON squads_payout_batches;
CREATE TRIGGER squads_payout_batches_set_updated_at
  BEFORE UPDATE ON squads_payout_batches
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();

CREATE TABLE IF NOT EXISTS squads_payout_batch_items (
  id                        TEXT        PRIMARY KEY,
  batch_id                  TEXT        NOT NULL REFERENCES squads_payout_batches(id) ON DELETE CASCADE,
  claim_id                  TEXT        NOT NULL REFERENCES distribution_claims(id) ON DELETE RESTRICT,
  instruction_index         INTEGER     NOT NULL CHECK (instruction_index >= 0),
  recipient_token_account   TEXT        NOT NULL,
  recipient_wallet          TEXT        NOT NULL,
  amount_minor              BIGINT      NOT NULL CHECK (amount_minor >= 0),
  transfer_signature        TEXT,
  execution_slot            BIGINT,
  execution_block_time      TIMESTAMPTZ,
  status                    TEXT        NOT NULL
    CONSTRAINT squads_payout_batch_items_status_check
    CHECK (status IN ('pending', 'executed', 'failed')) DEFAULT 'pending',
  failure_reason            TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS squads_payout_batch_items_batch_idx
  ON squads_payout_batch_items (batch_id);

CREATE INDEX IF NOT EXISTS squads_payout_batch_items_claim_idx
  ON squads_payout_batch_items (claim_id);

COMMENT ON TABLE squads_payout_batch_items IS
  'Individual transfer leg items inside a Squads payout batch.';

DROP TRIGGER IF EXISTS squads_payout_batch_items_set_updated_at ON squads_payout_batch_items;
CREATE TRIGGER squads_payout_batch_items_set_updated_at
  BEFORE UPDATE ON squads_payout_batch_items
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();
