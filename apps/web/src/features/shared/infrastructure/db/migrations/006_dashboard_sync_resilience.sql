-- ==============================================================================
-- @file apps/web/src/features/shared/infrastructure/db/migrations/006_dashboard_sync_resilience.sql
-- @description Layer 4: Infrastructure - DDL Migration for Resilient Serverless Webhook Ingestion
-- Implements:
--   1. dashboard_sync_state: Global singleton table tracking distributed cooldowns,
--      lock status, trailing-edge pending flags, and execution heartbeat across serverless containers.
--   2. dashboard_sync_logs: Immutable audit trail & dead-letter queue capturing every
--      synchronization attempt, circuit-breaker event, latency metrics, and failure diagnostics.
--   3. Advisory lock constants & validation helpers.
-- Invariants:
--   - Idempotent DDL statements using IF NOT EXISTS.
--   - Strict check constraints on status enumerations.
--   - Fast lookups on dead letters and execution chronologies.
-- Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
-- ==============================================================================

-- Step 1: Create dashboard_sync_state singleton table
CREATE TABLE IF NOT EXISTS dashboard_sync_state (
  id VARCHAR(64) PRIMARY KEY, -- Singleton key: 'CANONICAL_DASHBOARD_SYNC'
  last_sync_started_at TIMESTAMPTZ,
  last_sync_completed_at TIMESTAMPTZ,
  last_sync_status VARCHAR(32) NOT NULL DEFAULT 'IDLE', -- 'IDLE', 'RUNNING', 'SUCCESS', 'FAILED', 'CIRCUIT_BREAKER_TRIPPED'
  pending_sync BOOLEAN NOT NULL DEFAULT FALSE,
  pending_sync_requested_at TIMESTAMPTZ,
  pending_sync_source VARCHAR(32),
  cooldown_until TIMESTAMPTZ,
  active_lock_owner VARCHAR(128),
  current_file_id VARCHAR(128),
  last_error TEXT,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_sync_status CHECK (
    last_sync_status IN ('IDLE', 'RUNNING', 'SUCCESS', 'FAILED', 'CIRCUIT_BREAKER_TRIPPED')
  )
);

-- Seed singleton row if not exists
INSERT INTO dashboard_sync_state (id, last_sync_status, pending_sync, updated_at)
VALUES ('CANONICAL_DASHBOARD_SYNC', 'IDLE', FALSE, NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create dashboard_sync_logs audit & dead-letter queue table
CREATE TABLE IF NOT EXISTS dashboard_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_id VARCHAR(64) NOT NULL,
  trigger_source VARCHAR(32) NOT NULL, -- 'WEBHOOK', 'ADMIN_UI', 'CRON', 'TRAILING_EDGE'
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status VARCHAR(32) NOT NULL, -- 'SUCCESS', 'FAILED', 'CIRCUIT_BREAKER_TRIPPED', 'RATE_LIMITED'
  duration_ms INTEGER,
  total_entities_synced INTEGER NOT NULL DEFAULT 0,
  entity_counts JSONB,
  metrics JSONB,
  error_code VARCHAR(64),
  error_message TEXT,
  error_stack TEXT,
  circuit_breaker_reason TEXT,
  drive_file_id VARCHAR(128),
  file_bytes INTEGER,
  file_checksum VARCHAR(64),
  is_dead_letter BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 3: Performance & Operational Indexes
CREATE INDEX IF NOT EXISTS idx_dash_sync_logs_started_at ON dashboard_sync_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_dash_sync_logs_dead_letter ON dashboard_sync_logs(is_dead_letter, resolved_at) WHERE is_dead_letter = TRUE;
CREATE INDEX IF NOT EXISTS idx_dash_sync_logs_status ON dashboard_sync_logs(status);
