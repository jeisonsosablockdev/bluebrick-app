-- Migration 040: Distribution Claims & Compliance Hold Registry
-- SPEC-S04-B (EPIC-014): User claim quotes, locked fee versions, and compliance gate status

CREATE TABLE IF NOT EXISTS distribution_claims (
  id                        TEXT        PRIMARY KEY,
  run_id                    TEXT        NOT NULL REFERENCES distribution_runs(id) ON DELETE RESTRICT,
  item_id                   TEXT        NOT NULL REFERENCES distribution_items(id) ON DELETE RESTRICT,
  wallet_public_key         TEXT        NOT NULL,
  payout_wallet             TEXT        NOT NULL,
  gross_amount_minor        BIGINT      NOT NULL CHECK (gross_amount_minor >= 0),
  fee_amount_minor          BIGINT      NOT NULL CHECK (fee_amount_minor >= 0),
  net_amount_minor          BIGINT      NOT NULL CHECK (net_amount_minor >= 0),
  claim_fee_policy_id       TEXT        REFERENCES claim_fee_policies(id),
  claim_fee_policy_version  INTEGER     NOT NULL DEFAULT 1,
  status                    TEXT        NOT NULL
    CONSTRAINT distribution_claims_status_check
    CHECK (status IN (
      'quote_created', 'claim_requested', 'compliance_hold',
      'approved_for_dispersion', 'executing', 'executed',
      'failed', 'expired', 'clawback_to_treasury'
    )),
  quote_expires_at          TIMESTAMPTZ NOT NULL,
  compliance_hold_at        TIMESTAMPTZ,
  confirmed_at              TIMESTAMPTZ,
  payout_override_evidence  JSONB,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT distribution_claims_gross_net_check CHECK (gross_amount_minor = fee_amount_minor + net_amount_minor)
);

CREATE UNIQUE INDEX IF NOT EXISTS distribution_claims_wallet_run_active_uidx
  ON distribution_claims (wallet_public_key, run_id)
  WHERE status NOT IN ('expired', 'failed');

CREATE INDEX IF NOT EXISTS distribution_claims_status_expires_idx
  ON distribution_claims (status, quote_expires_at);

COMMENT ON TABLE distribution_claims IS
  'Locked user claim quotes and active dispersion status for yield distributions.';

DROP TRIGGER IF EXISTS distribution_claims_set_updated_at ON distribution_claims;
CREATE TRIGGER distribution_claims_set_updated_at
  BEFORE UPDATE ON distribution_claims
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at_column();
