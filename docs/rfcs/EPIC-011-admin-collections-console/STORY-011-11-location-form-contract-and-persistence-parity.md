# STORY-011-11-location-form-contract-and-persistence-parity

## Metadata
- Epic: `EPIC-011-admin-collections-console`
- Story ID: `STORY-011-11-location-form-contract-and-persistence-parity`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-27`
- Last Updated: `2026-04-27`

## Context
- Problem:
  El epic ya agrega Google Maps autocomplete y persistencia de `google_maps_place_json`, pero `/admin/collections` todavía no puede editar el mismo bloque canónico de ubicación que existe en `/admin/assets/new`.
- Why now:
  Producto necesita que el admin pueda corregir y mantener la dirección canónica del proyecto sin depender exclusivamente de una coincidencia de Google Maps.
- Constraints:
  - Debe conservar compatibilidad con `city`, `country`, `location_label` y `detailed_location` ya existentes.
  - No debe convertir `google_maps_place_json` en la única fuente editable de ubicación.
  - Debe convivir con el guardado manual por sección ya aprobado para el detail editor.
- Affected paths:
  - `db/migrations/*`
  - `lib/admin/collection-content-repository.ts`
  - `app/api/admin/collections/[id]/route.ts`
  - `lib/admin/*location*`
  - `tests/lib/*`
  - `tests/api/*`

## Proposal
- Approach summary:
  Extender el contrato editable de collections para que soporte paridad con `/admin/assets/new` en los campos `country`, `state / province`, `city`, `address`, `geoLat` y `geoLng`, manteniendo `google_maps_place_json` como payload asistivo.
- Technical design:
  - Campos canónicos a soportar en `/admin/collections/[id]`:
    - `country`
    - `stateProvince`
    - `city`
    - `address`
    - `geoLat` (optional)
    - `geoLng` (optional)
  - Reuso y compatibilidad:
    - `country` reutiliza la columna existente y debe normalizarse como código ISO-2.
    - `city` reutiliza la columna existente.
    - `address` reutiliza `detailed_location` como columna canónica de dirección libre.
    - `location_label` deja de ser un input manual independiente y pasa a derivarse server-side desde la dirección canónica.
  - Extensiones de modelo propuestas:
    - `state_province`
    - `geo_lat`
    - `geo_lng`
  - Contrato de sincronización:
    - Los campos canónicos de ubicación son la fuente editable principal.
    - `google_maps_place_json` queda como enriquecimiento opcional para preview, autocomplete y deep-link.
    - Cuando una selección de Google Maps aporte valores suficientes, el draft puede hidratar `country`, `stateProvince`, `city`, `address`, `geoLat` y `geoLng`.
    - Si el admin modifica manualmente los campos canónicos y deja el payload de Maps desalineado, el sistema debe limpiar o marcar como stale `google_maps_place_json` al guardar para evitar preview inconsistente.
- Alternatives considered:
  - Mantener solo `google_maps_place_json` como fuente editable.
    - Rechazado: no da paridad con `/admin/assets/new` y no cubre correcciones manuales finas.
  - Duplicar `address` en una columna nueva separada de `detailed_location`.
    - Rechazado inicialmente: agrega drift innecesario si `detailed_location` ya cumple ese rol.
- Tradeoffs:
  - Agregar `state_province`, `geo_lat` y `geo_lng` amplía el modelo actual, pero evita esconder datos operativos clave dentro de un payload de terceros.

## Critique
- Reviewer(s):
  - `TBD`
- Critical findings:
1. Falta confirmar si `country` quedará obligado a ISO-2 en todo el dominio admin o si se permitirá compatibilidad temporal con nombres completos.
2. Falta definir la regla exacta para limpiar `google_maps_place_json` cuando el admin sobreescriba manualmente la dirección.
3. Falta cerrar validación numérica y rango permitido para `geoLat` / `geoLng`.
- Blocking concerns:
  - No producir implementación sin una regla explícita de precedencia entre campos canónicos manuales y payload de Google Maps.

## Resolution
- Final approach after critique:
  Aprobado. Los campos canónicos de ubicación pasan a ser el contrato principal editable del epic, mientras `google_maps_place_json` permanece como enriquecimiento asistivo. `location_label` se deriva y ya no se trata como input independiente.
- Changes accepted:
  - Paridad funcional de ubicación con `/admin/assets/new`.
  - Nuevas columnas para `state_province`, `geo_lat` y `geo_lng`.
  - Contrato explícito de limpieza/sync con `google_maps_place_json`.
- Changes rejected (with rationale):
  - Rechazado usar Maps como única fuente editable de dirección.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-04-27`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Aprobada la extensión del modelo editable para que collections no dependa exclusivamente de Google Maps en la gestión de ubicación.

## Status
- Current status: `approved`
- Next action:
  Implementar schema/repository/PATCH contract para el nuevo bloque canónico de ubicación antes de cerrar la paridad visual en el editor.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Suggested Implementation Slices
- Slice A:
  migración y repository helpers para `state_province`, `geo_lat`, `geo_lng`
- Slice B:
  validación compartida del payload `locationForm` en el PATCH discriminado
- Slice C:
  helper de sincronización entre draft manual y `google_maps_place_json`
- Slice D:
  tests de compatibilidad, validación y limpieza de payload stale

## Test and Validation Plan
- Unit tests:
  - validación de `country`, `geoLat`, `geoLng`
  - derivación estable de `location_label`
  - limpieza o conservación correcta de `google_maps_place_json`
- Integration tests:
  - PATCH exitoso del bloque `locationForm`
  - coexistencia correcta entre texto manual y payload reducido de Maps
- Devnet validation (if applicable):
  - No aplica.
- Responsive QA (if applicable):
  - No aplica directamente; la cobertura visual queda en la story siguiente.

## Traceability
- Related issue(s): `TBD`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
