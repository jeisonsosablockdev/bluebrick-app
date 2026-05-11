CREATE TABLE IF NOT EXISTS account_referral_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  attribution_source TEXT NOT NULL CHECK (attribution_source IN ('link', 'manual', 'deep_link', 'unknown')),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN (
    'active',
    'promoted',
    'discarded_invalid_code',
    'discarded_self_referral',
    'discarded_wallet_already_attributed'
  )),
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  resolved_at TIMESTAMPTZ,
  promoted_attribution_id UUID REFERENCES referral_attributions(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS account_referral_intents_active_account_uidx
  ON account_referral_intents (account_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS account_referral_intents_account_captured_idx
  ON account_referral_intents (account_id, captured_at DESC);

CREATE INDEX IF NOT EXISTS account_referral_intents_status_idx
  ON account_referral_intents (status, captured_at DESC);
