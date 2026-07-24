---
type: RFC
title: README
description: README - migrated from knowledge/
tags: [rfcs]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-008-recarga-recurrente-co-littio-sphere-solana/README.md
---

# EPIC-008-recarga-recurrente-co-littio-sphere-solana

## Metadata
- Epic ID: `EPIC-008`
- Title: `Recarga Recurrente CO (Littio + Sphere + Solana)`
- Status: `draft` (`draft | in-review | approved | implemented | rejected`)
- Owner: `jaymusicmachine`
- Created: `2026-04-03`
- Last Updated: `2026-04-03`

## Scope
- Problem statement:
  El flujo actual no ofrece un modulo recurrente de recarga integrado en `Profile > Recargar cuenta` para usuarios CO con UX clara, trazabilidad operativa y controles de compliance.
- Business goal:
  Entregar un flujo entendible y confiable para fondeo recurrente: `COP en Littio -> USD/ACH -> cuenta de recarga dedicada -> USDC en wallet Solana`.
- Technical goal:
  Implementar frontend + backend propios con Sphere Onramper Accounts como motor principal, fallback a Transfers API sin cambiar la experiencia del usuario.
- Out of scope:
  - Expansion geografica fuera de `country=CO` para este epic.
  - Dependencia obligatoria de webhooks para MVP (polling es baseline).
  - Cambios de cluster (se mantiene politica devnet-only del repositorio).

## Success Criteria
- [ ] Existe tab `Profile > Recargar cuenta` visible para usuarios `country=CO`.
- [ ] Cada fase (1-9) esta modelada como RFC Story independiente con decision explicita.
- [ ] Existe una cuenta Onramper dedicada por customer aprobado y sin reutilizacion cruzada.
- [ ] Estado de recarga y trazabilidad operativa son consistentes entre backend y UI.
- [ ] Fallback a Transfers API funciona con la misma UX.
- [ ] Existe un audit trail inmutable y completo de todas las transacciones, estados y decisiones de riesgo/compliance.
- [ ] Existe matriz unificada de errores de usuario (copy + codigo + accion recomendada) para todo el journey de recarga.
- [ ] Las historias con alcance on-chain (`STORY-008-03`, `STORY-008-06`, `STORY-008-09`) incluyen evidencia verificable en `knowledge/devnet-proof.md`.
- [ ] QA integral, observabilidad y rollout por cohortes quedan documentados.

## Architecture Baseline
- Webapp + backend propio.
- Sphere Onramper Accounts como motor recurrente principal.
- Littio como puente operativo Colombia (`COP -> USD/ACH`).
- Wallet Solana del usuario como destino final (`USDC`).
- State machine y modelos orientados a eventos desde MVP (fuente de evento agnóstica: `polling` ahora, `webhook` después) para evitar refactor mayor.
- Alineacion con patrones ya adoptados en `EPIC-003` y `EPIC-006`: objetivo de mediano plazo `webhook-first` con polling como redundancia operativa.

## Story Index
| Story ID | Title | RFC File | Status | PR | Notes |
| --- | --- | --- | --- | --- | --- |
| STORY-008-01 | Product UX blueprint + sidebar logic | `STORY-008-01-product-ux-blueprint-and-sidebar-logic.md` | `draft` | `TBD` | Fase 1 (BRI-28) |
| STORY-008-02 | Customer onboarding y compliance (KYC/KYB + TOS) | `STORY-008-02-customer-onboarding-and-compliance-kyc-kyb-tos.md` | `draft` | `TBD` | Fase 2 (BRI-29), blockedBy STORY-008-01 |
| STORY-008-03 | Wallet Solana destino + validacion ATA USDC | `STORY-008-03-solana-wallet-destination-and-usdc-ata-validation.md` | `draft` | `TBD` | Fase 3 (BRI-30), blockedBy STORY-008-02 |
| STORY-008-04 | Provisioning de Onramper Account dedicada | `STORY-008-04-dedicated-onramper-account-provisioning.md` | `draft` | `TBD` | Fase 4 (BRI-31), blockedBy STORY-008-03 |
| STORY-008-05 | Flujo Colombia (Littio) + tutorial guiado | `STORY-008-05-colombia-flow-littio-and-guided-tutorial.md` | `draft` | `TBD` | Fase 5 (BRI-32), blockedBy STORY-008-04 |
| STORY-008-06 | Orquestacion de estados + polling transfers | `STORY-008-06-state-orchestration-and-transfer-polling.md` | `draft` | `TBD` | Fase 6 (BRI-33), blockedBy STORY-008-05 |
| STORY-008-07 | Motor de topes, riesgo y compliance controls | `STORY-008-07-limits-risk-and-compliance-controls.md` | `draft` | `TBD` | Fase 7 (BRI-34), blockedBy STORY-008-06 |
| STORY-008-08 | Fallback transaccional con Transfers API | `STORY-008-08-transactional-fallback-with-transfers-api.md` | `draft` | `TBD` | Fase 8 (BRI-35), blockedBy STORY-008-07 |
| STORY-008-09 | QA integral + observabilidad + rollout controlado | `STORY-008-09-full-qa-observability-and-controlled-rollout.md` | `draft` | `TBD` | Fase 9 (BRI-36), blockedBy STORY-008-08 |

## Decision Log
| Date | Story | Decision | Owner | Link |
| --- | --- | --- | --- | --- |
| 2026-04-03 | EPIC-008 | Se define arquitectura objetivo: webapp/backend propio + Onramper Accounts + Littio + wallet Solana | jaymusicmachine | `README.md` |
| 2026-04-03 | EPIC-008 | Cada fase BRI-28..36 se modela como una historia RFC independiente | jaymusicmachine | `README.md` |

