-- ==============================================================================
-- @file apps/web/src/features/shared/infrastructure/db/migrations/001_create_investor_schema.sql
-- @description Layer 4: Infrastructure - DDL Schema Migration for BlueBrick Investor Platform.
-- Defines tables: users, properties, user_investments, reinvestment_opportunities.
-- ==============================================================================

-- Step 1: Create users table (synchronized JIT from WorkOS AuthKit)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(128) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(128) NOT NULL,
  last_name VARCHAR(128) NOT NULL,
  avatar_url TEXT,
  tier VARCHAR(64) NOT NULL DEFAULT 'Inversionista Privada',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 2: Create properties table (real estate fractional assets)
CREATE TABLE IF NOT EXISTS properties (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(128) NOT NULL,
  type VARCHAR(64) NOT NULL, -- 'Residencial', 'Comercial', 'Industrial'
  target_amount NUMERIC(14, 2) NOT NULL,
  roi NUMERIC(5, 2) NOT NULL, -- Annual projected ROI percentage (e.g. 14.2)
  status VARCHAR(32) NOT NULL DEFAULT 'activa', -- 'activa', 'concluida', 'fondos_completados'
  timing VARCHAR(128) NOT NULL,
  months_left INTEGER NOT NULL DEFAULT 0,
  gradient TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 3: Create user_investments table (linking investors to property fractions)
CREATE TABLE IF NOT EXISTS user_investments (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id VARCHAR(64) NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  invested_amount NUMERIC(14, 2) NOT NULL,
  invested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_positive_investment CHECK (invested_amount > 0)
);

-- Step 4: Create reinvestment_opportunities table (featured deals for capital deployment)
CREATE TABLE IF NOT EXISTS reinvestment_opportunities (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  city VARCHAR(128) NOT NULL,
  projected_roi NUMERIC(5, 2) NOT NULL,
  min_investment NUMERIC(14, 2) NOT NULL,
  days_left INTEGER NOT NULL DEFAULT 1,
  gradient TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 5: Index critical query foreign keys and statuses
CREATE INDEX IF NOT EXISTS idx_user_investments_user_id ON user_investments(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
