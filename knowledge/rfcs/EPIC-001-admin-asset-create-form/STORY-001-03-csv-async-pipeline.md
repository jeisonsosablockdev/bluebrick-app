# STORY-001-03-csv-async-pipeline

## Metadata
- Epic: `EPIC-001-admin-asset-create-form`
- Story ID: `STORY-001-03-csv-async-pipeline`
- Status: `implemented` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-03-15`
- Last Updated: `2026-03-26`

## Context
- Problema:
  La importación CSV síncrona en request HTTP es frágil (timeouts y caja negra para el admin), por lo que la Fase 3 requería definir una arquitectura asíncrona operable.
- Objetivo:
  Definir pipeline asíncrono de importación CSV sin mocks, con feedback visible de progreso y política de consistencia `all-or-nothing`.
- Alcance:
  Contrato API, máquina de estados, colas QStash/Upstash, persistencia de jobs y estrategia de reintentos/errores.

## Proposal
- API contract
  - `POST /api/admin/assets/import-jobs`
    - Crea job de importación y devuelve `importJobId` + `statusUrl`.
    - Request: archivo CSV, `draftId` opcional, `idempotencyKey` opcional.
    - Response `202`: `importJobId`, `statusUrl`, `state=queued`.
  - `GET /api/admin/assets/import-jobs/:id`
    - Response: `state`, `totalRows`, `processedRows`, `failedRows`, `warningsCount`, `errorReportUrl`.
    - Estados válidos: `queued | processing | completed | completed_with_errors | failed`.
  - `GET /api/admin/assets/import-jobs/:id/errors`
    - Entrega errores detallados por fila/celda (`row`, `column`, `code`, `message`).

- Job model (DB)
  - `import_jobs`:
    - `id`, `actorId`, `draftId`, `state`, `sourceFileKey`, `idempotencyKey`, `createdAt`, `updatedAt`, `startedAt`, `finishedAt`.
    - contadores: `totalRows`, `processedRows`, `failedRows`, `warningsCount`.
  - `import_job_errors`:
    - `id`, `jobId`, `rowNumber`, `columnName`, `errorCode`, `errorMessage`.

- Processing architecture
  - Enqueue con QStash/Upstash al crear job (`state=queued`).
  - Worker `csv-import-worker` consume y mueve a `processing`.
  - Pipeline por etapas:
    1. Parseo streaming con límites (`maxRows`, `maxBytes`) y sanitización anti formula injection/XSS.
    2. Validación de esquema y reglas de negocio (sin escribir en producción todavía).
    3. Commit transaccional único (`all-or-nothing`): si una fila falla, rollback total.
    4. Publicación de resultado (`completed` o `failed`) y persistencia de reporte de errores.
  - Idempotencia:
    - Si `idempotencyKey` ya existe y job sigue activo/finalizado, se devuelve el mismo `importJobId`.

- Retry and failure strategy
  - Reintentos automáticos de worker: 3 con backoff exponencial.
  - DLQ para mensajes agotados.
  - Timeout de job configurable con transición a `failed`.
  - Alertas operativas cuando hay `failed` sostenidos o crecimiento de DLQ.

- UI feedback contract (sin caja negra)
  - Polling cada 2-3s a `statusUrl`.
  - Si no hay transición de estado en 60s, mostrar `delayed` con opción de reintento.
  - Mostrar resumen final con descarga/consulta de `errorReportUrl`.

- Security and compliance
  - Validación server-side obligatoria de tamaño/MIME/headers del archivo.
  - Sanitización de celdas para prevenir ejecución de fórmulas al exportar/visualizar.
  - Auth RBAC admin para crear y consultar jobs.

## Critique
- **3 Critical Weaknesses**:
  1. **Database Contention at Scale**: The `all-or-nothing` commit strategy, while ensuring consistency, is a scalability risk. A single, large transaction for thousands of rows will hold long-lived locks on the database, causing contention and blocking other operations. The architecture must evolve to use micro-batching within a single job.
  2. **Missing User-Level Rate Limiting**: The proposal lacks a rate-limiting strategy for *creating* import jobs. A single user could enqueue hundreds of jobs, leading to a Denial of Service (DoS) by exhausting queue capacity and compute resources.
  3. **Insecure Error Report Handling**: The `errorReportUrl` is undefined. If it's a public pre-signed URL, it could leak sensitive data from the original CSV. The `/errors` endpoint is better, but it must be secured with the same RBAC as the job creation endpoint and must sanitize all data before rendering to prevent XSS from the original file.
- **Execution Risks**:
  - **"Poison Pill" Message**: A malformed CSV that repeatedly fails parsing could get stuck in a retry loop, consuming resources indefinitely. The worker needs a mechanism to detect and flag such messages after a set number of retries and move them to a Dead-Letter Queue (DLQ) for manual inspection.
  - **State Transition Race Conditions**: If a job times out and is marked `failed` by a watchdog while the worker is still processing, a race condition can occur. All state transitions must be atomic and conditional (e.g., `UPDATE jobs SET state = 'completed' WHERE id = ? AND state = 'processing'`).
- **Uncovered Edge Cases**:
  - **Header Alias Collision**: The proposal mentions "Normalización por alias de encabezados". It doesn't define what happens if two columns in the CSV map to the same canonical field (e.g., "Nombre" and "Name"). The behavior (first wins, last wins, or error) must be specified.
- **Incorrect Assumptions**:
  - Assuming a single, monolithic database transaction for a large import is a scalable pattern.
- **Mandatory Tests**:
  - A load test simulating a large CSV import to measure database lock duration.
  - A test to verify that a user cannot create an excessive number of import jobs in a short period.
  - A security test to ensure the `/errors` endpoint is protected by RBAC and its output is sanitized.
  - A test with a "poison pill" CSV to confirm it's correctly moved to the DLQ after exhausting retries.
- **Verdict**: `approve with changes`

## Resolution
- Se adopta pipeline asíncrono con cola externa y `all-or-nothing`.
- Se establece contrato de feedback obligatorio para UI.
- La implementación debe incorporar micro-batching en la transacción de base de datos, rate-limiting en la creación de jobs y RBAC seguro en el endpoint de errores.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-03-15`
- Decision owner: `gemini-review`
- Approval notes:
  Aprobado. La arquitectura es sólida. La implementación debe incorporar las mitigaciones de la sección `Critique` para garantizar la escalabilidad y seguridad del pipeline. Con esta aprobación, la **Fase 3** del `STORY-001-01` queda formalmente desbloqueada.

