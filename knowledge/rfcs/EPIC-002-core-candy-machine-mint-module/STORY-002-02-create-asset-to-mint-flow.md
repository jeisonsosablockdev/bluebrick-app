# STORY-002-02-create-asset-to-mint-flow

## Metadata
- Epic: `EPIC-002-core-candy-machine-mint-module`
- Story ID: `STORY-002-02-create-asset-to-mint-flow`
- Status: `in-review` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-03-16`
- Last Updated: `2026-03-16`

## Context
- Problem:
  El botón `Continue to mint` debe avanzar al paso 2 dentro de la misma sección visual, pero no existe una especificación RFC cerrada del flujo continuo y prefill.
- Why now:
  Es el punto de entrada del módulo mint y condiciona todo el pipeline posterior (deploy/mint/reconcile).
- Constraints:
  - No cambio de módulo/ruta al pasar de paso 1 a paso 2.
  - Prefill obligatorio desde el formulario inicial.
  - Mobile-first y sin overflow horizontal.
- Affected paths:
  - `/app/admin/assets/new` (pasos UI)
  - `/app` (estado cliente/servidor del flujo)
  - `knowledge/auth-flow.md` y `knowledge/session-model.md` (si hay cambios de sesión/autorización)

## Proposal
- Approach summary:
  Definir y construir un wizard de una sola sección continua con dos pasos visibles:
  1) `Create Asset`
  2) `Mint Setup (prefill)`
- Technical design:
  - Paso 1 (`Create Asset`): cover + metadata base + quantity.
  - Acción `Continue to mint`: valida campos mínimos y avanza a paso 2 en la misma vista.
  - Paso 2 (`Mint Setup`): mostrar prefill de:
    - `cover/uri`
    - `name/symbol/description`
    - `quantity`
- Alternatives considered:
  - Navegar a otra ruta/página para mint (rechazado por requisito de flujo continuo).
  - Mantener formulario único sin pasos (rechazado por baja claridad operativa).
- Tradeoffs:
  - Pro: experiencia guiada y continuidad visual clara.
  - Con: mayor complejidad de estado local + validaciones por paso.

## Critique
- Reviewer(s):
  - `TBD`
- Critical findings:
1. Debe quedar explícito que no se confía en validaciones de cliente para autoridad.
2. El prefill no debe introducir divergencia con valores persistidos del job.
3. Debe verificarse responsive en 320/375/768/1024.
- Blocking concerns:
  Pendiente aprobación del diseño final de estado del wizard.

## Resolution
- Final approach after critique:
  `TBD` tras review.
- Changes accepted:
  `TBD`
- Changes rejected (with rationale):
  `TBD`

## Decision
- Decision: `pending` (`pending | approved | rejected`)
- Decision date: `2026-03-16`
- Decision owner: `TBD`
- Approval notes:
  Pendiente review.

## Status
- Current status: `in-review`
- Next action:
  Revisar y aprobar el contrato de estado del flujo continuo.
- Exit criteria:
- [ ] All critical critique points addressed
- [ ] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Estado del wizard: transición `step1 -> step2`.
  - Prefill correcto de campos.
  - Validaciones mínimas antes de avanzar.
- Integration tests:
  - Flujo UI completo en una sola sección sin cambio de módulo.
  - Botón `Continue to mint` conserva datos y habilita setup de mint.
- Devnet validation (if applicable):
  `N/A` en esta historia.
- Responsive QA (if applicable):
  - [ ] 320px sin overflow.
  - [ ] 375px sin overflow.
  - [ ] 768px estable.
  - [ ] 1024px estable.
  - [ ] Touch targets >= 44px.

## Traceability
- Related issue(s): `EPIC-002`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
