---
type: RFC
title: STORY- 001 02 Signed Url Contract
description: STORY- 001 02 Signed Url Contract - migrated from docs/
tags: [rfcs]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/rfcs/EPIC-001-admin-asset-create-form/STORY-001-02-signed-url-contract.md
---

# STORY-001-02-signed-url-contract

## Metadata
- Epic: `EPIC-001-admin-asset-create-form`
- Story ID: `STORY-001-02-signed-url-contract`
- Status: `implemented` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-03-15`
- Last Updated: `2026-03-16`

## Context
- Problema:
  La Fase 2 (UI de subida) no puede avanzar sin un contrato API estable para Signed URLs; de lo contrario, el frontend cae en mocks y retrabajo.
- Objetivo:
  Definir contrato backend-first para uploads off-chain en GCS, con seguridad estricta y flujo de finalización verificable.
- Alcance:
  API server-side para generar Signed URLs y finalizar upload para categorías de media/documentos off-chain.

## Proposal
- Endpoint 1: generar Signed URL
  - Método/Ruta: `POST /api/admin/assets/uploads/signed-url`
  - Auth: sesión admin obligatoria (`401/403` si falla).
  - Request:
    - `category`: `galleryImage | propertyImage | brochureFile | legalDoc | financialDoc`
    - `fileName`: `string` (1-160)
    - `mimeType`: `string` (allowlist por categoría)
    - `sizeBytes`: `number` (>0 y <= límite categoría)
    - `contentMd5Base64`: `string` obligatorio (hash MD5 en Base64 del archivo)
    - `draftId`: `string` obligatorio (UUID)
  - Validaciones:
    - Imágenes (`galleryImage`, `propertyImage`) máximo `5MB`.
    - Documentos (`brochureFile`, `legalDoc`, `financialDoc`) máximo `10MB`.
    - Rechazo de MIME no permitido y extensiones incompatibles.
  - Response `200`:
    - `uploadId`: `string` (UUIDv4 criptográficamente aleatorio)
    - `uploadUrl`: `string`
    - `method`: `"PUT"`
    - `requiredHeaders`: `{ "Content-Type": string, "Content-Length": string, "Content-MD5": string }`
    - `objectKey`: `string`
    - `expiresAt`: `string` (ISO8601)
    - `maxSizeBytes`: `number`
    - `finalizeUrl`: `string`
  - Error contract:
    - `400 INVALID_UPLOAD_REQUEST`
    - `401 UNAUTHENTICATED`
    - `403 FORBIDDEN`
    - `413 FILE_TOO_LARGE`
    - `415 MIME_NOT_ALLOWED`
    - `429 RATE_LIMITED`
    - `500 SIGN_URL_FAILED`

- Endpoint 2: finalizar upload
  - Método/Ruta: `POST /api/admin/assets/uploads/:uploadId/finalize`
  - Auth: sesión admin obligatoria.
  - Request:
    - `draftId`: `string` obligatorio (UUID)
    - `etag`: `string` opcional
    - `sizeBytes`: `number`
    - `mimeType`: `string`
    - `contentMd5Base64`: `string` obligatorio
  - Comportamiento:
    - Valida formato de `uploadId` (UUIDv4).
    - Verifica existencia del objeto en GCS.
    - Revalida `sizeBytes` + `mimeType` + `contentMd5Base64` contra el contrato firmado.
    - Verifica que `draftId` coincida con el `draftId` asociado al `uploadId` en `signed-url`.
    - Registra referencia temporal (`bucket`, `objectKey`, `cdnUrl`, `uploadedAt`).
  - Response `200`:
    - `fileRefId`: `string`
    - `bucket`: `string`
    - `objectKey`: `string`
    - `cdnUrl`: `string`
    - `uploadedAt`: `string` (ISO8601)
  - Error contract:
    - `400 INVALID_UPLOAD_ID`
    - `404 UPLOAD_NOT_FOUND`
    - `409 UPLOAD_EXPIRED`
    - `409 DRAFT_MISMATCH`
    - `422 CONTENT_MD5_MISMATCH`
    - `422 UPLOAD_VALIDATION_FAILED`
    - `500 FINALIZE_FAILED`

- Reglas de implementación sin mocks
  - La UI **debe** usar el `uploadUrl` real retornado por la API.
  - Se prohíbe el uso de stubs/mocks para `uploadUrl`, `fileRefId` o `cdnUrl` en el código mergeado.
  - Entornos de dev/staging **deben** usar un bucket GCS real de no-producción.

- Observabilidad mínima
  - Métricas:
    - `signed_url_requests_total`
    - `signed_url_failures_total`
    - `upload_finalize_failures_total`
  - Log estructurado con `uploadId`, `draftId`, `category`, `actorId`, `traceId`.

## Critique
- **3 Critical Weaknesses (resolved in this revision)**:
  1. **`uploadId` Predictability**: resuelto forzando UUIDv4 criptográficamente aleatorio.
  2. **Missing Data Integrity Header**: resuelto al exigir `Content-MD5` en headers firmados.
  3. **Ambiguous `draftId` Association**: resuelto al requerir `draftId` en `signed-url` y `finalize`, con validación estricta de coincidencia.
- **Execution Risks**:
  - An attacker could spam the `finalize` endpoint with guessed `uploadId`s, causing DoS on the database or GCS metadata checks.
- **Uncovered Edge Cases**:
  - The user's browser crashes after a successful GCS upload but before the `finalize` call. The file is orphaned. The client-side implementation should include a mechanism (e.g., `localStorage`) to retry the `finalize` call on session restoration.
  - The `finalize` endpoint is not specified as idempotent. If the GCS check passes but the internal DB write fails, a simple retry might fail. The endpoint must handle this gracefully (e.g., `find-or-create` logic).
- **Mandatory Tests**:
  - A test must assert that a `finalize` call fails if the `draftId` provided does not match the one associated with the `uploadId` during signing.
  - A test must assert that an upload to GCS with a valid Signed URL but an incorrect `Content-MD5` header is rejected by GCS.
  - A test must confirm that `uploadId` is a non-sequential, cryptographically random string (e.g., matches UUIDv4 format).
  - A test must assert that the generated `objectKey` properly sanitizes the input `fileName` to prevent path traversal or invalid characters.
- **Verdict**: `approved with required controls integrated`

## Resolution
- Se adopta contrato API backend-first con doble validación (`sign` + `finalize`).
- Se integra control de integridad (`Content-MD5`) en la firma y validación final.
- Se integra control de atomicidad por `draftId` en ambas etapas.
- La integración UI debe consumir este contrato como fuente de verdad.
- Se mantiene prohibición explícita de mocks para uploads.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-03-15`
- Decision owner: `gemini-review`
- Approval notes:
  Aprobado. Las tres mitigaciones críticas quedaron integradas en el contrato:
  1. `uploadId` UUIDv4.
  2. `draftId` requerido y validado en `finalize`.
  3. `Content-MD5` requerido en la firma de `signed-url`.
  La implementación debe además:
  a) Persistir el "contrato firmado" (metadata del `sign` request) en un store temporal (ej. Redis con TTL) para la validación en `finalize`.
  b) Implementar el endpoint `finalize` de forma idempotente.
  c) Definir y aplicar una estrategia de sanitización y namespacing para el `objectKey` en GCS.

