-- ==============================================================================
-- @file apps/web/src/features/shared/infrastructure/db/migrations/003_ai_ingestion_tables.sql
-- @description Layer 4: Infrastructure - DDL Schema Migration for AI-Augmented Ingestion Pipeline.
-- Defines tables: sync_records, media_assets, clients.
-- ==============================================================================

-- Step 1: Create sync_records table (Google Drive differential sync audit & status)
CREATE TABLE IF NOT EXISTS sync_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id VARCHAR(255) NOT NULL UNIQUE,
  folder_path TEXT NOT NULL,
  source_type VARCHAR(50) NOT NULL, -- 'DOCUMENT', 'SPREADSHEET', 'IMAGE', 'VIDEO'
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PROCESSED', 'FAILED', 'NEEDS_REVIEW'
  confidence_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
  raw_payload JSONB DEFAULT '{}'::jsonb,
  canonical_payload JSONB DEFAULT '{}'::jsonb,
  validation_errors JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 2: Create media_assets table (Images and videos processed with AI smart-crop/tags)
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id VARCHAR(255) NOT NULL,
  drive_file_id VARCHAR(255) NOT NULL UNIQUE,
  blob_url TEXT NOT NULL,
  media_type VARCHAR(50) NOT NULL, -- 'IMAGE', 'VIDEO'
  focal_x NUMERIC(4, 3) DEFAULT 0.500,
  focal_y NUMERIC(4, 3) DEFAULT 0.500,
  ai_tags TEXT[] DEFAULT '{}',
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 3: Create clients table (Canonicalized client / investment records)
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  tax_id VARCHAR(100) UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(100),
  contract_amount NUMERIC(18, 2),
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ACTIVE', 'ARCHIVED', 'INACTIVE'
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 4: Index critical query columns for high-throughput lookup and filtering
CREATE INDEX IF NOT EXISTS idx_sync_records_status ON sync_records(status);
CREATE INDEX IF NOT EXISTS idx_sync_records_file_id ON sync_records(file_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_project_id ON media_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_clients_tax_id ON clients(tax_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
