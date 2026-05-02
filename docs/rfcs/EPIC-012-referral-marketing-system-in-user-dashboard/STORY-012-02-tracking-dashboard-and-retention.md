# STORY-012-02-tracking-dashboard-and-retention

## Metadata
- Epic: `EPIC-012-referral-marketing-system-in-user-dashboard`
- Story ID: `STORY-012-02-tracking-dashboard-and-retention`
- Status: `draft` (`draft | in-review | approved | implemented | rejected`)
- Owner: `jaymusicmachine`
- Created: `2026-05-02`
- Last Updated: `2026-05-02`

## Context
- Problem:
  El referente necesita ver progreso real del programa para seguir invitando y entender cuándo una invitación ya se convirtió en una recompensa válida.
- Why now:
  Sin consola de seguimiento, el programa se siente opaco y pierde motivación. El dashboard es el punto de retención del referente.
- Constraints:
  - El estado visible debe depender del backend, no de heurísticas del cliente.
  - Las notificaciones y niveles no pueden prometer recompensas no aprobadas.
  - La UI debe mantenerse simple y entendible.
- Affected paths:
  - `app/(dashboard)/...`
  - `app/api/...`
  - `lib/referrals/...`
  - posible store interno de notificaciones

## Proposal
- Approach summary:
  Construir una consola de seguimiento que combine estado detallado, señales de progreso y feedback visible para retener al referente.
- Technical design:
  - **Sub-story 2.1 (Data Viz):** listado de wallets referidas, clasificadas por estado (`Pendiente` / `Completado`).
  - **Sub-story 2.2 (Engagement):** notificaciones internas con indicador visual cuando un referido se acepta con éxito.
  - **Sub-story 2.3 (Gamification):** barra de progreso o hitos para mostrar cuántos referidos faltan para el siguiente nivel.
  - El dashboard debe consumir un payload backend único para evitar divergencia de estado.
- Alternatives considered:
  - Mostrar solo agregados y no listado detallado.
  - Omitir notificaciones internas en el MVP.
  - Omitir gamificación hasta fases posteriores.
- Tradeoffs:
  - El listado detallado mejora confianza, pero requiere reglas claras de privacidad/visibilidad.
  - La gamificación mejora retención, pero eleva riesgo de mensajes engañosos si el backend no es exacto.

## Critique
- Reviewer(s):
  - `pending`
- Critical findings:
1. Validar qué nivel de detalle de wallet puede mostrarse sin comprometer privacidad.
2. Definir si la notificación vive como badge simple o como inbox/event stream.
3. Evitar que la barra de progreso se compute con estados todavía no elegibles.
- Blocking concerns:
  - Falta definir el contrato exacto del payload de recompensas y milestones.

## Resolution
- Final approach after critique:
  Pendiente de validar el grado de detalle de visibilidad y el contrato del payload de dashboard.
- Changes accepted:
  - Estado detallado por referido.
  - Indicador visual de éxito.
  - Hitos/gamificación del programa.
- Changes rejected (with rationale):
  - Dashboard puramente agregado, porque reduce trazabilidad para el usuario.

## Decision
- Decision: `pending` (`pending | approved | rejected`)
- Decision date: `2026-05-02`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Pendiente de aprobación junto con el payload backend de recompensas.

## Status
- Current status: `draft` (`draft | in-review | approved | implemented | rejected`)
- Next action:
  Definir payload canónico de reward status, notificaciones y hitos.
- Exit criteria:
- [ ] All critical critique points addressed
- [ ] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Mapeo de estados visibles y cálculo de milestones.
- Integration tests:
  - Dashboard refleja correctamente cambios de estado desde backend.
  - Indicador visual se activa solo para referidos aceptados.
- Devnet validation (if applicable):
  - N/A
- Responsive QA (if applicable):
  - Tabla/listado, badge y barra de progreso en `320`, `375`, `768`, `1024`.

## Traceability
- Related issue(s): `BRI-16`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
