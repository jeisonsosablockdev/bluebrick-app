# EPIC-004-user-profile-kyc-aml

## Metadata
- Epic ID: `EPIC-004`
- Title: `Perfil de Usuario y Verificacion (KYC/AML)`
- Status: `approved`
- Owner: `jaymusicmachine`
- Created: `2026-03-24`
- Last Updated: `2026-03-25`

## Scope
- Problem statement:
  La plataforma opera con identidad minima basada en wallet. Esto limita personalizacion, trazabilidad de cumplimiento y capacidad operativa para debida diligencia.
- Business goal:
  Habilitar perfil de usuario editable y flujo KYC/AML auditable para destrabar operaciones reguladas y mejorar confianza operativa.
- Technical goal:
  Implementar un sistema wallet-bound (1 wallet = 1 perfil) con:
  - perfil basico persistente asociado a wallet,
  - verificacion KYC mediante proveedor externo (Stripe Identity),
  - screening AML de wallet mediante proveedor externo (Helius),
  - estado unificado `compliance_status` denormalizado para operaciones,
  - cola de revision admin de alto rendimiento con trazabilidad y controles de incidente.
- Out of scope:
  - Almacenamiento interno de PII sensible (nombre legal, numero de documento, imagenes de documentos).
  - Handoff manual como flujo principal de KYC.
  - Soporte multi-wallet por usuario o reasignacion de perfil entre wallets.

## Success Criteria
- [x] Existe registro de perfil por `wallet_public_key` con restriccion de unicidad estricta.
- [x] Usuario puede editar datos basicos de perfil (`username`, `bio`, `avatar_url`) desde `/protected/perfil`.
- [x] Usuario puede iniciar y completar verificacion KYC en Stripe Identity desde la app.
- [x] `kyc_status` oficial usa exactamente: `not_started`, `pending`, `verified`, `rejected`.
- [x] Sistema actualiza `kyc_status` por webhook firmado de Stripe (sin procesamiento de PII en nuestra app).
- [x] Sistema ejecuta screening AML de wallet con Helius y persiste solo resultados de riesgo (`aml_status`, `aml_risk_score`, flags).
- [x] Existe `compliance_status` unificado y denormalizado en `user_profiles`.
- [ ] Lista del panel admin consulta por `compliance_status` (sin JOIN pesado en tiempo real).
- [ ] Admin dispone de acciones: `suspend`, `unsuspend`, `add internal note`, `kyc decision`, `aml decision`.
- [ ] Todo el flujo queda trazado con timestamps y eventos auditables (usuario/admin/proveedor).
- [ ] Existe prueba automatizada que valida no existencia de columnas/tablas de PII sensible en DB.

## Story Index
| Story ID | Title | RFC File | Status | PR | Notes |
| --- | --- | --- | --- | --- | --- |
| STORY-004-01 | Modelo de datos y wallet binding estricto | `STORY-004-01-profile-data-model-and-wallet-binding.md` | `implemented` | `TBD` | 1 wallet vinculable por perfil, sin reasignacion |
| STORY-004-02 | Integracion Stripe Identity: Inicio de Verificacion | `STORY-004-02-stripe-identity-integration-kickoff.md` | `implemented` | `TBD` | Usuario inicia KYC sin cargar PII en nuestra app |
| STORY-004-03 | Integracion Stripe Identity: Webhook Handler | `STORY-004-03-stripe-webhook-handler.md` | `implemented` | `TBD` | Actualiza KYC y proyecta compliance status |
| STORY-004-04 | Integracion Helius: Screening AML de Wallet | `STORY-004-04-helius-aml-wallet-screening.md` | `implemented` | `TBD` | Riesgo AML y proyeccion a compliance status |
| STORY-004-05 | Panel de Cumplimiento y Auditoria | `STORY-004-05-compliance-dashboard-and-audit.md` | `approved` | `TBD` | Cola unificada performante + acciones de incidente |
| STORY-004-06 | Staff Review and Verdict (Architectural Pivot) | `STORY-004-06-staff-review-and-verdict.md` | `approved` | `TBD` | Veredicto formal: rechazar build y adoptar buy |

