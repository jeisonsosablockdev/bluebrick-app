---
type: RFC
title: STORY- 011 12 Location Form Editor And Maps Assisted Ux
description: STORY- 011 12 Location Form Editor And Maps Assisted Ux - migrated from docs/
tags: [rfcs]
timestamp: 2026-06-16T15:03:01Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/docs/rfcs/EPIC-011-admin-collections-console/STORY-011-12-location-form-editor-and-maps-assisted-ux.md
---

# STORY-011-12-location-form-editor-and-maps-assisted-ux

## Metadata
- Epic: `EPIC-011-admin-collections-console`
- Story ID: `STORY-011-12-location-form-editor-and-maps-assisted-ux`
- Status: `implemented` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-27`
- Last Updated: `2026-05-26`

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
    - **Regla de Deriva (Drift)**: Si el usuario edita el draft manual y los strings de `country`, `city` o `address` difieren del `googleMapsPlace` actualmente seleccionado, la selección de Maps se invalida ("stale").
    - **Rate Limiting**: El input de búsqueda de Google Maps **debe** implementar un `debounce` de al menos 300ms para evitar abusos de la API y sobrecostos.
    - Si `country` cambia, `stateProvince` debe reiniciarse inmediatamente cuando ya no sea válido para el nuevo país.
    - La UI debe ofrecer una acción explícita `Clear Google Maps selection` para descartar el place actual sin borrar el formulario manual.
    - `geoLat` / `geoLng` pueden aceptarse con coma o punto decimal en el input, pero deben normalizarse a formato decimal con punto antes de validar/guardar.
  - Arquitectura:
    - Un solo draft local para `locationForm` + `googleMapsPlace`.
    - Un solo `Save location` / `Cancel` para toda la sección.
    - El preview visible debe derivarse del draft, no solo del payload persistido.
    - Si no hay `googleMapsPlace`, el preview y el deep-link deben derivarse del formulario canónico guardado o del draft actual.
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
1. Resuelto: cambiar `country` reinicia `stateProvince` cuando la división previa ya no es válida para el nuevo país.
2. Resuelto: la UI acepta coma o punto decimal y normaliza a punto antes del save.
3. Resuelto: la UI ofrecerá una acción explícita para limpiar la selección actual de Google Maps sin perder el formulario manual.
4. Nuevo hallazgo: Falta mitigación de costos por peticiones excesivas a Google Maps. Resuelto agregando mandato de `debounce`.
5. Nuevo hallazgo: Falta definición estricta de cuándo el payload de Maps queda inválido. Resuelto definiendo la regla de deriva (Drift Rule).
- Blocking concerns:
  - No producir implementación sin un debounce explícito ni una política estricta de invalidación de datos entre los campos manuales y el payload de Maps.

## Resolution
- Final approach after critique:
  Aprobado. La paridad visual con `/admin/assets/new` se implementará dentro de la misma sección de ubicación, y Google Maps quedará como ayuda contextual para completar y validar la dirección, no como reemplazo del formulario manual. La UX resuelve explícitamente reset de `stateProvince`, normalización de coordenadas y limpieza manual del place.
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
- Current status: `implemented`
- Next action:
  Revisar la rama de integración `story-011-12-location-form-editor-and-maps-assisted-ux-bri-125` antes de abrir la PR final a `develop`.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [x] Implementation completed (if in scope)

## Suggested Implementation Slices
- Slice A:
  layout y estado local del formulario expandido de ubicación
- Slice B:
  integración de country/state shared logic desde `/admin/assets/new`
- Slice C:
  hidratación del draft desde autocomplete + preview/deep-link derivado
- Slice D:
  Save/Cancel final con estados dirty/saving/success/error + clear place action
- Slice E:
  Playwright + responsive QA del flujo combinado

## Test and Validation Plan
- Unit tests:
  - cambio de país reinicia `stateProvince` cuando aplica
  - parse/normalización de coordenadas
  - la modificación de campos de texto invalida correctamente el `googleMapsPlace` si hay deriva (drift)
  - preview derivado desde draft manual y/o place seleccionado
  - limpiar el place conserva intacto el formulario manual
- Integration tests:
  - el admin puede editar y guardar los campos manuales sin depender de una selección de Maps
  - el admin puede seleccionar una sugerencia de Maps, ajustar el formulario y guardar
  - el admin puede limpiar la selección de Maps y seguir usando preview derivado del formulario
- Devnet validation (if applicable):
  - No aplica.
- Responsive QA (if applicable):
  - Obligatoria en 320, 375, 768, 1024.

## Traceability
- Related issue(s): `BRI-125`, `BRI-130`, `BRI-131`, `BRI-140`, `BRI-132`, `BRI-141`, `BRI-133`, `BRI-134`, `BRI-142`
- Related PR(s): `integration branch only (no PR to develop yet)`
- Final commit hash(es): `0e0b9c0`, `473dd1c`, `ce21fb2`, `420aadb`, `c4d3e94`, `92b1151`, `ff5f32e`, `0bf0eae`
