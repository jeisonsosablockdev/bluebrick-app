-- Migration: 023_referral_wallet_first_schema
-- Epic: EPIC-012
-- Slice: S01 referral schema alignment
-- Description:
--   Canonical referral schema aligned to the repo's wallet-first identity model,
--   reconciled NFT purchase pipeline, and existing compliance tables.

CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_wallet_public_key TEXT NOT NULL REFERENCES user_profiles(wallet_public_key) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE CHECK (char_length(trim(code)) BETWEEN 8 AND 64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  disabled_at TIMESTAMPTZ,
  CONSTRAINT uq_referral_codes_referrer_wallet UNIQUE (referrer_wallet_public_key)
);

CREATE INDEX IF NOT EXISTS referral_codes_disabled_at_idx
  ON referral_codes(disabled_at);

COMMENT ON TABLE referral_codes IS
  'Opaque public referral codes owned by an authenticated wallet/profile.';
COMMENT ON COLUMN referral_codes.referrer_wallet_public_key IS
  'Wallet-first owner reference aligned to user_profiles(wallet_public_key).';

CREATE TABLE IF NOT EXISTS referral_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id UUID NOT NULL REFERENCES referral_codes(id) ON DELETE RESTRICT,
  referrer_wallet_public_key TEXT NOT NULL REFERENCES user_profiles(wallet_public_key) ON DELETE RESTRICT,
  invitee_wallet_public_key TEXT NOT NULL REFERENCES user_profiles(wallet_public_key) ON DELETE RESTRICT,
  attribution_source TEXT NOT NULL DEFAULT 'link'
    CHECK (attribution_source IN ('link', 'manual', 'deep_link', 'unknown')),
  bound_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eligibility_window_ends_at TIMESTAMPTZ NOT NULL,
  kyc_approved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'bound_pending_kyc'
    CHECK (
      status IN (
        'bound_pending_kyc',
        'kyc_verified',
        'reward_window_closed',
        'expired_no_kyc',
        'expired_no_qualification',
        'rejected_self_referral',
        'rejected_invalid_code'
      )
    ),
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT chk_referral_attributions_distinct_wallets
    CHECK (referrer_wallet_public_key <> invitee_wallet_public_key),
  CONSTRAINT chk_referral_attributions_window
    CHECK (eligibility_window_ends_at >= bound_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS referral_attributions_active_invitee_wallet_uidx
  ON referral_attributions(invitee_wallet_public_key)
  WHERE status IN ('bound_pending_kyc', 'kyc_verified');

CREATE INDEX IF NOT EXISTS referral_attributions_referrer_bound_at_idx
  ON referral_attributions(referrer_wallet_public_key, bound_at DESC);

CREATE INDEX IF NOT EXISTS referral_attributions_invitee_status_idx
  ON referral_attributions(invitee_wallet_public_key, status);

COMMENT ON TABLE referral_attributions IS
  'Wallet-level referral bindings created at first authoritative auth payload.';
COMMENT ON COLUMN referral_attributions.invitee_wallet_public_key IS
  'Invitee wallet bound to a referral code after first trusted auth.';

CREATE TABLE IF NOT EXISTS referral_reward_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  eligible_collection_address TEXT NOT NULL,
  reward_amount_usdc NUMERIC(12, 2) NOT NULL CHECK (reward_amount_usdc > 0),
  settlement_window_days INTEGER NOT NULL DEFAULT 7 CHECK (settlement_window_days >= 0),
  holding_period_days INTEGER NOT NULL DEFAULT 7 CHECK (holding_period_days >= 0),
  eligibility_window_days INTEGER NOT NULL DEFAULT 30 CHECK (eligibility_window_days > 0),
  active_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active_to TIMESTAMPTZ,
  metadata_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT chk_referral_reward_rules_active_window
    CHECK (active_to IS NULL OR active_to >= active_from)
);

CREATE INDEX IF NOT EXISTS referral_reward_rules_collection_active_idx
  ON referral_reward_rules(eligible_collection_address, active_from DESC);

