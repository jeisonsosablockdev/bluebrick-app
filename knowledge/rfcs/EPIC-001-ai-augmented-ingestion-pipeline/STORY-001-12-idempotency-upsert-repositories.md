---
type: RFC
title: STORY-001-12 Deterministic Repositories & UPSERT Idempotency Guard
description: RFC Story for typed PostgreSQL persistence repositories, ACID transactions, PostgreSQL advisory locks per drive_file_id, and structured metadata merging.
tags: [rfc, story, postgresql, repositories, idempotency, upsert, transactions, advisory-locks, 4-layers]
timestamp: 2026-08-25T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-001-ai-augmented-ingestion-pipeline/STORY-001-12-idempotency-upsert-repositories.md
---

# STORY-001-12-idempotency-upsert-repositories

## Metadata
- Epic: `EPIC-001-ai-augmented-ingestion-pipeline`
- Story ID: `STORY-001-12`
- Status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `feature/001-12-idempotency-upsert-repositories`
- Created: `2026-08-25`
- Last Updated: `2026-08-25`

---

## Context
- **Problem:** La concurrencia entre workers de sincronización puede provocar bloqueos mutuos (*deadlocks*) o sobrescrituras corruptas de metadatos de auditoría al insertar proyectos y medios relacionados simultáneamente.
- **Why now:** Conecta el resultado de la inferencia validada con la base de datos de forma atómica e idempotente.
- **Constraints:**
  - Bloqueos consultivos a nivel de transacción: Adquirir `pg_advisory_xact_lock(hashtext(drive_file_id))` al iniciar el UPSERT para serializar peticiones sobre el mismo archivo.
  - Orden determinista de inserción en lotes para prevenir deadlocks `40P01`.
  - Transaccionalidad total: Reversión automática (`ROLLBACK`) si cualquiera de las entidades hijas falla.
  - Fusión estructurada de metadatos JSONB preservando el historial inmutable de auditoría.
- **Affected paths:**
  - `apps/web/src/features/ai-ingestion/domain/ports/repositories-port.ts`
  - `apps/web/src/features/ai-ingestion/infrastructure/postgres-client-repository.ts`
  - `apps/web/src/features/ai-ingestion/infrastructure/postgres-project-repository.ts`
  - `apps/web/src/features/ai-ingestion/infrastructure/postgres-sync-record-repository.ts`
  - `apps/web/src/features/ai-ingestion/infrastructure/postgres-repositories.test.ts`

---

## Proposal
- **Approach summary:** Implementar los repositorios relacionales en la capa de Infraestructura que ejecutan consultas SQL parametrizadas dentro de transacciones gestionadas con advisory locks, asegurando que un mismo archivo nunca se procese en paralelo.
- **Technical design:**
  1. **Advisory Lock Integration:**
     - `SELECT pg_advisory_xact_lock(hashtext($1));`
  2. **Deterministic Multi-Entity UPSERT:**
     - Inserción de `projects` -> Obtención de `project_id` -> Inserción ordenada de `project_media` y `project_milestones` -> Actualización de `drive_sync_records.sync_status = 'PROCESSED'`.
  3. **Synthetic Key Fallback:**
     - Si un cliente no tiene `tax_id`, usar fallback determinista basado en `drive_file_id` para evitar duplicación.
- **Alternatives considered:**
  - *Bloqueo optimista en aplicación:* Descartado en favor de locks transaccionales de PostgreSQL por mayor fiabilidad.
- **Tradeoffs:**
  - El advisory lock es liberado automáticamente por PostgreSQL al terminar la transacción (`COMMIT` o `ROLLBACK`).

---

## Critique
- **Reviewer(s):** Architect Critic, Security Critic & QA Critic
- **Critical findings resolved:**
  1. *Concurrent Deadlocks:* Resuelto con advisory locks transaccionales por `drive_file_id`.
  2. *Metadata History Poisoning:* Resuelto fusionando campos preservando claves de auditoría previas.
  3. *Partial Insertion Inconsistencies:* Resuelto con transacciones atómicas completas.
- **Blocking concerns:** Ninguno restante.

---

## Resolution
- **Final approach after critique:** Repositorios fuertemente tipados y blindados con transacciones ACID y advisory locks.
- **Changes accepted:** Todas las recomendaciones integradas.
- **Changes rejected (with rationale):** Ninguno.

---

## Decision
- **Decision:** `approved`
- **Decision date:** `2026-08-25`
- **Decision owner:** `jaymusicmachine`
- **Approval notes:** Aprobado para desarrollo TDD.

---

## Status
- **Current status:** `approved`
- **Next action:** Escribir tests de integración en `postgres-repositories.test.ts`.
- **Exit criteria:**
  - [x] All critical critique points addressed
  - [x] Decision is `approved`
  - [x] Implementation completed with tests passing

---

## Test and Validation Plan
- **Unit tests:**
  1. Generación de sentencias SQL parametrizadas.
  2. Fallback de cliente sin `tax_id` a clave sintética única.
- **Integration tests:**
  1. Ejecución de UPSERT concurrente desde 2 procesos sobre el mismo `drive_file_id` (verificar serialización con advisory lock).
  2. Reversión completa de la transacción ante error forzado en inserción de medios.
- **Devnet validation (if applicable):** N/A
- **Responsive QA (if applicable):** N/A

---

## Traceability
- **Related issue(s):** `EPIC-001`, `STORY-001-12`
- **Related PR(s):** `TBD`
- **Final commit hash(es):** `TBD`
