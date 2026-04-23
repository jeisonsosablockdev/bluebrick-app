# STORY-011-10-collections-health-and-manual-review-queue

## Metadata
- Epic: `EPIC-011-admin-collections-console`
- Story ID: `STORY-011-10-collections-health-and-manual-review-queue`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-17`
- Last Updated: `2026-04-17`

## Context
- Problem:
  El epic necesita una salida explícita para entries inconsistentes, snapshots corruptos o bootstrap fallido, en vez de esconder esos casos dentro del listado principal o dejar errores silenciosos.
- Why now:
  El bootstrap inicial y el read model cruzado pueden detectar casos que no deben ir directo al editor. Producto y operaciones necesitan una vista simple para entender qué requiere revisión manual.
- Constraints:
  - Solo lectura.
  - No convertir este módulo en un centro de reparación; su función inicial es visibilidad operativa.
  - Debe reutilizar el mismo contrato de ownership y consistencia del epic.
- Affected paths:
  - `app/admin/health/collections/page.tsx`
  - `app/api/admin/health/collections/route.ts`
  - `lib/*collections*`
  - `tests/api/*`

## Proposal
- Approach summary:
  Crear una vista read-only `/admin/health/collections` que liste entries con fallas de consistencia, bootstrap o manual review pendiente.
- Technical design:
  - Mostrar entries con estados como:
    - `missing_snapshot`
    - `inconsistent`
    - `bootstrap_failed`
    - `manual_review_required`
    - `orphaned_uploads_detected`
  - Cada fila debe incluir:
    - `entryId`
    - `title`
    - `collectionAddress`
    - `candyMachineAddress`
    - `failureReason`
    - `lastCheckedAt`
    - CTA de navegación a contexto relacionado cuando exista
  - La vista no edita datos; solo informa y deriva.
- Alternatives considered:
  - Ocultar completamente los casos problemáticos.
    - Rechazado: baja auditabilidad y dificulta operación.
- Tradeoffs:
  - Se agrega una historia más, pero se evita contaminar el index principal y se da una salida clara a los casos degradados.

## Critique
- Reviewer(s):
  - `TBD`
- Critical findings:
1. Falta confirmar si la vista será solo para admins globales o para cualquier admin dueño de entries.
2. Falta definir si `orphaned_uploads_detected` es visible en v1 o solo queda en backend/logs.
3. Falta decidir si manual review tiene etiqueta persistida o se deriva cada vez.
- Blocking concerns:
  - No producir implementación sin contrato claro de estados de salud.

## Resolution
- Final approach after critique:
  Aprobado. Tal como exige el protocolo del Epic, esta vista garantizará que los fallos del bootstrap script (`STORY-011-03`) y orfandad de datos tengan un canal de salida seguro que no interfiera con el editor general.
- Changes accepted:
  - Story dedicada para health/manual review.
- Changes rejected (with rationale):
  - Rechazado esconder fallas de bootstrap o consistencia en el editor principal.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-04-17`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Se aprueba la vista de Health como mitigador obligatorio de riesgos operativos.

## Status
- Current status: `approved`
- Next action:
  Desplegar el read model específico para entradas fallidas.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Suggested Implementation Slices
- Slice A:
  health read model
- Slice B:
  manual review state mapping
- Slice C:
  read-only health endpoint
- Slice D:
  read-only health UI
- Slice E:
  tests de clasificación y visibilidad

## Test and Validation Plan
- Unit tests:
  - clasificación correcta de estados de salud
- Integration tests:
  - entries inconsistentes aparecen en health view y no contaminan el happy path del index principal
- Devnet validation (if applicable):
  - No aplica.
- Responsive QA (if applicable):
  - Obligatoria en 320, 375, 768, 1024.

## Traceability
- Related issue(s): `TBD`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
