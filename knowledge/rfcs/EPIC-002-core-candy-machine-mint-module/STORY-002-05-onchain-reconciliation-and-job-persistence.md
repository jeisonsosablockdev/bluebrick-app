# STORY-002-05-onchain-reconciliation-and-job-persistence

## Metadata
- Epic: `EPIC-002-core-candy-machine-mint-module`
- Story ID: `STORY-002-05-onchain-reconciliation-and-job-persistence`
- Status: `in-review` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-03-16`
- Last Updated: `2026-03-16`

## Context
- Problem:
  Falta reconciliación final on-chain y persistencia mínima del job para garantizar consistencia entre UI y estado real de red.
- Why now:
  Sin reconciliación, un flujo aparentemente exitoso puede quedar inconsistente por fallos intermitentes RPC.
- Constraints:
  - Reconciliación obligatoria contra RPC/DAS real.
  - Persistencia mínima, sin recovery avanzado multi-escenario.
  - Sin mocks/simulación.
- Affected paths:
  - `/app` (persistencia job + endpoint/acción de reconciliación)
  - `knowledge/state-machine.md`
  - `knowledge/devnet-proof.md`

## Proposal
- Approach summary:
  Añadir capa mínima de estado de job y una reconciliación final que valide lo minteado en cadena antes de cerrar el flujo.
- Technical design:
  - Persistencia mínima por job:
    - `jobId`
    - `status`
    - `requestedQuantity`
    - `mintedQuantity`
    - `signatures[]`
    - `lastError`
    - `updatedAt`
  - Reconciliación final:
    1. Consultar signatures/activos esperados vía RPC/DAS.
    2. Comparar contra estado local.
    3. Marcar `reconciled` o `reconciliation-failed`.
- Alternatives considered:
  - Sin persistencia (rechazado por riesgo alto de pérdida de estado).
  - Recovery completo en este epic (rechazado por scope actual).
- Tradeoffs:
  - Pro: consistencia mínima y trazabilidad operativa.
  - Con: deja recovery avanzado para un epic posterior.

## Critique
- Reviewer(s):
  - `TBD`
- Critical findings:
1. Debe definirse timeout/retry acotado de reconciliación.
2. El estado final debe ser determinista para UX y auditoría.
3. Deben registrarse evidencias de reconciliación en devnet-proof.
- Blocking concerns:
  Pendiente aprobar esquema exacto de persistencia mínima.

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
  Aprobar contrato final de job y reconciliación.
- Exit criteria:
- [ ] All critical critique points addressed
- [ ] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Transiciones de estado de reconciliación.
  - Cálculo de delta (`expected vs actual minted`).
  - Manejo de errores de consulta RPC/DAS.
- Integration tests:
  - Flujo completo termina con estado reconciliado.
  - Persistencia mínima conserva estado ante refresco/reapertura.
- Devnet validation (if applicable):
  - Confirmar signatures en cadena.
  - Validar cantidad final minteada desde RPC/DAS.
- Responsive QA (if applicable):
  - Vista de estado final usable en 320/375/768/1024.

## Traceability
- Related issue(s): `EPIC-002`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