## Status
- Current status: `implemented`
- Next action:
  1. Mantener monitoreo de eventos `asset_cdn_invalidation_events` en staging/prod.
  2. Mantener prueba de regresión E2E de `signed-url -> upload -> finalize` en cada release del flujo admin.

## Validation Evidence (2026-03-16)
- Flujo validado en staging-local contra bucket GCS real:
  - `POST /api/admin/assets/uploads/signed-url` (200).
  - Upload `PUT` real a URL firmada.
  - `POST /api/admin/assets/uploads/:uploadId/finalize` (200).
- Reemplazo de media validado con `previousCdnUrl`:
  - `cdnInvalidationStatus: success`.
  - Path invalidado registrado en auditoría.
- Purga manual RBAC validada:
  - `POST /api/admin/cdn/purge` -> `200`, `status: success`, `providerRequestId` presente.
- Evidencia completa:
  - `docs/rfcs/EPIC-001-admin-asset-create-form/artifacts/latest-validation.json`
  - `docs/rfcs/EPIC-001-admin-asset-create-form/artifacts/VALIDATION-2026-03-16.md`

## Traceability
- Related issue(s): `EPIC-001`
- Related PR(s): `#35`
- Final commit hash(es): `b2daf88`, `953e3b3`, `c01953e`, `d51a871`
