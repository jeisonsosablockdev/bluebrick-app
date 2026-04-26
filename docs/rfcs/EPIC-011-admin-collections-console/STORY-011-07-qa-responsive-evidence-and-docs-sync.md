# STORY-011-07-qa-responsive-evidence-and-docs-sync

## Metadata
- Epic: `EPIC-011-admin-collections-console`
- Story ID: `STORY-011-07-qa-responsive-evidence-and-docs-sync`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-17`
- Last Updated: `2026-04-17`

## Context
- Problem:
  El epic requiere validación funcional, responsive y documental antes de poder considerarse cerrado bajo la gobernanza del repo.
- Why now:
  Definir QA/documentación al final produce huecos de alcance; este story fija los gates desde el inicio.
- Constraints:
  - Playwright obligatorio para frontend/auth changes.
  - Responsive QA obligatorio.
  - Debe actualizar al menos un `docs/features/*.md`.
  - Si cambia trust boundary admin/content edit, actualizar docs canónicos.
- Affected paths:
  - `e2e/*`
  - `docs/features/*`
  - `docs/auth-flow.md`
  - `docs/session-model.md` (si aplica)

## Proposal
- Approach summary:
  Cerrar el epic con evidencia de UI/API, responsive QA y documentación sincronizada.
- Technical design:
  - Playwright:
    - acceso admin a `/admin/collections`
    - listado de colecciones propias
    - apertura de detalle
    - edición de secciones permitidas
    - cover no editable
  - Responsive QA:
    - 320px
    - 375px
    - 768px
    - 1024px
  - Docs:
    - feature note nueva del epic
    - `docs/auth-flow.md` si se agregan endpoints admin nuevos
    - `README` y story RFCs actualizados con status/traceability
- Alternatives considered:
  - Dejar QA/doc como parte implícita de otros stories.
    - Rechazado: reduce trazabilidad y suele dejar huecos.
- Tradeoffs:
  - Story final dedicada agrega overhead, pero mejora cierre formal y auditabilidad.

## Critique
- Reviewer(s):
  - `TBD`
- Critical findings:
1. Falta definir evidencia MCP exacta si se requiere captura adicional.
2. Falta decidir alcance de Synpress; probablemente no aplique si no hay flujo wallet crítico nuevo.
3. Falta definir qué docs canónicos se actualizan seguro vs opcional.
- Blocking concerns:
  - No cerrar el epic sin evidence pack mínimo y docs actualizados.

## Resolution
- Final approach after critique:
  Aprobado. Esta historia actuará como validación final de todos los mandatos del Epic (tests de ownership, inmutabilidad de carátula).
- Changes accepted:
  - QA/documentación como story explícita.
- Changes rejected (with rationale):
  - Rechazado dejar estos gates como “implícitos”.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-04-17`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Matriz de QA formalmente aprobada como requisito innegociable de salida.

## Status
- Current status: `approved`
- Next action:
  Ejecutar el pipeline de validación sobre el código final, empezando por la regresión de API/admin collections ya cubierta en `BRI-100`.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Helpers/document mappers que cambien durante el epic.
- Integration tests:
  - Endpoints admin collections.
- Devnet validation (if applicable):
  - No se requiere nueva transacción devnet si no cambia blockchain scope.
- Responsive QA (if applicable):
  - Obligatoria con checklist en PR.

## Traceability
- Related issue(s): `BRI-100`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`

## Slice Notes
- `2026-04-26`:
  - `BRI-100` cierra la primera capa de regresión del story con tests de API/admin collections para ownership canonical, blank ids, cover immutable rejection y `400` explícito para JSON PATCH inválido.
