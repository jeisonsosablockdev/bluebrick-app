# STORY-001-01-kickoff

## Metadata
- Epic: `EPIC-001-admin-asset-create-form`
- Story ID: `STORY-001-01-kickoff`
- Status: `implemented` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-03-13`
- Last Updated: `2026-03-27`

## Context
- Problem:
  El admin necesita crear una entrada de marketplace desde `/admin/assets/new` con datos mixtos (app + mint), pero hoy la mayor fricción está en captura, carga y calidad de datos off-chain para experiencia de usuario.
- Product intent:
  Esta ventana concentra la preparación del activo. En este story solo se implementa la capa de datos de app (off-chain) para publicación/visualización; la ejecución de mint y lifecycle on-chain queda fuera.
- Scope boundary (mandatory):
  - Incluido: datos y flujos no blockchain (media/documentos, descripciones comerciales, importación tabular, UX de carga).
  - Excluido: ejecución de mint, conciliación de webhooks, cron on-chain, estados comerciales derivados de cadena.
- Constraints:
  Validaciones críticas server-side, UX responsive y evitar contradicciones entre campos de app y pipeline blockchain futuro.
- Affected paths:
  `/admin/assets/new`, `components/admin/asset-creation-form.tsx`, utilidades de parsing/import y plantillas CSV.

## Proposal
- Approach summary:
  Reenfocar `Admin Asset Form V3` a `Marketplace Entry Off-chain`: el formulario sigue capturando campos para contexto operativo completo, pero este story persiste y valida solo la parte app/off-chain.
- Data model split:
  - Off-chain/app (en alcance): `assetName`, ubicación, descripciones, tesis/riesgos, video, y media/documentos (`galleryImages`, `propertyImages`, `legalDocs`, `financialDocs`, `brochureFile`).
  - Blockchain/on-chain (fuera de alcance de persistencia en este story): ejecución de mint, estados comerciales on-chain, reconciliación y automatizaciones de cadena.
  - Nota de alcance: `coverImage` se toma desde metadata en Solana y queda fuera del flujo de persistencia off-chain de este story.
- Storage decision (resolved):
  - Proveedor: Google Cloud Storage (GCS).
  - Patrón de upload: Signed URLs para carga directa desde cliente.
  - Distribución para frontend vía **Google Cloud CDN** (no servir assets raw de GCS en páginas públicas).
  - El formulario persiste referencias de archivo (bucket/key/cdnUrl) y metadatos (`mimeType`, `sizeBytes`, `uploadedAt`).
  - Estrategia de caché (execution-ready):
    - Object key versionada con hash de contenido para evitar stale cache.
    - `Cache-Control: public, max-age=31536000, immutable` en assets versionados.
    - Purga programática por path ante reemplazos no-versionados o rollback operativo.
    - Disparador automático: `AssetMediaService` al confirmar reemplazo de archivo (`oldKey -> newKey`) emite evento `asset.media.replaced`.
    - Ejecutor: worker `cdn-invalidator` (cola) consume el evento y ejecuta invalidación en Google Cloud CDN.
    - Confiabilidad: reintentos exponenciales (`3`), DLQ y alerta operacional si el purge falla.
    - Fallback manual controlado: endpoint admin RBAC `POST /api/admin/cdn/purge` para incidentes.
  - Política de huérfanos por estado:
    - Upload temporal no asociado a draft: purge automático a `7 días`.
    - Upload asociado a draft activo: se conserva.
    - Purge de draft abandonado solo cuando `status in (draft, paused)` y `updatedAt > 30 días`.
    - Ejecución diaria por job `orphan-reconciler` con validación previa de referencias activas antes de borrar.
- Validation contract (resolved):
  - `collectionSymbol`: máximo 10 bytes UTF-8, alfanumérico en mayúsculas (`^[A-Z0-9]{1,10}$`).
  - `collectionName`: máximo 32 bytes UTF-8 (`Buffer.byteLength(value, "utf8") <= 32`).
  - `exitStrategy`: catálogo cerrado (`enum`) definido por producto.
  - Rechazo estricto por categoría de archivo (MIME) y tamaño, con perfil estricto:
    - Imágenes (`galleryImages`, `propertyImages`): máximo `5MB` por archivo.
    - Documentos (`brochureFile`, `legalDocs`, `financialDocs`): máximo `10MB` por archivo.
  - Sanitización de importación tabular para prevenir fórmula injection/XSS.
- CSV/import contract (resolved):
  - Límite duro de tamaño de archivo y filas.
  - Procesamiento asíncrono por chunk/job (no bloqueante en request principal) con cola externa (**QStash/Upstash**).
  - Política de consistencia: `all-or-nothing` (rollback completo ante error).
  - Protocolo de feedback asíncrono:
    - La API devuelve `importJobId` + `statusUrl` en la respuesta inicial.
    - Endpoint de estado: `GET /api/admin/assets/import-jobs/:id`.
    - Estados: `queued | processing | completed | completed_with_errors | failed`.
    - Payload de estado incluye `totalRows`, `processedRows`, `failedRows`, `errorReportUrl`.
    - UI realiza polling cada 2-3s, muestra progreso y resultado final con resumen accionable de errores.
    - SLA visible: si no hay transición de estado en `60s`, UI muestra estado `delayed` con opción de reintento y soporte.
  - Parsing defensivo y reporte por celda/fila.
  - Normalización por alias de encabezados.
- Operational and cost contract (resolved):
  - Presupuesto para servicios nuevos: `20-100 USD/mes`.
  - Cualquier servicio pago nuevo requiere aprobación explícita previa antes de habilitarse en entorno real.

## Implemented Changes Included
- Multi-upload en media/documentos.
- Drag and drop para adjuntar archivos en media/documentos.
- Importación por CSV/pegado Excel con mapeo robusto de encabezados.
- UI de importación con feedback asíncrono (`importJobId`, polling, progreso, errores).
- Sugerencia automática de `collectionName` y `collectionSymbol` usando `slug + internalCode` (editable override).
- Remoción de estados manuales comerciales en la UI.
- Regla dinámica de equilibrio entre `fundingGoal` (referencia), `totalUnits` y `nftCost`.
- `expectedAnnualReturn` en formato porcentaje.
- Campos `metadataBaseName` y `metadataBaseUri` excluidos del flujo actual.
- Endpoint admin manual `POST /api/admin/cdn/purge` para fallback de invalidación.
- Hook de invalidación en reemplazo de media desde `finalize` (`previousCdnUrl` opcional).
- Reconciliador lifecycle para huérfanos (`orphan-reconciler`, dry-run/execute).

## Execution Plan
- Phase 1: Storage hardening (GCS)
  - Entregables:
    - Endpoint server-side para Signed URLs con restricciones de `Content-Type`, `Content-Length` y expiración corta.
    - Contrato formal de API Signed URLs (`sign` + `finalize`) definido en `STORY-001-02-signed-url-contract.md`.
    - Convención de object key versionada (hash) para compatibilidad de caché.
    - Estrategia de entrega por **Google Cloud CDN** para media de marketplace.
    - Política stateful de huérfanos basada en `status + updatedAt`.
    - Persistencia de referencia final en contrato de app.
  - Definition of done:
    - `STORY-001-02-signed-url-contract.md` aprobado por revisión externa.
    - Upload directo a GCS operativo para categorías off-chain (`galleryImages`, `propertyImages`, `brochureFile`, `legalDocs`, `financialDocs`).
    - Estrategia de invalidación de caché documentada y validada.
    - Hook automático `asset.media.replaced -> cdn-invalidator` desplegado en staging con evidencia de purge exitoso.
    - Log de auditoría de invalidaciones (`assetId`, `paths`, `status`, `attempts`, `traceId`) consultable.
- Phase 2: Form + upload integration
  - Entregables:
    - Prerrequisito: no iniciar implementación de UI de upload hasta aprobación de `STORY-001-02-signed-url-contract.md`.
    - Unificación de flujo input tradicional + drag and drop para media/documentos off-chain (excepto `coverImage`).
    - Mensajes de error por tipo/tamaño y estado por archivo.
  - Definition of done:
    - UI de upload integrada contra endpoints reales (`signed-url` y `finalize`) sin mocks.
    - El admin puede agregar, reemplazar y remover archivos sin overflow ni estados ambiguos.
- Phase 3: CSV and sanitization hardening
  - Entregables:
    - Validaciones server-side con límites de tamaño/filas.
    - Pipeline asíncrono para importación (chunking/queue) con **QStash/Upstash**, evitando timeouts HTTP.
    - Contrato de feedback de estado para UI basado en `importJobId`.
    - Sanitización de contenido tabular y validación de columnas obligatorias.
  - Definition of done:
    - Importación rechaza payloads inválidos con feedback claro por celda y sin bloquear el request principal.
    - El usuario ve estados `queued/processing/completed_with_errors/failed` sin caja negra.
- Phase 4: Compatibility and constraints
  - Entregables:
    - Validaciones de `collectionSymbol` y `collectionName` alineadas a restricciones futuras.
    - Reglas de coherencia en `fundingGoal`/`totalUnits`/`nftCost`.
  - Definition of done:
    - No se aceptan valores incompatibles con la fase blockchain posterior.
- Phase 5: QA and release readiness
  - Entregables:
    - Suite de pruebas unitarias/integración + QA responsive.
    - Checklist operativo de GCS (permisos, lifecycle, observabilidad).
  - Definition of done:
    - Criterios de salida del story en estado cumplido.

## Critique (Review Snapshot)
- **3 Critical Weaknesses (pre-fix)**:
  1. **Validación Metaplex (Bytes vs Chars)**: Hallazgo original: usar límites por caracteres en lugar de bytes podía romper el mint futuro. Estado actual: **resuelto** con validación por bytes UTF-8.
  2. **Colapso Síncrono del CSV (Vercel Timeouts)**: Hallazgo original: importación bloqueante en request principal. Estado actual: **resuelto en plan** con pipeline asíncrono/chunking.
  3. **GCS Raw en frontend**: Hallazgo original: servir media pública directo desde GCS elevaba egress y degradaba LCP. Estado actual: **resuelto en plan** con CDN/optimizer.
- **Execution Risks**:
  - **MIME Spoofing en Signed URLs**: Riesgo mitigado con firma restrictiva de `Content-Type`, validación de extensión y verificación server-side post-upload.
  - **Basura Huérfana (Orphaned Files)**: Riesgo mitigado con lifecycle policy, limpieza automática y expiración de drafts no confirmados.
- **Uncovered Edge Cases**:
  - Fallo en fila 99/100 durante importación: resuelto con política `all-or-nothing` y rollback completo.
- **Stack Alignment**:
  - **@metaplex**: Alineado en el plan revisado usando validación off-chain por bytes (`Buffer.byteLength`) para mapear al estándar.
- **Incorrect Assumptions**:
  - Asumir que recolectar datos "solo off-chain" te exime de las validaciones de estructura de datos on-chain.
  - Asumir que Next.js puede manejar importaciones masivas de forma bloqueante.
- **Mandatory Tests**:
  - Pruebas unitarias de Zod que fallen con strings de 32 caracteres que excedan 32 bytes.
  - Prueba de rechazo de subida alterando el MIME type tras recibir la Signed URL.
  - Prueba de concurrencia y timeout simulado para el procesamiento de CSV.
- **Verdict (pre-fix)**: `reject`

## Resolution
- Final approach after critique:
  Se acepta el recorte off-chain, pero con plan técnico explícito y verificable para storage, validaciones y seguridad de importación.
- Accepted:
  - Uso obligatorio de GCS + Signed URLs con restricciones server-side (MIME/size/TTL).
  - Entrega de media pública por **Google Cloud CDN** para evitar costos de egress y degradación de LCP.
  - Invalidación de caché definida por versionado de keys + purga explícita en casos excepcionales.
  - Validación estricta por bytes UTF-8 en `collectionSymbol`/`collectionName`.
  - Importación CSV asíncrona con **QStash/Upstash**, chunking y política `all-or-nothing`.
  - Feedback asíncrono de CSV definido por `importJobId` + polling de estados.
  - `exitStrategy` definido como `enum` cerrado.
  - `coverImage` explícitamente fuera de scope off-chain; fuente on-chain desde Solana.
  - Perfil estricto de límites de archivos (imágenes 5MB, documentos 10MB).
  - Lifecycle stateful de huérfanos: temporales a 7 días y drafts abandonados por `updatedAt > 30 días`.
  - Presupuesto objetivo `20-100 USD/mes` y aprobación explícita previa para activar servicios pagos.
  - Límites/sanitización de CSV como requisito no negociable.
  - Persistencia de media/documentos como referencias de app (no on-chain).
- Rejected:
  - Reintroducir selector manual de estados comerciales (`draft/published/sold_out/paused/closed`) en esta fase.
  - Acoplar en este story la orquestación on-chain completa.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-03-15`
