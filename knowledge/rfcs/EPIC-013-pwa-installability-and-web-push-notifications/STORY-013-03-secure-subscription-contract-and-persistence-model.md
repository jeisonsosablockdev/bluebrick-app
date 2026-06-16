# STORY-013-03-secure-subscription-contract-and-persistence-model

## Metadata
- Epic: `EPIC-013-pwa-installability-and-web-push-notifications`
- Story ID: `STORY-013-03-secure-subscription-contract-and-persistence-model`
- Status: `in-review` (`draft | in-review | approved | implemented | rejected`)
- Owner: `jaymusicmachine`
- Created: `2026-05-09`
- Last Updated: `2026-05-11`

## Context
- Problem:
  El plan inicial propone una tabla `PushSubscription` asociada a `UserId`, pero el repo ahora opera con auth hibrido (`account_id` WorkOS + wallet SIWS) y multiples superficies/estados por usuario. Un modelo 1:1 no alcanza.
- Why now:
  Si el schema nace mal, todo lo demas queda contaminado: targeting, revoke, dedupe, pruning, analytics y cumplimiento de consentimiento.
- Constraints:
  - No confiar en `accountId`, `wallet` ni `userId` enviados por cliente para ownership.
  - Debe soportar multiples dispositivos y reinstalaciones.
  - Debe pasar por el gate nuevo `validate:db` y por migracion real contra Postgres limpio.
  - Debe convivir con Postgres/Neon actual.
- Affected paths:
  - `db/migrations/*`
  - `lib/*repository*`
  - `app/api/notifications/subscribe/*`
  - `docs/auth-flow.md`
  - `docs/session-model.md`

## Proposal
- Approach summary:
  Diseñar una entidad de suscripcion por endpoint/dispositivo vinculada server-side al wallet autenticado, con ciclo de vida explicito.
- Technical design:
  - Tabla `web_push_subscriptions` con al menos:
    - `id`
    - `account_id`
    - `wallet_public_key` (nullable solo si el opt-in de cuenta se aprueba para ciertos casos)
    - `endpoint`
    - `p256dh`
    - `auth_secret`
    - `user_agent`
    - `platform_family`
    - `app_mode` (`browser|standalone`)
    - `status` (`active|revoked|gone|failing`)
    - `subscribed_at`
    - `last_seen_at`
    - `last_sent_at`
    - `last_error_code`
    - `last_error_at`
    - `revoked_at`
    - `consent_source`
  - Unique key por endpoint.
  - `POST /api/notifications/subscriptions` ligado a la sesion real del servidor (`account`, `wallet` o `hybrid`) y nunca a un `userId` posteado desde cliente.
  - Upsert idempotente y sin sobrescribir ownership de `account_id`/`wallet_public_key` a ciegas.
- Alternatives considered:
  - Una fila por usuario.
    - Rechazado: no modela multi-dispositivo y destruye trazabilidad.
  - Suscripciones anonimas o solo de cuenta por defecto.
    - Requiere decision de producto aparte; no asumir.
- Tradeoffs:
  - Schema mas rico y mas trabajo al inicio.
  - Mucha menos deuda operativa despues.

## Critique
- Reviewer(s):
  - `security-auditor`
- Critical findings:
1. Si el endpoint acepta un `accountId`, `userId` o `wallet` del cliente como autoridad, el diseño ya nacio roto.
2. Sin `status` y timestamps de salud no existe operacion real; solo acumulacion de endpoints muertos.
3. Sin metadata minima de dispositivo/modo no podras diagnosticar por que iOS, Android o desktop fallan distinto.
4. Si el contrato no decide bien cuando una suscripcion es de cuenta y cuando es wallet-bound, el targeting de mensajes regulados o financieros va a ser inconsistente.
- Blocking concerns:
  - Aprobar solo con ownership server-side por sesion, modelo multi-endpoint explicito y `validate:db` como gate obligatorio.

## Resolution
- Final approach after critique:
  El story exigira una tabla de suscripciones rica y un contrato de upsert/revoke estrictamente ligado a SIWS.
- Changes accepted:
  - Multi-device, multi-endpoint.
  - Idempotencia y pruning-ready schema.
- Changes rejected (with rationale):
  - Rechazado simplificar el problema a `PushSubscription(userId)`.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-05-11`
- Decision owner: `jaymusicmachine`
- Approval notes:
  No se aprueba sin esquema de estado y ownership suficientemente defensivo.

## Status
- Current status: `in-review`
- Next action:
  Validar la PR de schema + API server-owned y mergearla a integracion.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - validacion de payload y state transitions.
- Integration tests:
  - subscribe idempotente, revoke, re-register, mismatch de ownership, conflicto entre `account_id` y `wallet_public_key`.
- Devnet validation (if applicable):
  - No aplica.
- Responsive QA (if applicable):
  - No aplica.

## Migration Gate
- Required preflight:
  - `npm run validate`
  - `npm run validate:db`
  - migracion aplicada y verificada contra Postgres limpio antes de aprobar implementacion

## Traceability
- Related issue(s): `BRI-157`
- Related PR(s): `#212 (open)`
- Final commit hash(es): `TBD`