### Architectural Decisions & Principles
*   **Event-Driven Design for State Orchestration**: While polling is the MVP baseline for `STORY-008-06`, the underlying data models and state machine design must anticipate and facilitate a future transition to webhook-driven updates (e.g., Helius Webhooks) to ensure scalability and real-time reconciliation.
*   **Comprehensive Audit Trail**: All critical state transitions, compliance decisions, risk assessments, and operational actions must be recorded in an immutable and auditable log. This is paramount for financial compliance and dispute resolution.
*   **Unified Error Communication**: User-facing failures must map to deterministic backend error codes and action-oriented copy, preserving consistency across onboarding, fondeo, conversión y entrega.
*   **Chain of Custody by Design**: Every operation must be explainable end-to-end (`who`, `what`, `when`, `source_event`, `result`) across provider events, internal transitions and on-chain reconciliation.

## Existing Infrastructure Reuse (Project)
- Webhook ingestion patterns ya operativas:
  - `app/api/webhooks/helius/mint-orchestrator/route.ts`
  - `app/api/webhooks/helius/purchase/route.ts`
  - `app/api/webhooks/stripe/identity/route.ts`
- Idempotencia y dedupe consolidadas en DB:
  - `db/migrations/011_purchase_webhook_events.sql`
  - `db/migrations/012_profile_kyc_compliance.sql`
  - `db/migrations/017_authority_lifecycle_registry.sql`
- Observabilidad y trazabilidad existentes:
  - `lib/purchase-flow-trace.ts`
  - `knowledge/purchase-tracing.md`
  - `knowledge/devnet-proof.md`

## Sphere Resource Matrix (Story-by-Story)
| Story | Recursos Sphere prioritarios |
| --- | --- |
| `STORY-008-01` | `/platform/onramper-accounts`, `/platform/transfer-lifecycle`, `/platform/supported-rails-currencies` |
| `STORY-008-02` | `/platform/customers`, `/platform/customers/individual/integration-guide/kyc-via-link`, `/platform/customers/business/integration-guide/kyb-via-link`, `/api-reference/customer/get`, `/api-reference/customer/get-id`, `/api-reference/customer/post`, `/api-reference/enhanced-due-diligence/tos` |
| `STORY-008-03` | `/platform/wallets`, `/api-reference/wallet/post`, `/api-reference/wallet/get-id` |
| `STORY-008-04` | `/platform/onramper-accounts`, `/platform/onramper-accounts/guide`, `/api-reference/virtual-account/post`, `/api-reference/virtual-account/get`, `/api-reference/virtual-account/get-id`, `/api-reference/virtual-account/patch`, `/api-reference/virtual-account/deactivate`, `/api-reference/virtual-account/reactivate` |
| `STORY-008-05` | `/platform/onramper-accounts`, `/platform/onramper-accounts/guide`, `/platform/supported-rails-currencies` |
| `STORY-008-06` | `/api-reference/virtual-account/list-transfers`, `/platform/transfer-lifecycle`, `/platform/reference/webhooks`, `/platform/reference/webhooks/events`, `/platform/reference/webhooks/set-up-webhook`, `/api-reference/event/get-id`, `/api-reference/webhook/post` |
| `STORY-008-07` | `/api-reference/transfer-fee/get-id`, `/api-reference/transfer-fee/post`, `/platform/supported-rails-currencies`, `/platform/reference/rate-limits` |
| `STORY-008-08` | `/platform/transfers-api`, `/api-reference/transfer/post`, `/api-reference/transfer/get`, `/api-reference/transfer/get-id`, `/platform/transfer-lifecycle` |
| `STORY-008-09` | `/platform/reference/webhooks/manage-webhook`, `/platform/reference/webhooks/events`, `/api-reference/webhook/get-id`, `/api-reference/event/get-id` |

## Sphere References (Canonical)
- Transfers API para UX propia: `/platform/transfers-api`
- Onramper Accounts overview: `/platform/onramper-accounts`
- Onramper API guide: `/platform/onramper-accounts/guide`
- Supported rails & currencies: `/platform/supported-rails-currencies`
- Transfer lifecycle: `/platform/transfer-lifecycle`
- List virtual account transfers: `/api-reference/virtual-account/list-transfers`
- Customers & onboarding: `/platform/customers`

## Risks and Dependencies
- Risks:
  - Baja claridad UX puede elevar errores de fondeo y tickets manuales.
  - Mala orquestacion de estados puede romper trazabilidad y conciliacion.
  - Controles de riesgo insuficientes pueden exponer compliance.
- Dependencies:
  - Habilitacion de customer verificable en Sphere.
  - Conectividad estable a APIs Sphere/Littio.
  - Validacion Solana/USDC en backend y pruebas E2E del flujo.
- Mitigations:
  - Secuencia bloqueada por historias (`blockedBy`) y criterios de salida por fase.
  - Polling backend como baseline del MVP.
  - Fallback con Transfers API para continuidad operativa.

## Open Questions
- [ ] Alcance exacto del rollout inicial por cohortes (tamanos y criterios de activacion).
- [ ] Politica final de webhooks (hito exacto de migracion a `webhook-first` y rol del polling como fallback).
- [ ] Umbrales iniciales de riesgo/topes para auto-aprobacion vs `under_review`.

## Traceability
- Issue(s): `EPIC-008`, `BRI-28`, `BRI-29`, `BRI-30`, `BRI-31`, `BRI-32`, `BRI-33`, `BRI-34`, `BRI-35`, `BRI-36`
- PR(s): `TBD`
- Final commit hash(es): `TBD`