- Decision owner: `gemini-review`
- Approval notes:
  Aprobado. La ejecución está condicionada y por fases para mitigar el riesgo de dependencia.
  1. **Fases 4 y 5 (Compatibilidad, QA) → DESBLOQUEADAS.** Pueden iniciar.
  2. **Fase 2 (UI - Form Integration) → PARCIALMENTE BLOQUEADA.** El contrato `STORY-001-02-signed-url-contract.md` está aprobado. El bloqueo restante es de ejecución: no iniciar UI de subida hasta tener endpoints staging (`signed-url` y `finalize`) operativos.
  3. **Fase 1 (Storage/CDN) → BLOQUEADA.** La implementación completa (workers, CDN, etc.) sigue bloqueada hasta la demostración en staging.
  4. **Fase 3 (CSV Asíncrono) → DESBLOQUEADA CON CONTROLES OBLIGATORIOS.** El RFC hijo `STORY-001-03-csv-async-pipeline.md` está aprobado. La implementación debe incluir micro-batching, rate limiting de creación de jobs, transiciones atómicas de estado, RBAC/sanitización del endpoint de errores y manejo de DLQ para poison pills.

## Status
- Current status: `implemented`
- Next action:
  Story cerrada. Mantener monitoreo operativo normal y evolución en stories nuevas.
