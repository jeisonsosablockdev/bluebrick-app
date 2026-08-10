CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_via TEXT NOT NULL CHECK (created_via IN ('wallet', 'federated', 'migration')),
  primary_wallet_public_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS accounts_created_via_idx
  ON accounts (created_via, created_at DESC);

CREATE TABLE IF NOT EXISTS account_wallet_identities (
  wallet_public_key TEXT PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_authenticated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS account_wallet_identities_account_idx
  ON account_wallet_identities (account_id, linked_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS account_wallet_identities_primary_account_uidx
  ON account_wallet_identities (account_id)
  WHERE is_primary = TRUE;

CREATE TABLE IF NOT EXISTS account_federated_identities (
  workos_user_id TEXT PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'workos',
  email TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT account_federated_identities_provider_check
    CHECK (provider = 'workos')
);

CREATE INDEX IF NOT EXISTS account_federated_identities_account_idx
  ON account_federated_identities (account_id, created_at DESC);

CREATE INDEX IF NOT EXISTS account_federated_identities_email_idx
  ON account_federated_identities (LOWER(email))
  WHERE email IS NOT NULL;

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS user_profiles_account_id_idx
  ON user_profiles (account_id)
  WHERE account_id IS NOT NULL;

INSERT INTO accounts (id, created_via, primary_wallet_public_key, created_at, updated_at)
SELECT
  gen_random_uuid(),
  'migration',
  up.wallet_public_key,
  up.created_at,
  up.updated_at
FROM user_profiles up
LEFT JOIN accounts existing
  ON existing.primary_wallet_public_key = up.wallet_public_key
WHERE existing.id IS NULL;

INSERT INTO account_wallet_identities (wallet_public_key, account_id, is_primary, linked_at, last_authenticated_at)
SELECT
  up.wallet_public_key,
  a.id,
  TRUE,
  up.created_at,
  NULL
FROM user_profiles up
JOIN accounts a
  ON a.primary_wallet_public_key = up.wallet_public_key
LEFT JOIN account_wallet_identities existing
  ON existing.wallet_public_key = up.wallet_public_key
WHERE existing.wallet_public_key IS NULL;

UPDATE user_profiles up
SET account_id = a.id
FROM accounts a
WHERE a.primary_wallet_public_key = up.wallet_public_key
  AND up.account_id IS NULL;
