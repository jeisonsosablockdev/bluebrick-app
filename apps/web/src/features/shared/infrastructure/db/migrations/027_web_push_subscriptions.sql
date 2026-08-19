CREATE UNIQUE INDEX IF NOT EXISTS account_wallet_identities_account_wallet_uidx
  ON account_wallet_identities (account_id, wallet_public_key);

CREATE TABLE IF NOT EXISTS web_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  wallet_public_key TEXT NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth_secret TEXT NOT NULL,
  user_agent TEXT,
  platform_family TEXT NOT NULL CHECK (platform_family IN ('ios', 'android', 'desktop', 'unknown')),
  app_mode TEXT NOT NULL CHECK (app_mode IN ('browser', 'standalone')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'gone', 'failing')),
  consent_source TEXT NOT NULL,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_sent_at TIMESTAMPTZ,
  last_error_code TEXT,
  last_error_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  CONSTRAINT web_push_subscriptions_account_wallet_fk
    FOREIGN KEY (account_id, wallet_public_key)
    REFERENCES account_wallet_identities(account_id, wallet_public_key)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS web_push_subscriptions_account_status_idx
  ON web_push_subscriptions (account_id, status, last_seen_at DESC);

CREATE INDEX IF NOT EXISTS web_push_subscriptions_wallet_status_idx
  ON web_push_subscriptions (wallet_public_key, status, last_seen_at DESC);

CREATE INDEX IF NOT EXISTS web_push_subscriptions_status_last_sent_idx
  ON web_push_subscriptions (status, last_sent_at DESC NULLS LAST);
