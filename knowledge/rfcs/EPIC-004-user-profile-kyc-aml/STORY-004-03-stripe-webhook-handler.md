# STORY-004-03-stripe-webhook-handler

## Metadata
- Epic: `EPIC-004-user-profile-kyc-aml`
- Story ID: `STORY-004-03-stripe-webhook-handler`
- Status: `implemented` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-03-24`
- Last Updated: `2026-03-27`

## Context
- Problem:
  Sin webhook seguro, el resultado KYC de Stripe no se refleja en el estado interno del usuario ni en el estado operativo del panel.
- Why now:
  Necesitamos cerrar el ciclo `pending -> verified/rejected` y proyectarlo a `compliance_status` de forma consistente.
- Constraints:
  - Endpoint publico con verificacion criptografica obligatoria.
  - Procesamiento idempotente por `event.id`.
  - No persistir payloads con PII sensible.
- Affected paths:
  - `app/api/webhooks/stripe/identity/route.ts`
  - `lib/kyc/stripe-webhook-handler.ts`
  - `lib/compliance/compliance-status-projector.ts`
  - `db/migrations/*` (`kyc_webhook_events`, ajustes `kyc_cases`, `user_profiles.compliance_status`)

## Proposal
- Approach summary:
  Procesar eventos Stripe Identity con firma validada, actualizar `kyc_status` y disparar proyección denormalizada de `compliance_status`.
- API/routes:
  - `POST /api/webhooks/stripe/identity`
- Technical design:
  - Verificacion de firma:
    - Validar `Stripe-Signature` con secreto del webhook.
  - Idempotencia:
    - Persistir `provider_event_id` y descartar duplicados.
  - Mapping de eventos:
    - `identity.verification_session.processing` -> `kyc_status=pending`
    - `identity.verification_session.verified` -> `kyc_status=verified`
    - `identity.verification_session.requires_input` -> `kyc_status=rejected`
    - `identity.verification_session.canceled` -> `kyc_status=rejected`
  - Proyeccion `compliance_status`:
    - Si `kyc_status=rejected` -> `compliance_status=pending_kyc`
    - Si `kyc_status=verified` y AML ausente -> `compliance_status=pending_aml`
    - Si `kyc_status=verified` y AML review -> `compliance_status=pending_review`
  - Persistencia local permitida:
    - `wallet_public_key`, `kyc_provider_session_id`, `kyc_provider_report_id`, `kyc_rejection_code`, timestamps.
  - Persistencia local prohibida:
    - `legal_full_name`, `date_of_birth`, `document_*`, cualquier imagen/archivo.
  - Eventos de auditoria:
    - `kyc.webhook_received`
    - `kyc.status_updated`
    - `compliance.status_projected`
    - `kyc.webhook_replayed`
- Alternatives considered:
  - Polling de Stripe: rechazado por ineficiente y mayor latencia.
- Tradeoffs:
  - Mayor complejidad de backend, a cambio de consistencia y trazabilidad.

## Critique
- Reviewer(s):
  - `staff-review`
- Critical findings:
1. Firma de webhook debe ser obligatoria; eventos sin firma valida se rechazan.
2. Reprocesar eventos debe ser seguro e idempotente.
3. No almacenar payload completo del webhook para evitar fuga de PII.
4. Debe actualizarse el estado denormalizado para no degradar el rendimiento del panel admin.
- Blocking concerns:
  Ninguno.

## Resolution
- Final approach after critique:
  Webhook firmado + idempotente + actualización de `compliance_status` vía proyector.
- Changes accepted:
  - Tabla de idempotencia con `provider_event_id` unico.
  - Catalogo de codigos de rechazo normalizado.
  - Proyeccion sincrona/asincrona de `compliance_status` tras cada evento KYC.
- Changes rejected (with rationale):
  - Persistencia de payload webhook crudo completo: rechazado por compliance.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-03-24`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Aprobado para consolidar estado KYC oficial desde Stripe y proyectar estado operativo performante.

## Status
- Current status: `implemented`
- Next action:
  Continuar con stories de AML y panel de cumplimiento (`STORY-004-04` y `STORY-004-05`).
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [x] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Verificacion de firma webhook.
  - Mapping `event.type -> kyc_status`.
  - Idempotencia por `provider_event_id`.
  - Proyeccion `kyc_status -> compliance_status`.
- Integration tests:
  - Evento `verified` actualiza `kyc_status=verified` y `compliance_status=pending_aml|pending_review`.
  - Evento `requires_input` actualiza `kyc_status=rejected` y `compliance_status=pending_kyc`.
  - Evento duplicado no altera estado segunda vez.
- Compliance tests:
  - Verificar que DB no persiste campos PII/documentales.

## Traceability
- Related issue(s): `EPIC-004`
- Related PR(s): `#55`
- Final commit hash(es): `467ee31`
