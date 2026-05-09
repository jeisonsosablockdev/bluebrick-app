CREATE TABLE IF NOT EXISTS onboarding_reward_programs (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  reward_amount_usd NUMERIC(14,2) NOT NULL CHECK (reward_amount_usd >= 0),
  qualification_window_days INTEGER NOT NULL CHECK (qualification_window_days > 0),
  kyc_review_grace_hours INTEGER NOT NULL CHECK (kyc_review_grace_hours > 0),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_onboarding_rewards (
  id TEXT PRIMARY KEY,
  wallet_public_key TEXT NOT NULL REFERENCES user_profiles(wallet_public_key) ON DELETE CASCADE,
  program_id TEXT NOT NULL REFERENCES onboarding_reward_programs(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending_profile'
    CHECK (status IN ('pending_profile', 'pending_kyc', 'pending_review', 'earned', 'reserved', 'consumed', 'expired')),
  initial_registration_at TIMESTAMPTZ NOT NULL,
  qualification_deadline_at TIMESTAMPTZ NOT NULL,
  profile_completed_at TIMESTAMPTZ,
  kyc_submitted_at TIMESTAMPTZ,
  kyc_review_grace_deadline_at TIMESTAMPTZ,
  kyc_verified_at TIMESTAMPTZ,
  earned_at TIMESTAMPTZ,
  reward_amount_usd_snapshot NUMERIC(14,2) NOT NULL CHECK (reward_amount_usd_snapshot >= 0),
  reserved_order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  reserved_at TIMESTAMPTZ,
  consumed_order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  consumed_at TIMESTAMPTZ,
  expired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_onboarding_rewards_wallet_program UNIQUE (wallet_public_key, program_id),
  CONSTRAINT chk_onboarding_reward_discount_progression
    CHECK (
      (status <> 'reserved' OR reserved_order_id IS NOT NULL)
      AND (status <> 'consumed' OR consumed_order_id IS NOT NULL)
    )
);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS subtotal_amount_usd NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (subtotal_amount_usd >= 0),
  ADD COLUMN IF NOT EXISTS discount_amount_usd NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (discount_amount_usd >= 0),
  ADD COLUMN IF NOT EXISTS applied_onboarding_reward_id TEXT REFERENCES user_onboarding_rewards(id);

UPDATE orders
SET subtotal_amount_usd = total_amount_usd
WHERE subtotal_amount_usd = 0
  AND total_amount_usd > 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'chk_orders_discount_lte_subtotal'
  ) THEN
    ALTER TABLE orders
      ADD CONSTRAINT chk_orders_discount_lte_subtotal
      CHECK (discount_amount_usd <= subtotal_amount_usd);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS onboarding_reward_programs_active_idx
  ON onboarding_reward_programs (code, is_active, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS user_onboarding_rewards_wallet_status_idx
  ON user_onboarding_rewards (wallet_public_key, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS user_onboarding_rewards_reserved_order_idx
  ON user_onboarding_rewards (reserved_order_id)
  WHERE reserved_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS user_onboarding_rewards_consumed_order_idx
  ON user_onboarding_rewards (consumed_order_id)
  WHERE consumed_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS user_onboarding_rewards_deadline_idx
  ON user_onboarding_rewards (qualification_deadline_at, status);

DROP TRIGGER IF EXISTS onboarding_reward_programs_set_updated_at ON onboarding_reward_programs;
CREATE TRIGGER onboarding_reward_programs_set_updated_at
BEFORE UPDATE ON onboarding_reward_programs
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();

DROP TRIGGER IF EXISTS user_onboarding_rewards_set_updated_at ON user_onboarding_rewards;
CREATE TRIGGER user_onboarding_rewards_set_updated_at
BEFORE UPDATE ON user_onboarding_rewards
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();
