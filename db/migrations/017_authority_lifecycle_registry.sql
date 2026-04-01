CREATE TABLE IF NOT EXISTS authority_registry (
  role TEXT NOT NULL,
  collection_address TEXT NOT NULL,
  authority_pubkey TEXT NOT NULL,
  authority_version BIGINT NOT NULL CHECK (authority_version >= 1),
  updated_by TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_operation_id UUID NULL,
  PRIMARY KEY (role, collection_address)
);

CREATE TABLE IF NOT EXISTS authority_audit_events (
  id UUID PRIMARY KEY,
  role TEXT NOT NULL,
  operation TEXT NOT NULL,
  collection_address TEXT NOT NULL,
  previous_authority TEXT NOT NULL,
  new_authority TEXT NOT NULL,
  previous_version BIGINT NOT NULL CHECK (previous_version >= 1),
  new_version BIGINT NOT NULL CHECK (new_version >= 1),
  multisig_proposal_id TEXT NOT NULL,
  multisig_proposer TEXT NOT NULL,
  multisig_executor TEXT NOT NULL,
  multisig_approver_signers JSONB NOT NULL,
  multisig_approval_count INTEGER NOT NULL CHECK (multisig_approval_count >= 0),
  required_threshold INTEGER NOT NULL CHECK (required_threshold >= 1),
  cooldown_bypassed BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL,
  prepared_transaction_kind TEXT NOT NULL,
  signature TEXT NULL,
  error_message TEXT NULL,
  created_by TEXT NOT NULL,
  prepared_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ NULL,
  CONSTRAINT authority_audit_events_role_check
    CHECK (role IN ('transfer_delegate', 'appdata_authority')),
  CONSTRAINT authority_audit_events_operation_check
    CHECK (operation IN ('rotate', 'revoke', 'emergency_rotate')),
  CONSTRAINT authority_audit_events_status_check
    CHECK (status IN ('prepared', 'submitted', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_authority_audit_events_role_collection
  ON authority_audit_events (role, collection_address);

CREATE INDEX IF NOT EXISTS idx_authority_audit_events_proposal
  ON authority_audit_events (multisig_proposal_id);

CREATE INDEX IF NOT EXISTS idx_authority_audit_events_status_prepared_at
  ON authority_audit_events (status, prepared_at DESC);
