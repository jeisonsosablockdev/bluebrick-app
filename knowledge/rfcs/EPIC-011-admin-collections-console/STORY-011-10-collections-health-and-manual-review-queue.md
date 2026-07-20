---
type: RFC
title: STORY- 011 10 Collections Health And Manual Review Queue
description: STORY- 011 10 Collections Health And Manual Review Queue - migrated from knowledge/
tags: [rfcs]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-011-admin-collections-console/STORY-011-10-collections-health-and-manual-review-queue.md
---

# STORY-011-10-collections-health-and-manual-review-queue

## Metadata
- Epic: `EPIC-011-admin-collections-console`
- Story ID: `STORY-011-10-collections-health-and-manual-review-queue`
- Status: `implemented` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-17`
- Last Updated: `2026-05-26`

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
1. La vista debe respetar ownership por actor autenticado, no exponer filas globales.
2. `orphaned_uploads_detected` debe quedar fuera de v1 hasta tener una fuente canónica de repositorio.
3. `manual_review_required` debe derivarse desde el bootstrap dry-run aprobado, no persistirse como etiqueta separada.
- Blocking concerns:
  - No producir implementación sin contrato claro de estados de salud.

## Resolution
- Final approach after critique:
  Implementado en rama de integración. La vista de health quedó actor-scoped, derivada desde el read model principal y el dry-run de bootstrap, con filas degradadas fuera del happy path principal de `/admin/collections`.
- Changes accepted:
  - Story dedicada para health/manual review.
  - Health vocabulary v1 limitado a `missing_snapshot`, `inconsistent`, `bootstrap_failed`, `manual_review_required`.
  - `manual_review_required` se deriva del manifest de bootstrap.
  - `orphaned_uploads_detected` se difiere fuera de v1.
- Changes rejected (with rationale):
  - Rechazado esconder fallas de bootstrap o consistencia en el editor principal.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-04-17`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Se aprueba la vista de Health como mitigador obligatorio de riesgos operativos.

## Status
- Current status: `implemented`
- Next action:
  Validar la rama de integración completa y abrir PR final hacia `develop`.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [x] Implementation completed (if in scope)

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
- Related issue(s): `BRI-79`, `BRI-115`, `BRI-116`, `BRI-117`, `BRI-135`, `BRI-118`, `BRI-136`, `BRI-119`
- Related PR(s): `pending final PR from story-011-10-collections-health-and-manual-review-queue-bri-79 -> develop`
- Final commit hash(es): `7104483`, `4a45533`, `1a56a83`, `d1c8d14`, `636aebb`, `d8d3ec1`, `f8f112c`
