ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS aml_flags_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS aml_provider TEXT,
  ADD COLUMN IF NOT EXISTS aml_rule_version TEXT,
  ADD COLUMN IF NOT EXISTS aml_last_checked_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS aml_screenings (
  id BIGSERIAL PRIMARY KEY,
  wallet_public_key TEXT NOT NULL REFERENCES user_profiles(wallet_public_key) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_classification TEXT NOT NULL CHECK (provider_classification IN ('clear', 'review_required', 'flagged', 'unavailable')),
  aml_status TEXT NOT NULL CHECK (aml_status IN ('not_started', 'pending', 'clear', 'flagged')),
  aml_risk_score INTEGER,
  aml_flags_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  rule_version TEXT,
  trigger_source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS aml_screenings_wallet_created_idx
  ON aml_screenings (wallet_public_key, created_at DESC);
