# STORY-011-11-location-form-contract-and-persistence-parity

## Metadata
- Epic: `EPIC-011-admin-collections-console`
- Story ID: `STORY-011-11-location-form-contract-and-persistence-parity`
- Status: `implemented` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-27`
- Last Updated: `2026-04-28`

## Context
- Problem:
  El epic ya agrega Google Maps autocomplete y persistencia de `google_maps_place_json`, pero `/admin/collections` todavía no puede editar el mismo bloque canónico de ubicación que existe en `/admin/assets/new`.
- Why now:
  Producto necesita que el admin pueda corregir y mantener la dirección canónica del proyecto sin depender exclusivamente de una coincidencia de Google Maps.
- Constraints:
  - Debe conservar compatibilidad con `city`, `country`, `location_label` y `detailed_location` ya existentes.
  - No debe convertir `google_maps_place_json` en la única fuente editable de ubicación.
  - Debe convivir con el guardado manual por sección ya aprobado para el detail editor.
  - Debe cerrar la brecha entre los tres puntos del dominio admin: creación (`/admin/assets/new`), bootstrap/snapshot y edición (`/admin/collections/[id]`).
- Affected paths:
  - `app/api/admin/marketplace/entries/route.ts`
  - `db/migrations/*`
  - `lib/admin/collection-content-repository.ts`
  - `lib/admin/collection-bootstrap-mapper.ts`
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
    - `country` reutiliza la columna existente y queda definido como código ISO-2 canónico en todo el dominio admin.
    - `city` reutiliza la columna existente.
    - `address` reutiliza `detailed_location` como columna canónica de dirección libre.
    - `location_label` deja de ser un input manual independiente y pasa a derivarse server-side desde la dirección canónica.
  - Extensiones de modelo propuestas:
    - `state_province`
    - `geo_lat`
    - `geo_lng`
  - Alcance transversal del contrato:
    - `/admin/assets/new` debe persistir el mismo shape canónico de ubicación al crear la marketplace entry.
    - El bootstrap/snapshot debe mapear al mismo shape canónico cuando encuentre evidencia suficiente.
    - `/admin/collections/[id]` debe leer y escribir exactamente el mismo shape, sin introducir un cuarto contrato.
  - Política de normalización:
    - `country` se persiste siempre en ISO-2 mayúscula.
    - Si create/import/bootstrap reciben un nombre largo de país y existe mapeo determinista a `COUNTRIES`, deben convertirlo a ISO-2 antes de persistir.
    - Si no existe mapeo determinista, el registro debe quedar en `manual_review_required` o el PATCH debe rechazarse explícitamente; no se persisten nombres ambiguos como estado final.
    - `stateProvince` se persiste como texto visible de negocio, no como código interno de división.
    - `geoLat` y `geoLng` se validan dentro de rangos `[-90, 90]` y `[-180, 180]` y se persisten en formato decimal canónico.
  - Contrato de sincronización:
    - Los campos canónicos de ubicación son la fuente editable principal.
    - `google_maps_place_json` queda como enriquecimiento opcional para preview, autocomplete y deep-link.
    - Cuando una selección de Google Maps aporte valores suficientes, el draft puede hidratar `country`, `stateProvince`, `city`, `address`, `geoLat` y `geoLng`.
    - Si el draft guardado sigue representando el mismo place seleccionado y mantiene coordenadas/`formattedAddress` equivalentes, el sistema puede conservar `google_maps_place_json`.
    - Si el admin modifica manualmente cualquier campo canónico de forma que ya no coincida con el place seleccionado, el sistema limpia `google_maps_place_json` en el mismo guardado. No habrá estado intermedio `stale` persistido en v1.
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
1. Resuelto: `country` queda obligado a ISO-2 canónico en todo el dominio admin, con mapeo o rechazo explícito en create/import/bootstrap.
2. Resuelto: `google_maps_place_json` se conserva solo si el draft sigue representando el mismo place; en caso contrario se limpia en el mismo save.
3. Resuelto: `geoLat` / `geoLng` se validan en rangos geográficos válidos y se persisten en formato decimal canónico.
- Blocking concerns:
  - No producir implementación si create/bootstrap/edit no convergen sobre el mismo contrato de ubicación.

## Resolution
- Final approach after critique:
  Aprobado. Los campos canónicos de ubicación pasan a ser el contrato principal editable del epic, mientras `google_maps_place_json` permanece como enriquecimiento asistivo. `location_label` se deriva y ya no se trata como input independiente. El mismo shape se adopta en create/bootstrap/edit, `country` se canoniza a ISO-2 y el payload de Maps se limpia determinísticamente cuando deja de coincidir con el draft manual.
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
- Current status: `implemented`
- Next action:
  Revisar la rama de integración `story-011-11-location-form-contract-and-persistence-parity-bri-124` antes de abrir la PR final a `develop`.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [x] Implementation completed (if in scope)

## Suggested Implementation Slices
- Slice A:
  migración y repository helpers para `state_province`, `geo_lat`, `geo_lng`
- Slice B:
  validación compartida del payload `locationForm` en create + bootstrap + PATCH discriminado
- Slice C:
  helper de sincronización entre draft manual y `google_maps_place_json`
- Slice D:
  tests de compatibilidad, normalización ISO-2 y limpieza determinista de payload

## Test and Validation Plan
- Unit tests:
  - validación de `country`, `geoLat`, `geoLng`
  - derivación estable de `location_label`
  - limpieza o conservación correcta de `google_maps_place_json`
  - mapeo de nombres largos de país a ISO-2 cuando exista equivalencia determinista
- Integration tests:
  - PATCH exitoso del bloque `locationForm`
  - create + bootstrap + edit convergen al mismo shape de ubicación
  - coexistencia correcta entre texto manual y payload reducido de Maps
- Devnet validation (if applicable):
  - No aplica.
- Responsive QA (if applicable):
  - No aplica directamente; la cobertura visual queda en la story siguiente.

## Traceability
- Related issue(s): `BRI-124`, `BRI-126`, `BRI-127`, `BRI-137`, `BRI-138`, `BRI-139`, `BRI-128`, `BRI-129`
- Related PR(s): `integration branch only (no PR to develop yet)`
- Final commit hash(es): `bd461ad`, `ea09f33`, `a6885a0`, `79bffa6`, `04839c0`, `18f7b9e`
