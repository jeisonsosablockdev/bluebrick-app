# EPIC-001-admin-asset-create-form

## Metadata
- Epic ID: `EPIC-001`
- Title: `Admin Asset Create Form`
- Status: `in-review`
- Owner: `jaymusicmachine`
- Created: `2026-03-13`
- Last Updated: `2026-03-16`

## Scope
- Problem statement:
  El formulario de creación de activos en `/admin/assets/new` tiene fricción operativa en captura y carga de datos de app (off-chain), especialmente media/documentos e importación.
- Business goal:
  Reducir tiempo y errores para publicar entradas de marketplace con datos consistentes y completos para el usuario final.
- Technical goal:
  Consolidar captura administrativa en una sola ventana, separando explícitamente el alcance off-chain (en este epic) del pipeline blockchain (fase posterior).
- Out of scope:
  Ejecución de mint, reconciliación de webhooks, cron de fallback on-chain y automatización blockchain operativa.
  `coverImage` se obtiene desde metadata en Solana y no se persiste como media off-chain en este epic.

## Success Criteria
- [x] El admin puede subir múltiples archivos en `gallery`, `propertyImages`, `legalDocs` y `financialDocs`.
- [x] Los uploads off-chain se resuelven con GCS mediante Signed URLs.
- [x] `exitStrategy` definido como catálogo cerrado (`enum`).
- [x] `collectionSymbol` y `collectionName` se proponen automáticamente usando `slug` e `internalCode`, con override manual.
- [x] El formulario mantiene consistencia entre `fundingGoal` (referencia), `totalUnits` y `nftCost`.
- [x] Se elimina la gestión manual de estados comerciales en la UI.
- [x] Se habilita importación por archivo/pegado tabular desde Excel con preview.
- [x] Se agrega drag and drop para adjuntar media/documentos.
- [x] `coverImage` fuera de alcance off-chain y definido como fuente on-chain (Solana).
- [x] Perfil estricto de archivos activo: imágenes `5MB`, documentos `10MB`.
- [x] Entrega de media pública vía CDN/optimizer (sin servir GCS raw en frontend).
- [x] Estrategia de invalidación de caché CDN activa (versionado + purge excepcional).
- [x] Lifecycle stateful de huérfanos activo (`temporales 7 días`, `draft abandonado >30 días`).
- [x] Importación CSV asíncrona (chunking/job) para evitar timeouts HTTP.
- [x] Feedback asíncrono de CSV visible en UI (`importJobId` + estados de proceso).
- [x] Validaciones hardening (MIME/tamaño/sanitización CSV) cerradas y verificadas por tests.
- [ ] Persistencia off-chain de media/documentos cerrada end-to-end en producción.

## Execution Roadmap
- Milestone 1: Storage contract (GCS)
  - Signed URLs con restricciones (`Content-Type`, tamaño, expiración).
  - Contrato API de upload (`sign` + `finalize`) formalizado en `STORY-001-02-signed-url-contract.md`.
  - Convención de keys versionadas (hash), entrega por **Google Cloud CDN** e invalidación automatizada por evento (`asset.media.replaced -> cdn-invalidator`) con fallback manual RBAC.
  - Lifecycle stateful: temporales a `7 días`; asociados a draft solo se purgan con `status + updatedAt`.
- Milestone 2: UX integration
  - Dependencia: UI de upload bloqueada hasta tener en staging los endpoints de `STORY-001-02-signed-url-contract.md`.
  - Flujo único input + drag and drop.
  - Errores y estados por archivo.
- Milestone 3: CSV hardening
  - Dependencia: desbloqueada por aprobación de `STORY-001-03-csv-async-pipeline.md`; implementación sujeta a controles obligatorios de escalabilidad/seguridad.
  - Límites de tamaño/filas y procesamiento asíncrono por chunk/job usando cola externa (**QStash/Upstash**).
  - Contrato de feedback de job: `importJobId` + endpoint de estado + polling UI.
  - Sanitización de contenido y validación de headers.
- Milestone 4: Compatibility constraints
  - `collectionSymbol` max 10 bytes (UTF-8), alfanumérico.
  - `collectionName` max 32 bytes (UTF-8).
  - `exitStrategy` validado contra enum cerrado.
- Milestone 5: Verification gate
  - Unit + integration + security + responsive QA + rollback `all-or-nothing`.
- Milestone 6: Governance gate
  - Presupuesto de nuevos servicios entre `20-100 USD/mes`.
  - Servicios pagos solo con aprobación explícita previa.

## Story Index
| Story ID | Title | RFC File | Status | PR | Notes |
| --- | --- | --- | --- | --- | --- |
| STORY-001-01 | Marketplace Entry Off-chain | `STORY-001-01-kickoff.md` | `approved` | `#33, #35` | Evidencia staging adjunta; pendiente cierre de persistencia en producción y responsive QA |
| STORY-001-02 | Signed URL API Contract | `STORY-001-02-signed-url-contract.md` | `implemented` | `#35` | Flujo real `signed-url -> upload -> finalize` validado con reemplazo e invalidación CDN |
| STORY-001-03 | CSV Async Pipeline | `STORY-001-03-csv-async-pipeline.md` | `in-review` | `#35` | Caso staging de éxito/error validado; pendiente evidencia operativa dedicada de DLQ/retry |

