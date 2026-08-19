ALTER TABLE purchase_attempts
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

ALTER TABLE purchase_attempts
  ADD COLUMN IF NOT EXISTS idempotency_expires_at TIMESTAMPTZ;

ALTER TABLE purchase_attempts
  ADD COLUMN IF NOT EXISTS prepared_at TIMESTAMPTZ;

ALTER TABLE purchase_attempts
  ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

UPDATE purchase_attempts
SET idempotency_key = CONCAT('legacy-', id)
WHERE idempotency_key IS NULL
   OR BTRIM(idempotency_key) = '';

UPDATE purchase_attempts
SET idempotency_expires_at = COALESCE(submitted_at, created_at, NOW()) + INTERVAL '365 days'
WHERE idempotency_expires_at IS NULL;

UPDATE purchase_attempts
SET prepared_at = COALESCE(prepared_at, created_at)
WHERE status IN ('prepared', 'submitted', 'failed', 'confirmed')
  AND prepared_at IS NULL;

ALTER TABLE purchase_attempts
  ALTER COLUMN idempotency_key SET NOT NULL;

ALTER TABLE purchase_attempts
  ALTER COLUMN idempotency_expires_at SET NOT NULL;

ALTER TABLE purchase_attempts
  ALTER COLUMN prepared_price_lamports DROP NOT NULL;

ALTER TABLE purchase_attempts
  ALTER COLUMN prepared_tx_message_b64 DROP NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'purchase_attempts_status_check'
  ) THEN
    ALTER TABLE purchase_attempts
      DROP CONSTRAINT purchase_attempts_status_check;
  END IF;
END $$;

ALTER TABLE purchase_attempts
  ADD CONSTRAINT purchase_attempts_status_check
  CHECK (status IN ('created', 'prepared', 'submitted', 'confirmed', 'failed'));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'purchase_attempts_idempotency_key_not_blank'
  ) THEN
    ALTER TABLE purchase_attempts
      DROP CONSTRAINT purchase_attempts_idempotency_key_not_blank;
  END IF;
END $$;

ALTER TABLE purchase_attempts
  ADD CONSTRAINT purchase_attempts_idempotency_key_not_blank
  CHECK (LENGTH(BTRIM(idempotency_key)) > 0);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'purchase_attempts_state_shape_check'
  ) THEN
    ALTER TABLE purchase_attempts
      DROP CONSTRAINT purchase_attempts_state_shape_check;
  END IF;
END $$;

ALTER TABLE purchase_attempts
  ADD CONSTRAINT purchase_attempts_state_shape_check
  CHECK (
    (
      status <> 'created'
      OR (
        prepared_price_lamports IS NULL
        AND prepared_tx_message_b64 IS NULL
        AND prepared_at IS NULL
        AND tx_signature IS NULL
        AND submitted_at IS NULL
        AND confirmed_at IS NULL
      )
    )
    AND (
      status <> 'prepared'
      OR (
        prepared_price_lamports IS NOT NULL
        AND prepared_tx_message_b64 IS NOT NULL
        AND prepared_at IS NOT NULL
        AND tx_signature IS NULL
        AND submitted_at IS NULL
        AND confirmed_at IS NULL
      )
    )
    AND (
      status <> 'submitted'
      OR (
        prepared_price_lamports IS NOT NULL
        AND prepared_tx_message_b64 IS NOT NULL
        AND prepared_at IS NOT NULL
        AND tx_signature IS NOT NULL
        AND submitted_at IS NOT NULL
        AND confirmed_at IS NULL
      )
    )
    AND (
      status <> 'confirmed'
      OR (
        prepared_price_lamports IS NOT NULL
        AND prepared_tx_message_b64 IS NOT NULL
        AND prepared_at IS NOT NULL
        AND tx_signature IS NOT NULL
        AND submitted_at IS NOT NULL
        AND confirmed_at IS NOT NULL
      )
    )
    AND (
      status <> 'failed'
      OR confirmed_at IS NULL
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS purchase_attempts_wallet_idempotency_key_uidx
  ON purchase_attempts(wallet_public_key, idempotency_key);

CREATE INDEX IF NOT EXISTS purchase_attempts_idempotency_expires_idx
  ON purchase_attempts(idempotency_expires_at);