COMMENT ON TABLE referral_reward_rules IS
  'Parametric reward rules keyed by NFT collection address.';

CREATE TABLE IF NOT EXISTS referral_reward_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribution_id UUID NOT NULL REFERENCES referral_attributions(id) ON DELETE RESTRICT,
  rule_id UUID NOT NULL REFERENCES referral_reward_rules(id) ON DELETE RESTRICT,
  purchase_attempt_id TEXT NOT NULL REFERENCES purchase_attempts(id) ON DELETE RESTRICT,
  purchase_webhook_event_id TEXT REFERENCES purchase_webhook_events(id) ON DELETE SET NULL,
  nft_purchase_event_id TEXT UNIQUE,
  transaction_signature TEXT NOT NULL,
  collection_address TEXT NOT NULL,
  nft_mint_address TEXT NOT NULL,
  reward_amount_usdc NUMERIC(12, 2) NOT NULL CHECK (reward_amount_usdc > 0),
  qualified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  settlement_ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL
    CHECK (
      status IN (
        'pending_qualification',
        'pending_settlement',
        'accrued',
        'pending_admin_distribution',
        'paid',
        'clawbacked',
        'rejected',
        'risk_hold'
      )
    ),
  idempotency_key TEXT NOT NULL UNIQUE,
  audit_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT chk_referral_reward_events_window
    CHECK (settlement_ends_at >= qualified_at)
);

CREATE UNIQUE INDEX IF NOT EXISTS referral_reward_events_attempt_mint_uidx
  ON referral_reward_events(purchase_attempt_id, nft_mint_address);

CREATE INDEX IF NOT EXISTS referral_reward_events_attribution_status_idx
  ON referral_reward_events(attribution_id, status);

CREATE INDEX IF NOT EXISTS referral_reward_events_signature_idx
  ON referral_reward_events(transaction_signature);

COMMENT ON TABLE referral_reward_events IS
  'One reward-event record per eligible NFT purchase, sourced from purchase_attempts confirmed via purchase_webhook_events.';
COMMENT ON COLUMN referral_reward_events.purchase_attempt_id IS
  'Primary operational source for NFT purchase truth in this repo.';

CREATE TABLE IF NOT EXISTS referral_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_wallet_public_key TEXT NOT NULL REFERENCES user_profiles(wallet_public_key) ON DELETE RESTRICT,
  total_amount_usdc NUMERIC(12, 2) NOT NULL CHECK (total_amount_usdc >= 0),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'approved', 'executed', 'failed', 'canceled')),
  approved_by_actor_id TEXT,
  approved_at TIMESTAMPTZ,
  executed_by_actor_id TEXT,
  executed_at TIMESTAMPTZ,
  payout_tx_signature TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS referral_payouts_referrer_created_idx
  ON referral_payouts(referrer_wallet_public_key, created_at DESC);

CREATE INDEX IF NOT EXISTS referral_payouts_status_created_idx
  ON referral_payouts(status, created_at DESC);

COMMENT ON TABLE referral_payouts IS
  'Admin-controlled payout batches over accrued referral rewards.';
COMMENT ON COLUMN referral_payouts.approved_by_actor_id IS
  'Text actor identifier aligned with existing admin/compliance audit patterns.';

CREATE TABLE IF NOT EXISTS referral_payout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payout_id UUID NOT NULL REFERENCES referral_payouts(id) ON DELETE CASCADE,
  reward_event_id UUID NOT NULL REFERENCES referral_reward_events(id) ON DELETE RESTRICT,
  amount_usdc NUMERIC(12, 2) NOT NULL CHECK (amount_usdc > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_referral_payout_items_reward_event UNIQUE (reward_event_id)
);

CREATE INDEX IF NOT EXISTS referral_payout_items_payout_idx
  ON referral_payout_items(payout_id);

COMMENT ON TABLE referral_payout_items IS
  'Joins reward events to admin payout batches without losing event-level auditability.';
