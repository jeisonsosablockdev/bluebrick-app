# STORY-008-02-customer-onboarding-and-compliance-kyc-kyb-tos

## Metadata
- Epic: `EPIC-008-recarga-recurrente-co-littio-sphere-solana`
- Story ID: `STORY-008-02-customer-onboarding-and-compliance-kyc-kyb-tos`
- Status: `draft` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-04-03`
- Last Updated: `2026-04-03`

## Context
- Problem:
  Sin onboarding de customer en Sphere no se puede habilitar recarga recurrente con controles de compliance.
- Why now:
  Phase 3+ requiere un customer validado; esta historia desbloquea wallet, cuenta dedicada y procesamiento de recargas.
- Constraints:
  - `blockedBy`: `STORY-008-01`.
  - Ninguna recarga si `verificationProfiles.status != approved`.
  - Debe quedar evidencia auditable de TOS/agreements.
  - Debe integrarse al mismo modelo de trazabilidad inmutable usado en epics previos (eventos deduplicables + metadata de actor/fuente/resultado).
- Affected paths:
  - `app/api/**` onboarding/compliance
  - `lib/**` integracion Sphere customers
  - `app/**` estado de verificacion en recarga
  - `docs/auth-flow.md`, `docs/session-model.md` (si cambia modelo)

## Sphere References (Story Scope)
- `/platform/customers`
- `/platform/customers/individual/integration-guide/kyc-via-link`
- `/platform/customers/business/integration-guide/kyb-via-link`
- `/api-reference/customer/get`
- `/api-reference/customer/get-id`
- `/api-reference/customer/post`
- `/api-reference/enhanced-due-diligence/tos`

## Existing Infrastructure Reuse (Project)
- `app/api/webhooks/stripe/identity/route.ts` (patron de webhook compliance + validacion firma)
- `db/migrations/012_profile_kyc_compliance.sql` (`kyc_webhook_events`, `compliance_audit_events`)
- `docs/auth-flow.md` (modelo actual de onboarding/compliance server-side)

## Proposal
- Approach summary:
  Implementar onboarding hospedado por link en Sphere y persistir estado de verificacion como gate estricto de recarga.
- Technical design:
  - Verificar si existe customer asociado al usuario.
  - Crear/recuperar flujo KYC/KYB por link segun tipo de customer.
  - Polling o refresh de `verificationProfiles.status` hasta `approved`.
  - Persistir estado local normalizado: `pending`, `in_review`, `approved`, `rejected`.
  - Persistir evidencia de consentimiento/TOS requerido por proveedor.
  - Persistir cadena de custodia por evento (`provider_event_id`, `event_type`, `received_at`, `decision`, `actor`).
  - Exponer estado en UI de recarga en tiempo funcional.
- Alternatives considered:
  - Onboarding manual fuera del producto: rechazado por baja escalabilidad y mala trazabilidad.
- Tradeoffs:
  - Mayor integracion inicial de compliance, menor riesgo operacional posterior.

## Critique
- Reviewer(s):
  - `compliance`
  - `backend`
- Critical findings:
1. El gate de verificacion debe aplicarse server-side, no solo en UI.
2. Debe existir trazabilidad audit trail por cambio de estado.
3. Debe contemplar expiraciones o reinicios de onboarding.
4. El diseño debe aceptar webhook/polling como fuentes de evento equivalentes sin reescribir la proyeccion de estado.
- Blocking concerns:
  No iniciar `STORY-008-03` hasta dejar decision aprobada de estados y evidencia compliance.

## Resolution
- Final approach after critique:
  Mantener onboarding hospedado via Sphere Link con control estricto server-side y auditoria de consentimientos.
- Changes accepted:
  - Gate hard de recarga por `approved`.
  - Persistencia de eventos de verificacion para auditoria.
  - Normalizacion de eventos por `source_type` (`polling`/`webhook`) para compatibilidad futura.
- Changes rejected (with rationale):
  - Aprobacion manual ad-hoc sin evidencia (rechazado por riesgo de cumplimiento).

## Decision
- Decision: `pending` (`pending | approved | rejected`)
- Decision date: `2026-04-03`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Requiere cierre con compliance sobre evidencia minima obligatoria.

## Status
- Current status: `draft`
- Next action:
  Aprobar modelo de estados y contrato backend/UI para desbloquear `STORY-008-03`.
- Exit criteria:
- [ ] All critical critique points addressed
- [ ] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Validaciones de mapeo de estado Sphere -> estado interno.
  - Deduplicacion de eventos de compliance por `provider_event_id`.
- Integration tests:
  - Flujo onboarding link + persistencia de estado + bloqueo de recarga.
- Devnet validation (if applicable):
  - N/A directo (compliance/API), con smoke end-to-end posterior.
- Responsive QA (if applicable):
  - Visualizacion de estado de verificacion en bloque de recarga.

## Traceability
- Related issue(s): `BRI-29`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
