# STORY-011-09-google-maps-location-integration

## Metadata
- Epic: `EPIC-011-admin-collections-console`
- Story ID: `STORY-011-09-google-maps-location-integration`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-17`
- Last Updated: `2026-04-26`

## Context
- Problem:
  La entry ya tiene información de dirección, pero `/admin/collections` necesita una integración más útil con Google Maps para autocomplete, visualización contextual y salida directa al sitio.
- Why now:
  Producto quiere que el admin valide y entienda visualmente la ubicación desde el editor, no solo leyendo texto plano.
- Constraints:
  - Debe convivir con la dirección ya existente en el modelo actual.
  - No debe romper el flujo manual de guardado por sección.
  - La UX debe seguir dentro del lenguaje visual actual del admin console.
- Affected paths:
  - `app/api/admin/collections/[id]/route.ts`
  - `components/admin/*`
  - `lib/*maps*`
  - `tests/api/*`
  - `e2e/*`

## Proposal
- Approach summary:
  Agregar una sección de ubicación con autocomplete de dirección, persistencia de un payload reducido de Maps y CTA para abrir la ubicación directamente en Google Maps.
- Technical design:
  - Inputs base existentes a reusar:
    - `city`
    - `country`
    - `location_label`
    - `detailed_location`
  - Persistencia propuesta dentro del modelo actual:
    - `google_maps_place_json`
  - Contenido mínimo propuesto de `google_maps_place_json`:
    - `placeLabel`
    - `formattedAddress`
    - `lat`
    - `lng`
    - `googleMapsUrl`
    - `placeId`
  - UX:
    - modo lectura con dirección visible + CTA `Open in Google Maps`
    - modo edición con autocomplete
    - guardado manual con `Save` / `Cancel`
    - permanencia en la misma pantalla después de guardar/cancelar
- Alternatives considered:
  - Solo construir URL derivada sin persistencia.
    - Rechazado inicialmente: autocomplete y estabilidad del destino se benefician de un payload reducido persistido.
  - Dejar Maps embebido como iframe principal.
    - Rechazado inicialmente: introduce peso/ruido visual innecesario para v1.
- Tradeoffs:
  - Persistir payload reducido aumenta claridad y estabilidad, pero agrega un pequeño contrato adicional al modelo.

## Critique
- Reviewer(s):
  - `TBD`
- Critical findings:
1. Falta confirmar si `google_maps_place_json` será el nombre final del campo.
2. Falta confirmar política cuando el autocomplete no encuentre una coincidencia clara.
3. Falta definir si `detailed_location` se actualiza en paralelo con la selección de Maps o si solo se sincroniza de una vía.
- Blocking concerns:
  - No producir implementación sin contrato de sincronización entre texto de dirección y place payload.

## Resolution
- Final approach after critique:
  Aprobado. `google_maps_place_json` será la entidad oficial persistida. La actualización será gestionada mediante estado cliente (React Query) sincronizado con el PATCH general.
- Changes accepted:
  - Story separada para Maps/location.
  - Autocomplete + outbound link incluidos en alcance.
  - Persistencia propuesta de payload reducido.
- Changes rejected (with rationale):
  - Rechazado dejar la ubicación solo como texto estático.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-04-17`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Aprobada la persistencia del payload reducido de maps para eficientar consultas.

## Status
- Current status: `approved`
- Next action:
  `BRI-110` a `BRI-113` ya dejaron lectura, contrato backend, autocomplete local y persistencia del payload reducido. El siguiente paso es cerrar la UX manual `Save` / `Cancel` y la evidencia QA del section flow.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Suggested Implementation Slices
- Slice A:
  mostrar dirección actual + CTA outbound a Google Maps
- Slice B:
  contrato backend para `locationMaps`
- Slice C:
  autocomplete de dirección
- Slice D:
  persistencia de `google_maps_place_json`
- Slice E:
  integración UI de edición manual `Save` / `Cancel`
- Slice F:
  tests de sincronización y responsive QA

## Test and Validation Plan
- Unit tests:
  - Validación del payload reducido de Maps.
  - Sincronización entre dirección y place payload.
- Integration tests:
  - Update manual de location section.
  - Render del CTA a Google Maps.
- Devnet validation (if applicable):
  - No aplica.
- Responsive QA (if applicable):
  - Obligatoria en 320, 375, 768, 1024.

## Traceability
- Related issue(s): `TBD`
- Implementation progress:
  - `BRI-110` implemented current address context + visible map preview + outbound Google Maps CTA on the admin collection detail page.
  - `BRI-111` implemented a dedicated backend location/maps contract route with normalized context, reduced place payload, and derived outbound/embed URLs.
  - `BRI-112` implemented admin-only Google Maps autocomplete + place resolution routes and mounted a local-selection editor flow without persisting yet.
  - `BRI-113` implemented the reduced `googleMapsPlace` mutation client and regression coverage for repository/API persistence.
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