## Status
- Current status: `implemented`
- Next action:
  1. Mantener monitoreo de cola (`failed` + crecimiento DLQ) como control operativo.
  2. Consolidar evidencia en el RFC del epic para cierre global.

## Validation Evidence (2026-03-16)
- Caso asíncrono validado end-to-end:
  - `POST /api/admin/assets/import-jobs` -> `202` (`state: queued`).
  - Procesamiento worker en segundo plano (`/process`) ejecutado vía cola asíncrona.
  - `GET /api/admin/assets/import-jobs/:id` -> estado terminal `completed_with_errors`.
- Feedback de errores validado:
  - `GET /api/admin/assets/import-jobs/:id/errors` -> `count: 1`.
  - Error reportado: `EXIT_STRATEGY_INVALID` en fila 2 (`buildingExitStrategy`).
- Sanitización/validación de contrato visibles en respuesta de estado:
  - `totalRows: 2`, `processedRows: 2`, `failedRows: 1`, `errorReportUrl` presente.
- Evidencia completa:
  - `docs/rfcs/EPIC-001-admin-asset-create-form/artifacts/latest-validation.json`
  - `docs/rfcs/EPIC-001-admin-asset-create-form/artifacts/VALIDATION-2026-03-16.md`

## Validation Evidence (2026-03-26)
- Cobertura dedicada `retry -> failed -> DLQ` agregada:
  - `tests/lib/import-jobs-processing-failure.test.ts`
    - Reintento transitorio mantiene estado `queued`.
    - Agotamiento de intentos inserta en `asset_import_job_dlq` y registra `POISON_PILL`.
  - `tests/api/admin-import-jobs-routes.test.ts`
    - Error worker terminal (`failedPermanently=true`) no re-encola el job.
- Corrida ejecutada:
  - `npm run test -- tests/lib/import-jobs.test.ts tests/lib/import-jobs-processing-failure.test.ts tests/api/admin-import-jobs-routes.test.ts`
  - Resultado: `24 passed`.

## Traceability
- Related issue(s): `EPIC-001`
- Related PR(s): `#35`
- Final commit hash(es): `c597f43`, `8d0a940`, `c01953e`
