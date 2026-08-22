-- Migration: 043_distribution_payout_overrides.sql
-- Layer: Layer 4 — Infrastructure / Database Schema
-- Description: Two-step payout wallet override registry with mandatory case_number,
--              optimistic concurrency versioning, and on-chain execution signature tracking.

CREATE TABLE IF NOT EXISTS distribution_payout_overrides (
  id VARCHAR(64) PRIMARY KEY,
  original_wallet VARCHAR(64) NOT NULL,
  requested_wallet VARCHAR(64) NOT NULL,
  effective_wallet VARCHAR(64) NOT NULL,
  case_number VARCHAR(64) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED')),
  version INTEGER NOT NULL DEFAULT 1,
  reason TEXT NOT NULL,
  requested_by VARCHAR(64) NOT NULL,
  approved_by VARCHAR(64),
  approval_tx_signature VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_override_wallets_distinct CHECK (original_wallet <> requested_wallet)
);

CREATE INDEX IF NOT EXISTS idx_payout_overrides_case_number 
  ON distribution_payout_overrides (case_number);

CREATE INDEX IF NOT EXISTS idx_payout_overrides_original_wallet 
  ON distribution_payout_overrides (original_wallet);

CREATE INDEX IF NOT EXISTS idx_payout_overrides_status 
  ON distribution_payout_overrides (status);

CREATE INDEX IF NOT EXISTS idx_payout_overrides_lookup 
  ON distribution_payout_overrides (original_wallet, status);
