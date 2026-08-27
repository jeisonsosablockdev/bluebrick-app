---
type: RFC
title: STORY-001-03 Google Drive Changes API & Differential Polling Engine
description: RFC Story for polling Google Drive changes via startPageToken, md5Checksum deduplication, 410 Gone recovery, composite hash for Google Docs, and folder traversal.
tags: [rfc, story, google-drive, polling, differential-sync, security, 4-layers]
timestamp: 2026-08-25T00:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-001-ai-augmented-ingestion-pipeline/STORY-001-03-drive-changes-polling.md
---

# STORY-001-03-drive-changes-polling

## Metadata
- Epic: `EPIC-001-ai-augmented-ingestion-pipeline`
- Story ID: `STORY-001-03`
- Status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `feature/001-03-drive-changes-polling`
- Created: `2026-08-25`
- Last Updated: `2026-08-27`

---

## Context
- **Problem:** Escanear recursivamente todos los archivos de Google Drive en cada ciclo consume cuota de API, es lento y genera costos innecesarios. Se requiere un motor de sincronización diferencial basado en `changes.list` con persistencia de tokens de página y mitigación de tokens expirados (`410 Gone`).
- **Why now:** Permite procesar únicamente archivos nuevos o modificados en las carpetas "Bóveda de Clientes" y "Proyectos".
- **Constraints:**
  - Manejo de token expirado (`HTTP 410 Gone`): Ejecutar reconciliación diferencial ligera de metadatos sin descargar el contenido binario masivamente.
  - Soporte de Google Docs / Sheets nativos (que no poseen `md5Checksum` nativo): Generar un hash SHA-256 compuesto (`modifiedTime + version + size`).
  - Límite de paginación de seguridad: `MAX_PAGES_PER_POLL = 20` (máx. 2,000 cambios por ejecución de cron) para evitar bloqueos por timeout en Vercel Serverless.
  - Sanitización de rutas y nombres de archivo para prevenir Path Traversal (`../`).
- **Affected paths:**
  - `apps/web/src/features/ai-ingestion/domain/ports/drive-changes-port.ts`
  - `apps/web/src/features/ai-ingestion/infrastructure/google-drive-changes-adapter.ts`
  - `apps/web/src/features/ai-ingestion/application/services/differential-sync-service.ts`
  - `apps/web/src/features/ai-ingestion/domain/models/sync-event-models.ts`
  - `apps/web/src/features/ai-ingestion/infrastructure/google-drive-changes-adapter.test.ts`

---

## Proposal
- **Approach summary:** Implementar el puerto `IGoogleDriveChangesPort` y el adaptador `GoogleDriveChangesAdapter` que consume la API `changes.list` de Google Drive v3, soportando filtrado por `folderId`, reconciliación segura ante 410 y hash determinista.
- **Technical design:**
  1. **Differential Polling:**
     - Consumo de `changes.getStartPageToken` y `changes.list(pageToken)`.
     - Detección de cambios de tipo `file` y eventos `removed / trashed`.
  2. **Composite Hash Calculation:**
     - Para binarios: uso de `file.md5Checksum`.
     - Para Google Workspace docs: SHA-256(`file.id + file.modifiedTime + file.version`).
  3. **Path Traversal Sanitizer:**
     - Normalización de rutas de carpetas relativas.
- **Alternatives considered:**
  - *Google Drive Webhooks (Push Notifications):* Descartadas en fase inicial por requerir dominio público con SSL verificado y endpoint permanente; el sondeo diferencial por cron es más predecible y desacoplado.
- **Tradeoffs:**
  - El polling ligero por cron consume cuotas mínimas y no sufre de caídas silenciosas de webhook.

---

## Critique
- **Reviewer(s):** Architect Critic, Security Critic & QA Critic
- **Critical findings resolved:**
  1. *410 Gone PageToken Invalidation Storm:* Resuelto con reconciliación exclusiva de metadatos.
  2. *Google Docs Null MD5 Crash:* Resuelto con hash compuesto determinista.
  3. *Unbounded Pagination Infinite Loop:* Resuelto con límite estricto de 20 páginas por sondeo.
- **Blocking concerns:** Ninguno restante.

---

## Resolution
- **Final approach after critique:** Adaptador de cambios diferencial blindado contra fallos de token y bucles infinitos.
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
- **Next action:** Escribir tests unitarios en `google-drive-changes-adapter.test.ts`.
- **Exit criteria:**
  - [x] All critical critique points addressed
  - [x] Decision is `approved`
  - [ ] Implementation completed with tests passing

---

## Test and Validation Plan
- **Unit tests:**
  1. Manejo y recuperación automática de `410 Gone`.
  2. Generación de hash compuesto para documentos nativos de Google Workspace.
  3. Límite de corte tras 20 páginas consecutivas.
  4. Sanitización de caracteres maliciosos en nombres de archivos y carpetas.
- **Integration tests:**
  - Sondeo diferencial simulando inserción y modificación de archivos.
- **Devnet validation (if applicable):** N/A
- **Responsive QA (if applicable):** N/A

---

## Traceability
- **Related issue(s):** `EPIC-001`, `STORY-001-03`
- **Related PR(s):** `TBD`
- **Final commit hash(es):** `TBD`
