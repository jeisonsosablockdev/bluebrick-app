/**
 * ============================================================================
 * Layer 4: Infrastructure - DDL Schema Migration 003 Test Suite
 * ============================================================================
 * Tests presence, structural integrity, idempotency clauses, and index coverage
 * of the AI-Augmented Ingestion Pipeline database schema migration.
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('DDL Migration 003: AI Ingestion Tables (sync_records, media_assets, clients)', () => {
  const rootDir = process.cwd();
  const migrationPath = path.resolve(
    rootDir,
    'apps/web/src/features/shared/infrastructure/db/migrations/003_ai_ingestion_tables.sql'
  );

  it('migration file exists on disk', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
  });

  it('declares all 3 required tables with IF NOT EXISTS idempotency', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    expect(sql).toContain('CREATE TABLE IF NOT EXISTS sync_records');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS media_assets');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS clients');
  });

  it('declares critical columns and types for sync_records table', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    expect(sql).toContain('file_id VARCHAR(255) NOT NULL UNIQUE');
    expect(sql).toContain('source_type VARCHAR(50) NOT NULL');
    expect(sql).toContain("status VARCHAR(50) NOT NULL DEFAULT 'PENDING'");
    expect(sql).toContain('confidence_score NUMERIC(5, 2) NOT NULL DEFAULT 0.00');
    expect(sql).toContain("raw_payload JSONB DEFAULT '{}'::jsonb");
    expect(sql).toContain("canonical_payload JSONB DEFAULT '{}'::jsonb");
  });

  it('declares focal point coordinates and tags for media_assets table', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    expect(sql).toContain('project_id VARCHAR(255) NOT NULL');
    expect(sql).toContain('drive_file_id VARCHAR(255) NOT NULL UNIQUE');
    expect(sql).toContain('focal_x NUMERIC(4, 3) DEFAULT 0.500');
    expect(sql).toContain('focal_y NUMERIC(4, 3) DEFAULT 0.500');
    expect(sql).toContain("ai_tags TEXT[] DEFAULT '{}'");
  });

  it('declares high-throughput indexing statements', () => {
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_sync_records_status ON sync_records(status)');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_sync_records_file_id ON sync_records(file_id)');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_media_assets_project_id ON media_assets(project_id)');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_clients_tax_id ON clients(tax_id)');
    expect(sql).toContain('CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status)');
  });
});
