CREATE TABLE IF NOT EXISTS user_profiles (
  wallet_public_key TEXT PRIMARY KEY,
  username TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  avatar_url TEXT NOT NULL DEFAULT '',
  kyc_provider TEXT,
  kyc_provider_session_id TEXT,
  kyc_provider_report_id TEXT,
  aml_status TEXT NOT NULL DEFAULT 'not_started' CHECK (aml_status IN ('not_started', 'pending', 'clear', 'flagged')),
  aml_risk_score INTEGER,
  is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  compliance_status TEXT NOT NULL DEFAULT 'pending_kyc' CHECK (compliance_status IN ('pending_kyc', 'pending_aml', 'pending_review', 'fully_verified', 'restricted_aml', 'suspended')),
  compliance_status_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_username_lower_unique_idx
  ON user_profiles (LOWER(username))
  WHERE username <> '';

CREATE INDEX IF NOT EXISTS user_profiles_compliance_status_idx
  ON user_profiles (compliance_status, compliance_status_updated_at DESC);

CREATE INDEX IF NOT EXISTS user_profiles_kyc_provider_session_idx
  ON user_profiles (kyc_provider_session_id)
  WHERE kyc_provider_session_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS kyc_cases (
  wallet_public_key TEXT PRIMARY KEY REFERENCES user_profiles(wallet_public_key) ON DELETE CASCADE,
  kyc_provider TEXT NOT NULL DEFAULT 'stripe_identity',
  kyc_provider_session_id TEXT,
  kyc_provider_report_id TEXT,
  kyc_status TEXT NOT NULL DEFAULT 'not_started' CHECK (kyc_status IN ('not_started', 'pending', 'verified', 'rejected')),
  rejection_reason_code TEXT,
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS kyc_cases_provider_session_idx
  ON kyc_cases (kyc_provider_session_id)
  WHERE kyc_provider_session_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS kyc_webhook_events (
  provider_event_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  event_type TEXT NOT NULL,
  wallet_public_key TEXT,
  kyc_provider_session_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('processed', 'duplicate', 'ignored', 'invalid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS kyc_webhook_events_created_at_idx
  ON kyc_webhook_events (created_at DESC);

CREATE TABLE IF NOT EXISTS compliance_audit_events (
  id BIGSERIAL PRIMARY KEY,
  wallet_public_key TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('user', 'admin', 'system', 'provider')),
  actor_id TEXT NOT NULL,
  event_name TEXT NOT NULL,
  event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS compliance_audit_events_wallet_created_idx
  ON compliance_audit_events (wallet_public_key, created_at DESC);
