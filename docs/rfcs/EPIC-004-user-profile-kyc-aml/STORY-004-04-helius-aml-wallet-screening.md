# STORY-004-04-helius-aml-wallet-screening

## Metadata
- Epic: `EPIC-004-user-profile-kyc-aml`
- Story ID: `STORY-004-04-helius-aml-wallet-screening`
- Status: `approved` (`draft | in-review | approved | implemented`)
- Owner: `jaymusicmachine`
- Created: `2026-03-24`
- Last Updated: `2026-03-24`

## Context
- Problem:
  KYC por si solo no cubre riesgo AML de wallet.
- Why now:
  Antes de operaciones financieras debemos detectar wallets sancionadas o con alto riesgo y reflejarlo en el estado operativo del usuario.
- Constraints:
  - Integrar Helius como proveedor AML.
  - Fail-safe: errores de proveedor no pueden terminar en `clear`.
  - Resultado AML debe ser auditable y proyectarse a `compliance_status`.
- Affected paths:
  - `lib/compliance/aml-helius.ts`
  - `lib/compliance/compliance-status-projector.ts`
  - `app/api/internal/compliance/aml/screen/route.ts`
  - `app/api/admin/compliance/*`
  - `db/migrations/*` (`aml_screenings` o campos AML en `kyc_cases`)

## Proposal
- Approach summary:
  Ejecutar screening AML de wallet vía Helius en eventos clave y persistir resultado normalizado para uso operativo/admin.
- API/routes:
  - `POST /api/internal/compliance/aml/screen`
  - `GET /api/admin/compliance/cases/:walletPublicKey/aml`
- Technical design:
  - Triggers:
    - Al iniciar KYC.
    - Al recibir `kyc_status=verified` desde webhook Stripe.
    - Re-screening programado (cron) para usuarios activos.
  - Modelo AML:
    - `aml_status`: `clear | review_required | flagged | unavailable`
    - `aml_risk_score`
    - `aml_flags_json`
    - `aml_provider = helius`
    - `aml_rule_version`
    - `aml_last_checked_at`
  - Reglas de clasificacion inicial:
    - bajo -> `clear`
    - medio -> `review_required`
    - alto/sanctions hit -> `flagged`
    - fallo/timeout -> `unavailable`
  - Proyeccion `compliance_status`:
    - `aml_status=clear` y `kyc_status=verified` -> `fully_verified`
    - `aml_status=review_required` -> `pending_review`
    - `aml_status=flagged` -> `restricted_aml`
    - `aml_status=unavailable` -> `pending_review`
  - Auditoria:
    - `aml.check_requested`
    - `aml.check_completed`
    - `aml.flagged`
    - `compliance.status_projected`
- Alternatives considered:
  - Sin AML (solo KYC): rechazado por gap regulatorio.
  - Motor AML propio: rechazado por costo/tiempo.
- Tradeoffs:
  - Dependencia externa adicional, a cambio de cobertura AML real en fase temprana.

## Critique
- Reviewer(s):
  - `staff-review`
- Critical findings:
1. Error de Helius no puede degradar a `clear`.
2. Se debe almacenar version de reglas/modelo para trazabilidad.
3. Definir TTL de cache y politicas de retry para controlar costo.
4. Debe existir traduccion clara a estado unificado para no complicar reglas de negocio futuras.
- Blocking concerns:
  Ninguno.

## Resolution
- Final approach after critique:
  AML obligatorio con fail-safe conservador y proyeccion a estado unificado.
- Changes accepted:
  - `unavailable` como estado explicito ante fallo.
  - `aml_rule_version` persistido.
  - Retry/backoff con limite de intentos.
  - Proyeccion a `compliance_status` en cada screening.
- Changes rejected (with rationale):
  - Asumir `clear` por defecto cuando proveedor no responde: rechazado.

## Decision
- Decision: `approved` (`pending | approved | rejected`)
- Decision date: `2026-03-24`
- Decision owner: `jaymusicmachine`
- Approval notes:
  Aprobado para cerrar el gap AML del epic y simplificar la logica de negocio con estado unificado.

## Status
- Current status: `approved`
- Next action:
  Implementar adaptador Helius, pipeline de screening y proyeccion de estado.
- Exit criteria:
- [x] All critical critique points addressed
- [x] Decision is `approved`
- [ ] Implementation completed (if in scope)

## Test and Validation Plan
- Unit tests:
  - Mapping respuesta Helius -> `aml_status`.
  - Manejo de timeout/error -> `unavailable`.
  - Proyeccion `aml_status + kyc_status -> compliance_status`.
- Integration tests:
  - Wallet de alto riesgo -> `flagged` -> `compliance_status=restricted_aml`.
  - Wallet de bajo riesgo y KYC verificado -> `compliance_status=fully_verified`.
  - Trigger post-KYC ejecuta screening AML.
- Compliance tests:
  - Confirmar no persistencia de PII en payload AML.

## Traceability
- Related issue(s): `EPIC-004`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
