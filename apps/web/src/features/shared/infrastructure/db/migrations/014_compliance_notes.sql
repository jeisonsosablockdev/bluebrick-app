CREATE TABLE IF NOT EXISTS compliance_notes (
  id BIGSERIAL PRIMARY KEY,
  wallet_public_key TEXT NOT NULL REFERENCES user_profiles(wallet_public_key) ON DELETE CASCADE,
  note_text TEXT NOT NULL CHECK (length(trim(note_text)) > 0),
  actor_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS compliance_notes_wallet_created_idx
  ON compliance_notes (wallet_public_key, created_at DESC);
