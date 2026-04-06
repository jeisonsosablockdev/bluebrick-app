# STORY-004-02-stripe-identity-integration-kickoff

## Metadata
- Epic: `EPIC-004-user-profile-kyc-aml`
- Story ID: `STORY-004-02-stripe-identity-integration-kickoff`
- Status: `implemented` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-03-24`
- Last Updated: `2026-03-27`

## Context
- Problem:
  El usuario puede editar su perfil basico, pero no puede iniciar un flujo KYC seguro sin que la plataforma capture PII.
- Why now:
  Es el punto de entrada de cumplimiento para desbloquear funcionalidades financieras.
- Constraints:
  - Reusar `/protected/perfil`.
  - No confiar en estado cliente; validacion server-side obligatoria.
  - No almacenar PII/documentos en nuestra base.
  - Mantener estados oficiales `not_started/pending/verified/rejected`.
- Affected paths:
  - `app/protected/perfil/page.tsx`
  - `components/dashboard/profile-kyc-module.tsx`
  - `app/api/protected/profile/*`
  - `app/api/protected/kyc/stripe/session/route.ts`
  - `lib/kyc/stripe-identity.ts`

## Proposal
- Approach summary:
  El usuario gestiona perfil basico en nuestra app e inicia KYC mediante Stripe Identity; la captura documental ocurre 100% en Stripe.
- Functional design:
  - Perfil basico editable:
    - `username`, `bio`, `avatar_url`.
  - Modulo de verificacion:
    - Estado actual (`not_started/pending/verified/rejected`).
    - CTA `Iniciar verificacion`.
  - Copy de privacidad visible:
    - "La verificacion de identidad se realiza en Stripe. Esta app no almacena tus documentos."
- API/routes:
  - `GET /api/protected/profile`
  - `PUT /api/protected/profile`
  - `POST /api/protected/kyc/stripe/session`
  - `GET /api/protected/kyc/status`
- Backend flow:
  1. Verifica sesion SIWS.
  2. Aplica rate limit por wallet/IP.
  3. Crea `verification_session` en Stripe con metadata `wallet_public_key`.
  4. Guarda solo metadata local (`kyc_provider`, `kyc_provider_session_id`, `kyc_status=pending`, timestamps).
  5. Devuelve `url` segura para redireccion.
- Alternatives considered:
  - Formulario KYC in-house: rechazado por riesgo de seguridad/compliance.
- Tradeoffs:
  - Dependencia de Stripe, a cambio de reducir riesgo legal y superficie de ataque.

## Critique
- Reviewer(s):
  - `staff-review`
- Critical findings:
1. Endpoint de sesion KYC debe exigir SIWS valida.
2. Debe existir rate limit para evitar spam de sesiones.
3. Debe haber evidencia de data minimization en UX y contrato API.
- Blocking concerns:
  Ninguno.

## Resolution
- Final approach after critique:
  Se mantiene perfil local y se externaliza toda captura de identidad a Stripe.
- Changes accepted:
  - Auth SIWS server-side obligatoria.
  - Rate limiting por wallet/IP.
  - Mensaje de privacidad en el UI.
- Changes rejected (with rationale):
  - Campos PII locales (`legal_name`, `document_number`, etc.): rechazado.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-03-24`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Aprobado como punto de entrada KYC sin almacenamiento PII local.

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
  - Validacion de payload perfil basico.
  - Validacion de creacion de session Stripe y manejo de error.
- Integration tests:
  - Usuario autenticado obtiene URL de Stripe.
  - Usuario sin sesion recibe `401`.
  - Se verifica que no se persisten campos PII en DB.
- Responsive QA:
  - Validar vista en `320/375/768/1024`, sin overflow y CTA >= 44px.

## Traceability
- Related issue(s): `EPIC-004`
- Related PR(s): `#55`
- Final commit hash(es): `467ee31`