## Decision Log
| Date | Story | Decision | Owner | Link |
| --- | --- | --- | --- | --- |
| 2026-03-13 | STORY-001-01 | RFC inicial creado para revisión | jaymusicmachine | `STORY-001-01-kickoff.md` |
| 2026-03-14 | STORY-001-01 | Alcance recortado a off-chain/app | jaymusicmachine | `STORY-001-01-kickoff.md` |
| 2026-03-14 | STORY-001-01 | Review solicita hardening explícito (storage + CSV + validaciones) | staff-review | `STORY-001-01-kickoff.md` |
| 2026-03-14 | STORY-001-01 | Plan revisado con roadmap ejecutable por fases | jaymusicmachine | `STORY-001-01-kickoff.md` |
| 2026-03-15 | STORY-001-01 | Ajuste de plan: bytes UTF-8, CSV async y CDN frente a GCS | jaymusicmachine | `STORY-001-01-kickoff.md` |
| 2026-03-15 | STORY-001-01 | Decisiones cerradas: CDN + invalidación, lifecycle stateful de huérfanos, feedback asíncrono CSV, budget 20-100, límites strict, enum exitStrategy | jaymusicmachine | `STORY-001-01-kickoff.md` |
| 2026-03-15 | STORY-001-01 | Aprobación por fases formalizada: 2/4/5 desbloqueadas; F1 requiere demo staging de invalidación CDN; F3 requiere RFC hijo | gemini-review | `STORY-001-01-kickoff.md` |
| 2026-03-15 | STORY-001-02 | RFC hijo creado para formalizar contrato Signed URL y evitar mocks en Fase 2 | jaymusicmachine | `STORY-001-02-signed-url-contract.md` |
| 2026-03-15 | STORY-001-02 | Debilidades críticas cerradas: UUIDv4, Content-MD5, draftId validado en finalize | gemini-review | `STORY-001-02-signed-url-contract.md` |
| 2026-03-15 | STORY-001-03 | RFC hijo creado para definir pipeline CSV asíncrono y desbloquear Fase 3 | jaymusicmachine | `STORY-001-03-csv-async-pipeline.md` |
| 2026-03-15 | STORY-001-03 | Aprobado con cambios: micro-batching, rate limit, transiciones atómicas, RBAC/sanitización y DLQ obligatorios | gemini-review | `STORY-001-03-csv-async-pipeline.md` |
| 2026-03-16 | STORY-001-01/02/03 | Evidence pack de staging ejecutado (GCS real, invalidación CDN, orphan-reconciler y CSV async) | jaymusicmachine | `artifacts/latest-validation.json` |

## Risks and Dependencies
- Risks:
  - Ambigüedad entre datos de app y datos blockchain si no se mantiene separación de alcance.
  - Timeouts y errores de carga si el upload no va directo a GCS.
  - Contenido obsoleto en UI sin invalidación de caché CDN.
  - Pérdida de archivos válidos si el lifecycle no se ata al estado del draft.
  - Fallos futuros de mint si validaciones off-chain no respetan límites por bytes.
  - Riesgo de inyección/oom en CSV si no se aplican límites y sanitización.
- Dependencies:
  - Operación de bucket GCS (IAM, lifecycle, observabilidad de errores).
  - Google Cloud CDN para servir media pública.
  - Cola externa (QStash/Upstash) para importación CSV asíncrona.
  - Contratos de validación server-side y pruebas automáticas de seguridad.
- Mitigations:
  - Plan por hitos con gates de validación.
  - Checklist operativo de GCS.
  - Estrategia de caché definida: keys versionadas + purge excepcional.
  - Política stateful de huérfanos basada en `status + updatedAt`.
  - Feedback asíncrono con estados explícitos de job en UI.
  - Gate financiero: no activar servicios pagos sin aprobación explícita.
  - Tests obligatorios antes de marcar `implemented` (incluye byte-length y rollback transaccional).

## Open Questions
- [x] `exitStrategy`: catálogo cerrado (`enum`) en fase off-chain.
- [x] Límites por categoría documental: imágenes `5MB` y documentos `10MB` (perfil estricto).

## Traceability
- Issue(s): `EPIC-001` (pendiente normalizar en tracker)
- PR(s): `#33`, `#35`
- Final commit hash(es): `f95d1d3`, `b2daf88`, `953e3b3`, `614c0e9`, `c597f43`, `8d0a940`, `c01953e`, `d51a871`, `d659948`
- Validation artifacts: `artifacts/latest-validation.json`, `artifacts/VALIDATION-2026-03-16.md`
