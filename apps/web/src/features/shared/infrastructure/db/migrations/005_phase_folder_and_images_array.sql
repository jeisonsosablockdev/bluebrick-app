-- ==============================================================================
-- @file apps/web/src/features/shared/infrastructure/db/migrations/005_phase_folder_and_images_array.sql
-- @description Layer 4: Infrastructure - DDL Schema Migration for Google Drive Folder Ingestion.
-- Extends dashboard_project_phases table:
--   - folder_url TEXT: Stores Google Drive folder reference URL or ID.
--   - imagenes TEXT[]: Stores array of permanent Vercel Blob CDN URLs for phase photo carousels.
-- Invariants:
--   - Idempotent DDL statements using IF NOT EXISTS.
--   - Backwards compatible: existing scalar columns imagen_url_1, imagen_url_2, imagen_url_3 remain intact.
--   - Default empty array '{}' for imagenes to prevent NULL pointer dereferences in consumption queries.
-- Architecture: 4-Layer Functional Web3 / Ingestion Architecture.
-- ==============================================================================

-- Step 1: Extend dashboard_project_phases table with folder reference and dynamic images array
ALTER TABLE dashboard_project_phases
  ADD COLUMN IF NOT EXISTS folder_url TEXT,
  ADD COLUMN IF NOT EXISTS imagenes TEXT[] DEFAULT '{}';
