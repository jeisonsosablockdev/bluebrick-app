# STORY-008-07-limits-risk-and-compliance-controls

## Metadata
- Epic: `EPIC-008-recarga-recurrente-co-littio-sphere-solana`
- Story ID: `STORY-008-07-limits-risk-and-compliance-controls`
- Status: `draft` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-03`
- Last Updated: `2026-04-03`

## Context
- Problem:
  Sin motor de limites y riesgo, una recarga puede violar politicas internas o regulatorias.
- Why now:
  Debe existir capa preventiva antes del fallback y del rollout final.
- Constraints:
  - `blockedBy`: `STORY-008-06`.
  - Considerar limite efectivo: producto, rail, banco/usuario, riesgo interno.
  - Casos de terceros o anomalias deben ir a `under_review`.
  - Nota de alcance: esta fase tiene dependencia de revision administrativa para politicas finales.
  - Todas las decisiones deben ser explicables y auditables con metadata de regla/version/fuente.
- Affected paths:
  - `app/api/**` risk engine/prechecks
  - `lib/**` reglas de limites y scoring
  - `app/**` mensajes de topes y estados de revision

## Sphere References (Story Scope)
- `/api-reference/transfer-fee/get-id`
- `/api-reference/transfer-fee/post`
- `/platform/supported-rails-currencies`
- `/platform/reference/rate-limits`
- `/platform/transfer-lifecycle`

## Existing Infrastructure Reuse (Project)
- `db/migrations/012_profile_kyc_compliance.sql` (`compliance_audit_events`)
- `db/migrations/017_authority_lifecycle_registry.sql` (`authority_audit_events` como patrón de auditoría)
- `knowledge/purchase-tracing.md` (correlación operativa por flujo)

## Proposal
- Approach summary:
  Incorporar prechecks de topes y riesgo antes de procesar automaticamente cualquier recarga.
- Technical design:
  - Calcular limite efectivo dinamico por usuario y rail.
  - Aplicar reglas de riesgo para enrutar a `under_review` cuando corresponda.
  - Mensajeria UI de limites bancarios variables y estado de evaluacion.
  - Politica de depositos de terceros con tratamiento explicito.
  - Registro auditable de decisiones de riesgo.
  - Versionado de reglas (`policy_version`) y motivo de decisión (`decision_reason_code`).
- Alternatives considered:
  - Revisar manualmente todos los casos: rechazado por friccion y baja escalabilidad.
- Tradeoffs:
  - Mayor complejidad de reglas, menor exposicion operativa/compliance.

## Critique
- Reviewer(s):
  - `risk`
  - `compliance`
- Critical findings:
1. Debe existir explicabilidad minima de por que una recarga se marca `under_review`.
2. Las reglas deben ser versionables y auditables.
3. Mensajes de UI no deben prometer limites fijos cuando son variables.
4. Debe existir correlación entre decisión de riesgo y evento transaccional origen.
- Blocking concerns:
  No avanzar a `STORY-008-08` sin baseline de controles aceptados.

## Resolution
- Final approach after critique:
  Aprobar motor de prechecks con auditoria de decisiones y salida a `under_review`.
- Changes accepted:
  - Limite efectivo dinamico por fuente y riesgo.
  - Registro de decisiones para auditoria.
- Changes rejected (with rationale):
  - Auto-procesar sin controles por ser MVP (rechazado por riesgo alto).

## Decision
- Decision: `pending` (`pending | approved | rejected`)
- Decision date: `2026-04-03`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Pendiente confirmacion administrativa de umbrales finales.

## Status
- Current status: `draft`
- Next action:
  Aprobar baseline de limites/riesgo para desbloquear `STORY-008-08`.
- Exit criteria:
- [ ] All critical critique points addressed
- [ ] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Calculo de limite efectivo y reglas de escalamiento.
  - Serialización de auditoría con `policy_version` y `decision_reason_code`.
- Integration tests:
  - Casos auto-approve vs `under_review` vs `failed`.
- Devnet validation (if applicable):
  - Validar que limites aplican antes de etapas on-chain de entrega.
- Responsive QA (if applicable):
  - Mensajeria de limites y review legible en todas las resoluciones.

## Traceability
- Related issue(s): `BRI-34`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
