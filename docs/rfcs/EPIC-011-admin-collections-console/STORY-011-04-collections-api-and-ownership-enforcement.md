# STORY-011-04-collections-api-and-ownership-enforcement

## Metadata
- Epic: `EPIC-011-admin-collections-console`
- Story ID: `STORY-011-04-collections-api-and-ownership-enforcement`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-17`
- Last Updated: `2026-04-25`

## Context
- Problem:
  No existen endpoints admin para leer/editar collections con enforcement de ownership y restricciones de edición.
- Why now:
  La UI final necesita APIs claras antes de implementarse.
- Constraints:
  - Admin-only.
  - Ownership server-side.
  - Cover immutable.
  - No confiar en estado del cliente.
- Affected paths:
  - `app/api/admin/collections/route.ts`
  - `app/api/admin/collections/[id]/route.ts`
  - `lib/admin/collection-ownership.ts`
  - `lib/auth-session.ts`
  - `tests/api/*`

## Proposal
- Approach summary:
  Añadir APIs `GET` y `PATCH` para collections, con checks de role, ownership y restricciones de payload.
- Technical design:
  - `GET /api/admin/collections`
  - `GET /api/admin/collections/:id`
  - `PATCH /api/admin/collections/:id`
  - Helper centralizado de Autorización:
    - Crear y exigir el uso de `assertAdminCollectionOwnership(adminId, collectionId)` en todas las rutas de lectura/escritura de detalle. Validará el cruce contra `marketplace_entries` y `asset_mint_snapshots`.
  - Reglas:
    - caller debe ser `admin`
    - `PATCH` utilizará un payload discriminado por sección (ej. `{ "section": "gallery", "data": {...} }`) en lugar de múltiples endpoints, para unificar validaciones.
    - payload que incluya cover/image_url se rechaza
  - Errores:
    - `FORBIDDEN`
    - `COLLECTION_NOT_FOUND`
    - `COLLECTION_OWNERSHIP_MISMATCH`
    - `IMMUTABLE_COVER_FIELD`
    - `INVALID_COLLECTION_PAYLOAD`
- Alternatives considered:
  - Editar sobre endpoint existente `POST /api/admin/marketplace/entries`.
    - Rechazado: ese endpoint hoy representa creación, no edición.
- Tradeoffs:
  - Más superficie API, pero contrato mucho más claro.

## Critique
- Reviewer(s):
  - `TBD`
- Critical findings:
1. Falta decidir si `PATCH` es parcial libre o por secciones.
2. Falta decidir si se auditan cambios por campo.
3. Falta definir semántica cuando la entry existe pero el contenido editable aún no fue bootstrappeado.
- Blocking concerns:
  - No aprobar `PATCH` sin esquema de payload.

## Resolution
- Final approach after critique:
  Aprobado con la inclusión obligatoria de un guard de ownership centralizado y la consolidación en un único endpoint PATCH discriminado por sección.
- Changes accepted:
  - APIs separadas para listing/detail/update.
  - Helper `assertAdminCollectionOwnership` central.
  - Endpoint único de `PATCH` discriminado para modularidad interna.
- Changes rejected (with rationale):
  - Rechazado mezclar creación y edición en un mismo handler.
  - Rechazada la proliferación de múltiples endpoints PATCH per-section.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-04-17`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Se aprueba la API con los estrictos controles de ownership y consolidación de mutaciones del Epic.

## Status
- Current status: `approved`
- Next action:
  Implementar `GET /api/admin/collections/:id` usando `assertAdminCollectionOwnership(...)`.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Helper de ownership centralizado.
  - Validación de payload permitido/prohibido.
- Integration tests:
  - 403 para no-admin
  - 403 para admin no dueño
  - 400 para intento de editar cover
  - 200 para update válido
- Devnet validation (if applicable):
  - No aplica.
- Responsive QA (if applicable):
  - No aplica directo a API.

## Traceability
- Related issue(s): `BRI-73`, `BRI-88`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`

## Implementation Progress
- `BRI-88` adds `assertAdminCollectionOwnership(adminId, collectionId)` as the mandatory server-side guard for future collection detail routes.
- The helper treats `collectionId` as `marketplace_entries.id`, verifies `marketplace_entries.created_by`, and requires exact snapshot evidence from `asset_mint_snapshots` for the same admin, collection address, and candy machine address.
- The helper exposes stable error codes for downstream routes:
  - `INVALID_COLLECTION_OWNERSHIP_INPUT`
  - `COLLECTION_NOT_FOUND`
  - `COLLECTION_OWNERSHIP_MISMATCH`
