# STORY-008-04-dedicated-onramper-account-provisioning

## Metadata
- Epic: `EPIC-008-recarga-recurrente-co-littio-sphere-solana`
- Story ID: `STORY-008-04-dedicated-onramper-account-provisioning`
- Status: `draft` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-03`
- Last Updated: `2026-04-03`

## Context
- Problem:
  El modelo recurrente requiere instrucciones de deposito estables por usuario; sin cuenta dedicada aumenta error operacional y riesgo de mezcla de fondos.
- Why now:
  Es la base del flujo recurrente previo a tutorial Colombia y orquestacion de estados.
- Constraints:
  - `blockedBy`: `STORY-008-03`.
  - Regla dura: una Onramper Account por customer, sin comparticion.
  - Persistir `depositInstructions` y mostrar enmascarado en UI.
  - Debe existir trazabilidad de provisioning y cambios de estado de cuenta para auditoria operativa.
- Affected paths:
  - `app/api/**` provisioning virtual accounts
  - `lib/**` integracion Onramper
  - `app/**` bloque cuenta de recarga

## Sphere References (Story Scope)
- `/platform/onramper-accounts`
- `/platform/onramper-accounts/guide`
- `/api-reference/virtual-account/post`
- `/api-reference/virtual-account/get`
- `/api-reference/virtual-account/get-id`
- `/api-reference/virtual-account/patch`
- `/api-reference/virtual-account/deactivate`
- `/api-reference/virtual-account/reactivate`

## Existing Infrastructure Reuse (Project)
- `db/migrations/011_purchase_webhook_events.sql` (patron de deduplicacion de eventos provider)
- `db/migrations/012_profile_kyc_compliance.sql` (patron de audit trail compliance)
- `knowledge/authority-model.md` (reglas de ownership/segregacion por entidad)

## Proposal
- Approach summary:
  Provisionar cuenta virtual dedicada por customer aprobado y reutilizarla para recargas repetidas.
- Technical design:
  - Buscar cuenta virtual existente para customer.
  - Crear si no existe y asociar de forma inmutable a customer interno.
  - Persistir referencia de cuenta + instrucciones de deposito.
  - Enmascarar datos sensibles en frontend (mostrar solo info necesaria).
  - Controles anti-reutilizacion cruzada entre usuarios.
  - Persistir metadata de lifecycle (`created`, `active`, `deactivated`, `reactivated`) para soporte y compliance.
- Alternatives considered:
  - Crear cuenta por cada recarga: rechazado por friccion y peor UX recurrente.
- Tradeoffs:
  - Mayor responsabilidad de ciclo de vida de cuenta, pero mejor continuidad y experiencia.

## Critique
- Reviewer(s):
  - `backend`
  - `risk`
- Critical findings:
1. Debe existir constraint de unicidad `customer_id -> virtual_account_id`.
2. Se requiere estrategia de recuperacion ante cuentas huérfanas/inconsistentes.
3. Enmascarado UI no debe exponer datos operativamente sensibles.
- Blocking concerns:
  No iniciar `STORY-008-05` sin cuenta dedicada estable.

## Resolution
- Final approach after critique:
  Aprobado modelo de cuenta dedicada unica con persistencia fuerte y controles anti-sharing.
- Changes accepted:
  - Provision idempotente create-or-retrieve.
  - Masking de instrucciones en UI.
- Changes rejected (with rationale):
  - Compartir cuenta entre customers por simplificacion (rechazado por riesgo compliance).

## Decision
- Decision: `pending` (`pending | approved | rejected`)
- Decision date: `2026-04-03`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Confirmar constraints de DB y politicas de remediation.

## Status
- Current status: `draft`
- Next action:
  Aprobar contrato de cuenta dedicada para desbloquear `STORY-008-05`.
- Exit criteria:
- [ ] All critical critique points addressed
- [ ] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Unicidad customer/cuenta y enmascarado de instrucciones.
- Integration tests:
  - Create-or-retrieve idempotente y anti-cross-user reuse.
  - Flujo deactivate/reactivate sin perdida de trazabilidad.
- Devnet validation (if applicable):
  - Validar flujo de lectura/escritura de cuenta dedicada con datos reales de integracion.
- Responsive QA (if applicable):
  - Tarjeta ACH permanente legible en mobile/desktop.

## Traceability
- Related issue(s): `BRI-31`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
