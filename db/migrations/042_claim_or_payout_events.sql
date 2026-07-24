-- Migration 042: Immutable Audit Log for Claims, Squads Payouts & Compliance Events
-- SPEC-S04-C (EPIC-014): Full audit trail for distribution claims, Squads batch lifecycle, and compliance clawbacks

CREATE TABLE IF NOT EXISTS claim_or_payout_events (
  id            TEXT        PRIMARY KEY,
  event_type    TEXT        NOT NULL
    CONSTRAINT claim_or_payout_events_type_check
    CHECK (event_type IN (
      'STAKE', 'UNSTAKE', 'DISTRIBUTION_CALCULATED', 'CLAIM_QUOTED', 'CLAIM_REQUESTED',
      'BATCH_PROPOSED', 'COMMITTEE_REVIEW', 'BATCH_APPROVED', 'BATCH_REJECTED',
      'BATCH_EXECUTING', 'BATCH_EXECUTED', 'BATCH_PARTIALLY_FAILED', 'CLAIM_EXECUTED',
      'CLAIM_FAILED', 'CLAWBACK_TTL_EXPIRED', 'PAYOUT_WALLET_OVERRIDE'
    )),
  claim_id      TEXT        REFERENCES distribution_claims(id) ON DELETE SET NULL,
  batch_id      TEXT        REFERENCES squads_payout_batches(id) ON DELETE SET NULL,
  run_id        TEXT        REFERENCES distribution_runs(id) ON DELETE SET NULL,
  wallet        TEXT,
  amount_minor  BIGINT      CHECK (amount_minor >= 0),
  token_mint    TEXT,
  reason        TEXT,
  metadata      JSONB       DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS claim_or_payout_events_type_idx
  ON claim_or_payout_events (event_type);

CREATE INDEX IF NOT EXISTS claim_or_payout_events_claim_idx
  ON claim_or_payout_events (claim_id)
  WHERE claim_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS claim_or_payout_events_batch_idx
  ON claim_or_payout_events (batch_id)
  WHERE batch_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS claim_or_payout_events_wallet_idx
  ON claim_or_payout_events (wallet)
  WHERE wallet IS NOT NULL;

CREATE INDEX IF NOT EXISTS claim_or_payout_events_run_idx
  ON claim_or_payout_events (run_id)
  WHERE run_id IS NOT NULL;

COMMENT ON TABLE claim_or_payout_events IS
  'Immutable audit log of all stake, claim lifecycle, Squads multisig execution, and compliance events.';
