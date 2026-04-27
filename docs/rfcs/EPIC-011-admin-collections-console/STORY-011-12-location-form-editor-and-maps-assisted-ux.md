# STORY-011-12-location-form-editor-and-maps-assisted-ux

## Metadata
- Epic: `EPIC-011-admin-collections-console`
- Story ID: `STORY-011-12-location-form-editor-and-maps-assisted-ux`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-27`
- Last Updated: `2026-04-27`

## Context
- Problem:
  Aunque el epic ya contempla Google Maps autocomplete, `/admin/collections/[id]` todavía no ofrece el formulario de ubicación que el admin ya conoce desde `/admin/assets/new`.
- Why now:
  La experiencia actual deja la ubicación demasiado acoplada al resultado de Maps y no permite corregir fácilmente país, estado/provincia, ciudad, dirección o coordenadas sin salir del editor.
- Constraints:
  - Debe reutilizar el lenguaje visual actual del admin detail editor.
  - Debe mantener `Save` / `Cancel` por sección.
  - Debe seguir siendo usable en 320, 375, 768 y 1024.
- Affected paths:
  - `components/admin/admin-collection-location-editor.tsx`
  - `components/admin/*`
  - `lib/admin/*location*`
  - `e2e/*`
  - `tests/components/*`
  - `tests/app/*`

## Proposal
- Approach summary:
  Reemplazar el editor actual de ubicación por un formulario canónico equivalente a `/admin/assets/new`, integrado con la capa asistiva de Google Maps para búsqueda, preview y deep-link.
- Technical design:
  - Inputs editables requeridos:
    - `Select Country`
    - `State / Province`
    - `City`
    - `Address`
    - `geoLat (optional)`
    - `geoLng (optional)`
  - Reglas de UX:
    - Reusar `COUNTRIES` y la lógica de divisiones del form de creación.
    - Mantener el preview de mapa y el CTA `Open in Google Maps`.
    - La selección de autocomplete puede hidratar el draft del formulario.
    - El admin puede ajustar manualmente los valores antes de guardar.
    - Si el draft manual invalida el payload seleccionado de Maps, la UI debe comunicar que el preview quedará derivado del texto hasta elegir un nuevo place.
  - Arquitectura:
    - Un solo draft local para `locationForm` + `googleMapsPlace`.
    - Un solo `Save location` / `Cancel` para toda la sección.
    - El preview visible debe derivarse del draft, no solo del payload persistido.
- Alternatives considered:
  - Mantener el editor actual de search box + preview y agregar inputs aparte en otra sección.
    - Rechazado: duplica la experiencia y fragmenta la ubicación en dos flujos.
  - Forzar al admin a siempre elegir una coincidencia de Maps.
    - Rechazado: no cubre correcciones manuales ni proyectos con dirección imperfecta/no indexada.
- Tradeoffs:
  - La sección se vuelve más grande, pero gana claridad operativa y paridad con el formulario de creación del activo.

## Critique
- Reviewer(s):
  - `TBD`
- Critical findings:
1. Falta definir el comportamiento exacto cuando `country` cambie y el `stateProvince` previo ya no sea válido.
2. Falta confirmar si `geoLat` / `geoLng` deben aceptar coma decimal o solo punto decimal.
3. Falta cerrar si la UI debe ofrecer una acción explícita para limpiar el place de Maps actual.
- Blocking concerns:
  - No producir implementación sin una UX clara para estados divergentes entre formulario manual y sugerencia de Maps.

## Resolution
- Final approach after critique:
  Aprobado. La paridad visual con `/admin/assets/new` se implementará dentro de la misma sección de ubicación, y Google Maps quedará como ayuda contextual para completar y validar la dirección, no como reemplazo del formulario manual.
- Changes accepted:
  - Reuso del patrón de país/estado de `/admin/assets/new`.
  - Unificación de autocomplete, formulario y preview en una sola sección.
  - QA responsive específica para la sección de ubicación extendida.
- Changes rejected (with rationale):
  - Rechazado mantener dos secciones separadas para dirección manual y Maps.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-04-27`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Aprobada la extensión de UI para lograr paridad funcional con el formulario de creación y conservar Maps como capa asistiva.

## Status
- Current status: `approved`
- Next action:
  Implementar el editor expandido y cerrar la evidencia responsive/E2E del flujo combinado de formulario manual + Google Maps.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Suggested Implementation Slices
- Slice A:
  layout y estado local del formulario expandido de ubicación
- Slice B:
  integración de country/state shared logic desde `/admin/assets/new`
- Slice C:
  hidratación del draft desde autocomplete + preview derivado
- Slice D:
  Save/Cancel final con estados dirty/saving/success/error
- Slice E:
  Playwright + responsive QA del flujo combinado

## Test and Validation Plan
- Unit tests:
  - cambio de país reinicia `stateProvince` cuando aplica
  - parse/normalización de coordenadas
  - preview derivado desde draft manual y/o place seleccionado
- Integration tests:
  - el admin puede editar y guardar los campos manuales sin depender de una selección de Maps
  - el admin puede seleccionar una sugerencia de Maps, ajustar el formulario y guardar
- Devnet validation (if applicable):
  - No aplica.
- Responsive QA (if applicable):
  - Obligatoria en 320, 375, 768, 1024.

## Traceability
- Related issue(s): `TBD`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
