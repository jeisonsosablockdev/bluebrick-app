# STORY-011-03-editable-collection-content-persistence

## Metadata
- Epic: `EPIC-011-admin-collections-console`
- Story ID: `STORY-011-03-editable-collection-content-persistence`
- Status: `implemented` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-17`
- Last Updated: `2026-04-24`

## Context
- Problem:
  El sistema actual persiste uploads por `draftId` y snapshot histórico en `form_snapshot`, pero no tiene una persistencia viva para contenido editable del marketplace por proyecto.
- Why now:
  Sin esta capa, `/admin/collections` no puede editar galería ni bloques descriptivos de forma durable.
- Constraints:
  - La carátula permanece fuera del modelo editable.
  - Debe soportar bootstrap inicial desde datos existentes.
  - Debe ser explícito qué contenido es editable y cuál es histórico.
- Affected paths:
  - `db/migrations/*`
  - `lib/property-marketplace-server.ts`
  - `lib/core-candy-machine-snapshot-repository.ts`
  - `tests/lib/*`

## Proposal
- Approach summary:
  Extender el modelo de `marketplace_entries` con columnas adicionales para el contenido editable off-chain, manteniendo la separación conceptual con `image_url` (cover) y el `form_snapshot` histórico.
- Technical design:
  - Añadir las siguientes columnas a la tabla `marketplace_entries`:
    - `gallery_images_json` (JSONB, `NOT NULL DEFAULT []`)
    - `property_images_json` (JSONB, `NOT NULL DEFAULT []`)
    - `fractional_investment_summary` (TEXT nullable hasta bootstrap/manual edit)
    - `property_information` (TEXT nullable hasta bootstrap/manual edit)
    - `google_maps_place_json` (JSONB nullable con payload reducido aprobado en `STORY-011-09`)
    - `updated_by` (TEXT nullable hasta primer cambio editorial)
  - Bootstrap:
    - Implementar un script de migración versionado y con capacidad de `dry-run`.
    - El script debe mapear las galerías desde `form_snapshot` a los nuevos campos JSON de forma segura.
    - El script debe generar un manifiesto de resultados: `successes`, `failures` y entradas que requieren revisión manual (`STORY-011-10`).
  - Gestión de archivos huérfanos (Upload Lifecycle):
    - Todo archivo subido durante una sesión de edición se asocia a un ID de sesión temporal.
    - Implementar un mecanismo de limpieza (cleanup job o purga) para eliminar del storage los archivos de sesiones abandonadas o canceladas.
  - Mantener `marketplace_entries.image_url` como cover read-only.
- Alternatives considered:
  - Crear una tabla dedicada (`marketplace_entry_editor_content`).
    - Rechazado: introduce complejidad de joins y va en contra de la decisión del Epic de mantener un modelo de dominio cohesivo.
  - Guardar todo en `documents_json`.
    - Rechazado: semántica incorrecta para summary/property info/gallery.
- Tradeoffs:
  - Extender `marketplace_entries` evita joins y bounded context extra, pero obliga a mantener muy claro qué campos pertenecen al listing base y cuáles al contenido editorial editable.

## Critique
- Reviewer(s):
  - `TBD`
- Critical findings:
1. El bootstrap mapper debe mantener orden determinista usando `uploadRefs` como fuente primaria y solo caer a URLs de snapshot cuando el upload finalizado no esté disponible.
2. `documents_json` debe normalizarse con taxonomía explícita (`brochure`, `legal`, `financial`, etc.) sin romper compatibilidad con rows antiguas que solo tengan `label + url`.
3. Los snapshots corruptos o incompletos no pueden poblar data inventada; deben emitir reason codes de `manual_review_required`.
- Blocking concerns:
  - No ejecutar el dry-run versionado hasta conectar el mapper aprobado a un runner con manifiesto y persistencia controlada.

## Resolution
- Final approach after critique:
  Aprobado con ajustes. Se extenderá el modelo `marketplace_entries` existente para incluir el contenido editable y se añade formalmente la estrategia segura de bootstrap y recolección de basura para uploads, alineado con la decisión del Epic.
- Changes accepted:
  - Persistencia editable como extensión del modelo `marketplace_entries`, separada conceptualmente del snapshot histórico.
  - Columnas editoriales nuevas con defaults seguros para colecciones de imágenes y nulabilidad explícita para contenido aún no bootstrappeado.
  - Script de bootstrap versionado con dry-run y manifiesto de errores.
  - Ciclo de vida estricto para uploads de edición (orphan cleanup).
  - Mapper puro para bootstrap con contratos explícitos de `gallery_images_json`, `property_images_json`, `documents_json` y reduced maps payload.
  - Dedupe entre uploads/snapshot y `documents_json` existente usando `fileRefId` y URL.
- Changes rejected (with rationale):
  - Rechazado reusar `form_snapshot` como modelo de edición.
  - Rechazada la creación de una tabla dedicada para el contenido editable.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-04-17`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Se aprueba la extensión del modelo existente y la integración de las reglas de seguridad de datos definidas en el Epic.

## Status
- Current status: `implemented`
- Next action:
  Ninguna dentro de este story; las mutaciones posteriores quedaron cubiertas por `STORY-011-04`.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [x] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Bootstrap script rechaza y marca para revisión la data corrupta de `form_snapshot`.
  - No mutación del cover.
- Integration tests:
  - Lectura/escritura por `marketplace_entry_id`.
- Devnet validation (if applicable):
  - No aplica.
- Responsive QA (if applicable):
  - No aplica directo a persistencia.

## Traceability
- Related issue(s): `BRI-72`, `BRI-83`, `BRI-84`, `BRI-85`, `BRI-86`, `BRI-87`
- Related PR(s): `#133`, `#134`, `#135`, `#136`, `#137`
- Final commit hash(es): `76bfa16802b8dd183c23e5f66daa52dd8dc3c9b4` (`BRI-83`), `79a4e1546d3d05d31f26e6931d44c9937bd9d4bc` (`BRI-84`), `7f057653b14c9ffb8d4ca67115bbfd899f897ed4` (`BRI-85`), `35ca8891051fee58bc985f5d74d1756e5f7497b0` (`BRI-86`), `fe755db044a7f3975ae8ec62adc740b7ad82141f` (`BRI-87`)

## Implementation Progress
- `BRI-83` adds the first schema slice for this story by extending `marketplace_entries` with the approved editable collection columns and documenting their editorial purpose with SQL column comments.
- This slice intentionally does not execute bootstrap, repository writes, or UI changes yet.
- `BRI-84` closes the mapper contract for bootstrap by defining the JSON shape of gallery/property images, normalized document taxonomy, upload-ref-first ordering, snapshot fallback behavior, and explicit `manual_review_required` reason codes for corrupt data.
- The mapper preserves existing marketplace `documents_json` first, dedupes bootstrap candidates by `fileRefId` and URL, and leaves `google_maps_place_json` null unless a valid reduced payload already exists in the snapshot.
- `BRI-85` adds the versioned dry-run runner (`2026-04-23-v1`) with scoped CLI execution, exact-link candidate planning, and explicit manifest buckets for `successes`, `manualReviewRequired`, and `failures`.
- The dry-run manifest treats missing/inconsistent snapshot links and blank `draftId` as preflight failures, while corrupt `form_snapshot` payloads continue to flow through the mapper as `manual_review_required`.
- `BRI-86` adds the narrow repository/helper layer for this story in `lib/admin/collection-content-repository.ts`, centralizing reads and writes of the editable collection fields without reopening `image_url`.
- The repository contract now gives later API/detail slices a single place to read normalized editable content and to apply bootstrap payloads or section updates without duplicating SQL or legacy `documents_json` parsing.
- `BRI-87` completes the upload lifecycle for edit sessions by adding optional `editSessionId` association to upload contracts, repository helpers to promote/cancel session uploads, and cleanup rules that only purge session-linked uploads that were never promoted.
- The orphan reconciler now deletes blob objects before removing DB rows and ignores uploads already promoted on save, preventing collection-editor media from being treated as temporary debris.
