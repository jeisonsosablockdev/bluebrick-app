# STORY-011-06-collection-detail-editor-ui

## Metadata
- Epic: `EPIC-011-admin-collections-console`
- Story ID: `STORY-011-06-collection-detail-editor-ui`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-17`
- Last Updated: `2026-04-26`

## Context
- Problem:
  Falta la vista donde el admin realmente edita summary, property info, gallery y documents de una collection existente.
- Why now:
  Este es el valor central del epic; sin esta vista, el módulo no cumple su objetivo.
- Constraints:
  - Cover visible pero no editable.
  - UX visual, no formulario plano.
  - Debe soportar media secundaria y documentos reutilizando pipeline existente.
- Affected paths:
  - `app/admin/collections/[id]/page.tsx` o equivalente
  - `components/admin/*`
  - `lib/admin/asset-upload-client.ts`
  - `e2e/*`

## Proposal
- Approach summary:
  Construir una vista de detalle/editor por proyecto con secciones modulares y feedback claro de lo editable vs lo gestionado por candy machine.
- Technical design:
  - Estrategia de estado cliente: Utilizar React Query (o SWR) para la lectura inicial y las mutaciones.
  - Cada sección editable tendrá mutaciones independientes con indicadores de estado UI propios (`saving`, `success`, `error`) para evitar inconsistencias en guardados parciales.
  - Bloque hero con cover read-only y badge tipo `Managed from Candy Machine`.
  - Secciones:
    - `Fractional investment summary`
    - `Property information`
    - `Project gallery`
    - `Documents`
  - Galería:
    - add
    - replace
    - delete
    - reorder (si se aprueba)
  - Side panel:
    - collection address
    - candy machine address
    - sync status
    - last updated
- Alternatives considered:
  - Modal/editor overlay sobre el index.
    - Rechazado inicialmente: poca superficie para galería y documentos.
- Tradeoffs:
  - Página detalle consume más implementación, pero da claridad y espacio para edición visual.

## Critique
- Reviewer(s):
  - `TBD`
- Critical findings:
1. Falta decidir si reorder entra en MVP.
2. Falta definir shape visual de property information.
3. Falta decidir si save es global o por sección.
- Blocking concerns:
  - No aprobar sin UX clara para cover bloqueado.

## Resolution
- Final approach after critique:
  Aprobado. El editor será una página dedicada gestionando el estado del servidor a través de React Query, aislando las acciones de guardado por sección visual para máxima resiliencia.
- Changes accepted:
  - Editor por página detalle.
  - Gestión de estado del servidor explícita e independiente por sección.
- Changes rejected (with rationale):
  - Rechazado modal estrecho como experiencia principal.
  - Rechazado "Save/Cancel" global que asume que todo falla o todo es exitoso a la vez.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-04-17`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Se aprueba la UX modular con manejo de estados asíncronos distribuidos según reglas del Epic.

## Status
- Current status: `approved`
- Next action:
  Continuar con `property information`, `gallery` y `documents` sobre el mismo patrón modular por sección.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Validación de secciones y estado dirty/clean.
- Integration tests:
  - Save exitoso, discard, cover bloqueado, uploads secundarios.
- Devnet validation (if applicable):
  - No aplica nuevo flujo on-chain.
- Responsive QA (if applicable):
  - Obligatoria en 320, 375, 768, 1024.

## Traceability
- Related issue(s): `BRI-95`, `BRI-96`, `BRI-97`, `BRI-98`, `BRI-99`
- Related PR(s): `#146`, `#148`, `#149`, `#150`, `TBD`
- Final commit hash(es): `8aa9aa4`, `aa4d919`, `f93c8f5`, `3077016`, `TBD`

## Slice Notes
- `2026-04-26`:
  - `BRI-95` mounted the read-only shell and stable section scaffolds.
  - `BRI-96` mounts the first live editor for `Fractional investment summary`, preserving independent `dirty`, `saving`, `success`, and `error` feedback inside the section.
  - `BRI-97` mounts the `Property information` editor with the same isolated save contract and extracts a shared text-section editor core so later slices do not duplicate textarea mutation logic.
  - `BRI-98` mounts a dedicated gallery tabs shell, preserving separate lanes for `galleryImages` and `propertyImages` while staging add/replace/delete action surfaces for the next media slice.
  - `BRI-99` mounts the `Documents` editor with section-scoped save/cancel and editable document metadata over the approved `documents[]` patch contract while preserving inherited upload metadata.
