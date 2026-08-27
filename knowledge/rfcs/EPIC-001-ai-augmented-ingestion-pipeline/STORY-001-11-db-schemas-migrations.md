---
type: RFC
title: STORY-001-11 PostgreSQL Relational DDL & Migrations
description: RFC Story for database schema definitions, partial unique indexes on tax_id, soft-deletes, NUMERIC(18,2) precision, and Neon serverless connection pooling.
tags: [rfc, story, postgresql, migrations, database-schema, ddl, neon, security, 4-layers]
timestamp: 2026-08-25T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-001-ai-augmented-ingestion-pipeline/STORY-001-11-db-schemas-migrations.md
---

# STORY-001-11-db-schemas-migrations

## Metadata
- Epic: `EPIC-001-ai-augmented-ingestion-pipeline`
- Story ID: `STORY-001-11`
- Status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `feature/001-11-db-schemas-migrations`
- Created: `2026-08-25`
- Last Updated: `2026-08-27`

---

## Context
- **Problem:** La base de datos relacional debe manejar importes de gran escala en pesos colombianos y dólares (requiriendo `NUMERIC(18,2)` para prevenir desbordamientos), evitar colisiones de `NULL` en índices únicos (`NULL != NULL` en SQL estándar para `tax_id`), y prevenir pérdidas masivas de medios por borrados en cascada no controlados.
- **Why now:** Establece la capa DDL y las tablas relacionales permanentes para clientes, proyectos y sincronización.
- **Constraints:**
  - Migración SQL `003_ai_ingestion_tables.sql` compatible con `pnpm db:migrate` y ubicada en `apps/web/src/features/shared/infrastructure/db/migrations/`.
  - Índice único parcial: `CREATE UNIQUE INDEX idx_clients_tax_id_unique ON clients(tax_id) WHERE tax_id IS NOT NULL;`.
  - Precisión de importes: `NUMERIC(18,2)` (soporte de hasta 999 billones con 2 decimales).
  - Eliminación segura: Usar `ON DELETE RESTRICT` o soft-delete (`deleted_at TIMESTAMPTZ DEFAULT NULL`) en lugar de `ON DELETE CASCADE` para proteger asociaciones de medios.
  - Índices compuestos de alto rendimiento: `CREATE INDEX idx_drive_sync_status_mod ON drive_sync_records(sync_status, last_modified_time);`.
- **Affected paths:**
  - `apps/web/src/features/shared/infrastructure/db/migrations/003_ai_ingestion_tables.sql`
  - `apps/web/src/features/ai-ingestion/infrastructure/db-schema-types.ts`
  - `scripts/db-migrate.js`

---

## Proposal
- **Approach summary:** Crear la migración SQL idempotente `003_ai_ingestion_tables.sql` con definición de tablas, restricciones de chequeo (`CHECK (confidence_score >= 0 AND confidence_score <= 100)`), índices parciales y tipos de datos de alta precisión.
- **Technical design:**
  1. **DDL Specification:**
     - `drive_sync_records`: `drive_file_id (PK)`, `file_name`, `folder_path`, `md5_checksum`, `sync_status`, `confidence_score`, `metadata (JSONB)`, `last_modified_time`, `created_at`.
     - `clients`: `id (PK UUID)`, `name`, `tax_id`, `email`, `phone`, `contract_amount NUMERIC(18,2)`, `status`, `metadata (JSONB)`, `deleted_at`.
     - `projects`: `id (PK UUID)`, `name UNIQUE`, `description`, `status`, `deleted_at`.
     - `project_media`: `id (PK UUID)`, `project_id REFERENCES projects(id) ON DELETE RESTRICT`, `blob_url`, `media_type`, `caption`, `ai_tags TEXT[]`, `focal_x`, `focal_y`, `width`, `height`, `aspect_ratio`.
     - `project_milestones`: `id (PK UUID)`, `project_id REFERENCES projects(id) ON DELETE RESTRICT`, `title`, `target_date`, `progress_status`.
- **Alternatives considered:**
  - *Cascada total (CASCADE):* Descartada por riesgo de dejar blobs huérfanos en CDN sin trazabilidad en base de datos.
- **Tradeoffs:**
  - Requiere manejo explícito de desvinculación de medios antes de eliminar un proyecto.

---

## Critique
- **Reviewer(s):** Architect Critic, Security Critic & QA Critic
- **Critical findings resolved:**
  1. *Duplicate NULL tax_id:* Resuelto con índice único parcial `WHERE tax_id IS NOT NULL`.
  2. *Numeric Overflow:* Resuelto ampliando a `NUMERIC(18,2)`.
  3. *Cascade Destruction:* Resuelto con `ON DELETE RESTRICT` y soporte de soft-delete.
- **Blocking concerns:** Ninguno restante.

---

## Resolution
- **Final approach after critique:** DDL de PostgreSQL endurecido con restricciones parciales y alta precisión.
- **Changes accepted:** Todas las recomendaciones integradas.
- **Changes rejected (with rationale):** Ninguno.

---

## Decision
- **Decision:** `approved`
- **Decision date:** `2026-08-25`
- **Decision owner:** `jaymusicmachine`
- **Approval notes:** Aprobado para ejecución de migración.

---

## Status
- **Current status:** `approved`
- **Next action:** Crear el archivo de migración `apps/web/src/features/shared/infrastructure/db/migrations/003_ai_ingestion_tables.sql`.
- **Exit criteria:**
  - [x] All critical critique points addressed
  - [x] Decision is `approved`
  - [ ] Implementation completed with tests passing

---

## Test and Validation Plan
- **Unit tests:**
  1. Idempotencia de migración (ejecución repetida 3 veces sin fallos).
  2. Verificación de rechazo de montos numéricos que desborden límites.
  3. Inserción de múltiples clientes con `tax_id = NULL` sin error de colisión.
- **Integration tests:**
  - Ejecución de `pnpm db:migrate` y consulta de estructura relacional en PostgreSQL.
- **Devnet validation (if applicable):** N/A
- **Responsive QA (if applicable):** N/A

---

## Traceability
- **Related issue(s):** `EPIC-001`, `STORY-001-11`
- **Related PR(s):** `TBD`
- **Final commit hash(es):** `TBD`