## Compliance State Model
- Campo canónico para operación: `user_profiles.compliance_status`.
- Valores iniciales propuestos:
  - `pending_kyc`
  - `pending_aml`
  - `pending_review`
  - `fully_verified`
  - `restricted_aml`
  - `suspended`
- Fuente de actualización:
  - Proyector backend (`compliance-status-projector`) disparado por eventos KYC, AML y acciones admin.

## Decision Log
| Date | Story | Decision | Owner | Link |
| --- | --- | --- | --- | --- |
| 2026-03-24 | EPIC-004 | `1A` (handoff manual) marcado como `superseded` por pivot arquitectura | jaymusicmachine | `README.md` |
| 2026-03-24 | EPIC-004 | `2A` (storage privado de documentos) marcado como `superseded` por data minimization | jaymusicmachine | `README.md` |
| 2026-03-24 | EPIC-004 | Mantener estados KYC simplificados (`3B`): `not_started/pending/verified/rejected` | jaymusicmachine | `README.md` |
| 2026-03-24 | EPIC-004 | Mantener UX de rechazo con motivo y reenvio (`4A`) | jaymusicmachine | `README.md` |
| 2026-03-24 | EPIC-004 | Mantener perfil basico editable (`5A`) y wallet binding unico | jaymusicmachine | `README.md` |
| 2026-03-24 | EPIC-004 | Aceptar veredicto de staff review: estrategia `Buy` obligatoria para KYC | staff-review | `STORY-004-06-staff-review-and-verdict.md` |
| 2026-03-24 | EPIC-004 | Proveedor KYC seleccionado para plan: `Stripe Identity` | jaymusicmachine | `README.md` |
| 2026-03-24 | EPIC-004 | Proveedor AML seleccionado para plan: `Helius` | jaymusicmachine | `README.md` |
| 2026-03-24 | EPIC-004 | Canonicalizacion RFC: un archivo por story (02-05), eliminando duplicados | jaymusicmachine | `README.md` |
| 2026-03-24 | EPIC-004 | Aceptada critica de escalabilidad: denormalizar `compliance_status` para panel admin | jaymusicmachine | `README.md` |
| 2026-03-24 | EPIC-004 | Aceptada critica operacional: acciones `suspend` y `internal notes` obligatorias en panel | jaymusicmachine | `README.md` |

## Risks and Dependencies
- Risks:
  - Caida o latencia alta de proveedores externos (Stripe/Helius).
  - Errores de webhook o reprocesamiento duplicado sin idempotencia.
  - Falsos positivos AML que incrementen friccion operativa.
  - Deriva entre `kyc_status/aml_status` y `compliance_status` si falla el proyector.
- Dependencies:
  - Session/auth SIWS existente (`/api/auth/*`, `getRequestRole`).
  - RBAC admin existente (`lib/rbac.ts`, rutas `/api/admin/*`).
  - Integracion Stripe (Identity + webhooks firmados).
  - Integracion Helius para analisis de wallet.
- Mitigations:
  - Verificacion de firma webhook + tabla de idempotencia.
  - Retry con backoff para jobs AML y webhook.
  - Proyector idempotente + job de reconciliacion para recomputar `compliance_status`.
  - Indices en `user_profiles(compliance_status, compliance_status_updated_at)`.

## Open Questions
- [ ] Definir threshold operativo de `aml_risk_score` para pasar de `pending_review` a `restricted_aml`.
- [ ] Definir politica de re-screening AML para usuarios `fully_verified` (ejemplo: diario vs semanal).
- [ ] Definir SLA operativo para casos `restricted_aml` y `pending_review`.

## Traceability
- Issue(s): `EPIC-004`
- PR(s): `TBD`
- Final commit hash(es): `TBD`