- Exit criteria:
- [x] Scope redefinido a off-chain/app.
- [x] Cambios de UI implementados y reflejados en RFC.
- [x] Proveedor de storage definido (GCS).
- [x] Plan de mitigación de riesgos de revisión documentado.
- [x] Persistencia off-chain cerrada end-to-end con contrato estable (staging/local + validación automática).
- [x] Story marcado como `implemented`.

## Phase 1 Unlock Evidence (Staging)
- Required artifact pack:
  1. Prueba de upload real a GCS por Signed URL (`signed-url` + `finalize`) con `uploadId`.
  2. Prueba de reemplazo de asset (`oldKey -> newKey`) y emisión del evento `asset.media.replaced`.
  3. Ejecución del worker `cdn-invalidator` y resultado de invalidación `SUCCESS`.
  4. Verificación de propagación en frontend (contenido actualizado visible sin stale cache).
  5. Evidencia de observabilidad: log estructurado (`assetId`, `paths`, `status`, `attempts`, `traceId`) y métrica/alerta asociada.
- Suggested command checklist (gcloud):
  - `gcloud config list --format='text(core.project,core.account)'`
  - `gcloud storage buckets describe <BUCKET_NAME> --format='yaml(name,location,lifecycle)'`
  - `gcloud compute backend-buckets describe <BACKEND_BUCKET> --global --format='yaml(name,bucketName,enableCdn,cdnPolicy)'`
  - `gcloud compute url-maps describe <URL_MAP> --format='yaml(name,defaultService,pathMatchers)'`
  - `gcloud compute url-maps invalidate-cdn-cache <URL_MAP> --path \"<ASSET_PATH>\" --async`
