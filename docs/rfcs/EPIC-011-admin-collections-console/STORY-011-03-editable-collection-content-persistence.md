# STORY-011-03-editable-collection-content-persistence

## Metadata
- Epic: `EPIC-011-admin-collections-console`
- Story ID: `STORY-011-03-editable-collection-content-persistence`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-17`
- Last Updated: `2026-04-23`

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
    - `gallery_images_json` (JSONB)
    - `property_images_json` (JSONB)
    - `fractional_investment_summary` (TEXT)
    - `property_information` (TEXT)
    - `google_maps_place_json` (JSONB)
    - `updated_by`
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
1. Falta definir shape exacta de los JSON para `gallery_images_json` y `property_images_json`.
2. Falta decidir si `documents_json` conserva categorías o solo etiquetas libres.
3. Falta cerrar reglas de deduplicación entre bootstrap desde snapshot y datos ya presentes en marketplace.
- Blocking concerns:
  - No aprobar migración hasta definir shape de los JSON de galerías.

## Resolution
- Final approach after critique:
  Aprobado con ajustes. Se extenderá el modelo `marketplace_entries` existente para incluir el contenido editable y se añade formalmente la estrategia segura de bootstrap y recolección de basura para uploads, alineado con la decisión del Epic.
- Changes accepted:
  - Persistencia editable como extensión del modelo `marketplace_entries`, separada conceptualmente del snapshot histórico.
  - Script de bootstrap versionado con dry-run y manifiesto de errores.
  - Ciclo de vida estricto para uploads de edición (orphan cleanup).
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
- Current status: `approved`
- Next action:
  Crear migración de base de datos y script de dry-run para el bootstrap.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [ ] Implementation completed (if in scope)

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
- Related issue(s): `TBD`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
