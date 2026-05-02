# STORY-012-04-attribution-validation-and-reward-execution

## Metadata
- Epic: `EPIC-012-referral-marketing-system-in-user-dashboard`
- Story ID: `STORY-012-04-attribution-validation-and-reward-execution`
- Status: `draft` (`draft | in-review | approved | implemented | rejected`)
- Owner: `jaymusicmachine`
- Created: `2026-05-02`
- Last Updated: `2026-05-02`

## Context
- Problem:
  El sistema necesita un backend infalible para convertir señales frontend en una atribución única, persistida y elegible para recompensa sin duplicidades ni fraude obvio.
- Why now:
  Sin este backend, la UX de share y dashboard solo sería una capa cosmética sin fuente real de verdad.
- Constraints:
  - Una wallet referida no puede reasignarse después.
  - No puede existir recompensa aprobada sin KYC y evento elegible.
  - El payload de recompensas debe servir tanto al dashboard como a auditoría interna.
- Affected paths:
  - `app/api/...`
  - `lib/referrals/...`
  - persistencia PostgreSQL
  - jobs asíncronos / cálculo de recompensa

## Proposal
- Approach summary:
  Consolidar la capa backend que haga mapping entre `referring_wallet` y `referred_wallet`, aplique atribución única y entregue el payload de recompensas para la consola del usuario.
- Technical design:
  - **Sub-story 4.1 (Wallet Mapping):** crear la relación entre `referring_wallet` y `referred_wallet` al detectar el primer evento de conexión/sign-in.
  - **Sub-story 4.2 (Anti-Duplicidad):** impedir que una wallet ya registrada sea referida posteriormente por otra persona.
  - **Sub-story 4.3 (Payload de Recompensa):** endpoint que calcule y entregue los datos de recompensas en función de eventos completados por los referidos.
  - El backend debe consumir la persistencia/referral state producido por Stories 1 y 3, y exponer un payload canónico para Story 2.
- Alternatives considered:
  - Resolver elegibilidad solo con eventos frontend.
  - Permitir reatribución manual posterior.
  - Calcular reward status directamente en cliente.
- Tradeoffs:
  - Centralizar toda la lógica backend mejora consistencia, pero aumenta la necesidad de contratos claros y pruebas.
  - La atribución única protege contra fraude, pero requiere reglas explícitas de resolución de conflictos.

## Critique
- Reviewer(s):
  - `pending`
- Critical findings:
1. Definir exactamente cuál es el primer evento que “sella” la atribución.
2. Establecer estrategia de conflicto cuando ya existe una atribución previa.
3. Confirmar qué campos exactos necesita el payload del dashboard para no sobrediseñar el endpoint.
- Blocking concerns:
  - Falta especificar el contrato completo de elegibilidad (`KYC + first eligible action`) y el ciclo de vida de estados de recompensa.

## Resolution
- Final approach after critique:
  Pendiente de aprobación del contrato de eventos elegibles y estados `pending / approved / paid / rejected`.
- Changes accepted:
  - Mapping de wallets al primer sign-in elegible.
  - Regla de atribución única.
  - Endpoint canónico de reward payload.
- Changes rejected (with rationale):
  - Lógica distribuida entre frontend y backend, porque rompe auditabilidad.

## Decision
- Decision: `pending` (`pending | approved | rejected`)
- Decision date: `2026-05-02`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Pendiente de cerrar definiciones de elegibilidad, antifraude y estados de recompensa.

## Status
- Current status: `draft` (`draft | in-review | approved | implemented | rejected`)
- Next action:
  Formalizar el contrato de mapping, unicidad y reward payload.
- Exit criteria:
- [ ] All critical critique points addressed
- [ ] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Reglas de unicidad y transición de estados de recompensa.
- Integration tests:
  - Mapping correcto en primer sign-in.
  - Bloqueo de reatribución posterior.
  - Payload de recompensas consistente con eventos persistidos.
- Devnet validation (if applicable):
  - N/A
- Responsive QA (if applicable):
  - N/A

## Traceability
- Related issue(s): `BRI-16`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