- Unlock rule:
  Fase 1 solo se considera desbloqueada cuando el artifact pack completo está adjunto al PR/RFC y validado por revisión externa.
- Artifact pack adjunto (2026-03-16):
  - `knowledge/rfcs/EPIC-001-admin-asset-create-form/artifacts/latest-validation.json`
  - `knowledge/rfcs/EPIC-001-admin-asset-create-form/artifacts/VALIDATION-2026-03-16.md`

## Test and Validation Plan
- Unit tests:
  - Parseo/importación tabular y mapeo de aliases de columnas.
  - Regla de equilibrio `fundingGoal`/`totalUnits`/`nftCost`.
  - Validación de `collectionSymbol` y `collectionName` por bytes UTF-8.
  - Validación de `exitStrategy` contra enum cerrado.
- Integration tests:
  - Flujo de upload con Signed URL de GCS y persistencia de referencia final.
  - Reemplazo de archivo y visibilidad inmediata mediante estrategia de caché CDN.
  - Flujo de carga media/documentos (input tradicional + drag and drop).
  - Importación asíncrona de archivo + preview + aplicación de primera fila usando cola externa y polling de estado.
- Security tests:
  - Rechazo por MIME/type y tamaño por categoría (incluye MIME spoofing).
  - Sanitización de CSV/Excel contra fórmula injection/XSS.
  - Validación de rollback completo para `all-or-nothing` en fallos de importación.
  - Validación de lifecycle stateful (`temporales 7 días`, `draft abandonado >30 días`) en staging.
- Responsive QA:
  Verificar formulario en `320px`, `375px`, `768px`, `1024px` sin overflow horizontal.
- Devnet validation:
  `N/A` en este story (alcance off-chain).

## Traceability
- Related issue(s): `EPIC-001` (pendiente normalizar IDs en tracker)
- Related PR(s): `#33` (base epic), `PENDING-PR-STACK-V4` (ajustes en curso)
- Final commit hash(es): `f95d1d3` (base), `b2daf88`, `953e3b3`, `614c0e9`, `c597f43`, `8d0a940`, `c01953e`, `d51a871`, `d659948`
