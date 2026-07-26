---
type: RFC
title: EPIC-015 Squads v4 Treasury Claims & Delegated Allowance Execution
description: Especificación formal RFC para la integración de Squads v4 en Solana Devnet bajo el modelo Delegated Allowance, PDA Notario On-Chain y gobernanza de tesorería Cero-Confianza.
tags: [rfcs, solana, squads, treasury, claims, governance, zero-trust, notary, merkle-tree]
timestamp: 2026-07-25T19:49:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/README.md
---

# EPIC-015-squads-v4-treasury-claims

## Metadata
- Epic ID: `EPIC-015`
- Title: `Squads v4 Treasury Claims & Delegated Allowance Governance`
- Status: `in-review`
- Owner: `jaymusicmachine`
- Spec owner slice: `feature/jaymusicmachine-BRI-8-squads-v4-treasury-claims`
- Created: `2026-07-25`
- Last Updated: `2026-07-25`

## Scope
- **Problem Statement**: La simulación de firmas e interacciones con el programa Squads v4 no ejecuta transacciones reales en Solana Devnet. Además, requerir firmas manuales para 1,000 sublotes en proyectos masivos resulta inviable operacionalmente. Adicionalmente, almacenar fechas operativas del proyecto (`project_start_at` / `project_end_at`) únicamente en Postgres representa una vulnerabilidad de manipulación de datos si no se vincula a una PDA Notario On-Chain.
- **Business Goal**: Permitir que el comité de administración apruebe las dispersiones masivas de tesorería con **1 sola firma por corrida marco**, reduciendo la carga operativa sin comprometer el control interno ni la seguridad de los inversores.
- **Technical Goal**:
  1. Integrar el SDK `@sqds/multisig` para crear y ejecutar Propuestas Marco en Solana Devnet.
  2. Implementar el motor de despacho desatendido en sublotes de 20 transferencias (`MAX_LEGS_PER_BATCH = 20`) en `lib/squads/squads-batch.ts`.
  3. Vincular la consola `/admin/distributions` con la vista nativa minimalista de multisig en `/admin/treasury/squads`.
  4. Implementar la gobernanza en 2 pasos para cambio de wallet de pago (`distribution_payout_overrides`) asociando el `case_number`.
  5. Automatizar cronjobs de expiración (48h) y compliance (12 meses), y habilitar la cancelación de reclamaciones (`CANCELED`).
  6. Implementar la verificación criptográfica nativa de **Árboles de Merkle (`merkleRoot`)** para asegurar la inmutabilidad de los ítems de dispersión.
  7. Desarrollar el programa Anchor/Pinocchio para la **PDA Notario (`ProjectConfigPDA`)** en Solana Devnet y conectar la lectura directa en `distribution-engine.ts`.
  8. Eliminar cualquier API de mutación directa en Postgres para fechas del proyecto.
- **Out of Scope**: Despliegue en Mainnet-Beta, iframe o embeds de la aplicación web externa squads.so, y cambios en el motor de comisiones versionadas (`SPEC-S04-A`).

## Success Criteria
- [ ] `@sqds/multisig` instalado y wrappers de transacción probados en Solana Devnet.
- [ ] Propuesta Marco en Squads v4 creada y aprobada con 1 sola firma multisig por corrida `runId`.
- [ ] Worker desatendido despachando sublotes de 20 transferencias y reconciliando el estado en DB (`executed`, `partially_failed`).
- [ ] Consola `/admin/distributions` integrada redirigiendo a `/admin/treasury/squads`.
- [ ] Tabla `distribution_payout_overrides` en estado `PENDING` previniendo dispersión hasta su aprobación con `case_number`.
- [ ] Endpoints `/api/cron/claims-expiry` y `/api/cron/compliance-ttl` protegidos por `CRON_SECRET`.
- [ ] Endpoint `/api/claims/[claimId]/cancel` funcional para usuarios.
- [ ] Programa Anchor/Pinocchio para `ProjectConfigPDA` desplegado en Devnet y validado con `distribution-engine.ts`.
- [ ] APIs de mutación directa de fechas eliminadas y desmanteladas en favor de `POST /api/admin/collections/[id]/date-change-request`.

## Story & Implementation Index
| Story ID | Title | Intention RFC | Implementation Spec | Branch Name | Notes |
| --- | --- | --- | --- | --- | --- |
| STORY-015-01 | Delegated Allowance Execution & Squads SDK | [`STORY-015-01-delegated-allowance-execution.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-01-delegated-allowance-execution.md) | [`STORY-015-01-...-implementation.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-01-delegated-allowance-execution-implementation.md) | `SPEC/jaymusicmachine-BRI-8-s01-delegated-allowance` | `@sqds/multisig` y worker desatendido |
| STORY-015-02 | Admin Distributions & Treasury Multisig UI | [`STORY-015-02-admin-distributions-treasury-ui.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-02-admin-distributions-treasury-ui.md) | [`STORY-015-02-...-implementation.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-02-admin-distributions-treasury-ui-implementation.md) | `SPEC/jaymusicmachine-BRI-8-s02-treasury-ui` | UI minimalista y Banner Alerta de Auditoría |
| STORY-015-03 | Payout Overrides Governance Flow | [`STORY-015-03-payout-overrides-governance.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-03-payout-overrides-governance.md) | [`STORY-015-03-...-implementation.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-03-payout-overrides-governance-implementation.md) | `SPEC/jaymusicmachine-BRI-8-s03-payout-overrides` | Cola de overrides con `case_number` |
| STORY-015-04 | Cron Monitors & User Claim Cancellation | [`STORY-015-04-cron-monitors-and-claim-cancellation.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-04-cron-monitors-and-claim-cancellation.md) | [`STORY-015-04-...-implementation.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-04-cron-monitors-and-claim-cancellation-implementation.md) | `SPEC/jaymusicmachine-BRI-8-s04-cron-cancellation` | Cronjobs de 48h/12M y cancelación |
| STORY-015-05 | Exception Handling, Veto & Circuit Breaker | [`STORY-015-05-exception-handling-veto-and-circuit-breaker.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-05-exception-handling-veto-and-circuit-breaker.md) | [`STORY-015-05-...-implementation.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-05-exception-handling-veto-and-circuit-breaker-implementation.md) | `SPEC/jaymusicmachine-BRI-8-s05-veto-circuit-breaker` | Veto, freno de emergencia y Merkle Root |
| STORY-015-06 | On-Chain Project Config PDA Program | [`STORY-015-06-onchain-project-config-pda-program.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-06-onchain-project-config-pda-program.md) | [`STORY-015-06-...-implementation.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-06-onchain-project-config-pda-program-implementation.md) | `SPEC/jaymusicmachine-BRI-8-s06-notary-pda-program` | Contrato Anchor PDA Notario |
| STORY-015-07 | On-Chain Project Dates Notary Governance | [`STORY-015-07-onchain-project-dates-notary-governance.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-07-onchain-project-dates-notary-governance.md) | [`STORY-015-07-...-implementation.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-07-onchain-project-dates-notary-governance-implementation.md) | `SPEC/jaymusicmachine-BRI-8-s07-notary-engine-integration` | Lectura RPC directa en motor y bloqueo API |

## Decision Log
| Date | Story | Decision | Owner | Link |
| --- | --- | --- | --- | --- |
| 2026-07-25 | STORY-015-01 | Adoptar Modelo Delegated Squads Allowance (1 sola firma por corrida `runId` + despacho desatendido en sublotes de 20). | jaymusicmachine | [STORY-015-01](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-01-delegated-allowance-execution.md) |
| 2026-07-25 | STORY-015-02 | Diseñar vista minimalista en `/admin/treasury/squads` con toggle "Expandir Todos / Ocultar Todos", datos de staking/mint y Alerta de Auditoría de Fechas. | jaymusicmachine | [STORY-015-02](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-02-admin-distributions-treasury-ui.md) |
| 2026-07-25 | STORY-015-03 | Exigir vinculación obligatoria de `case_number` en solicitudes de cambio de wallet de pago. | jaymusicmachine | [STORY-015-03](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-03-payout-overrides-governance.md) |
| 2026-07-25 | STORY-015-04 | Alinear monitores de cronjobs al SOP de EPIC-014 y ofrecer ruta de cancelación para el usuario. | jaymusicmachine | [STORY-015-04](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-04-cron-monitors-and-claim-cancellation.md) |
| 2026-07-25 | STORY-015-05 | Reemplazar checksums planos por Verificación Criptográfica de Árboles de Merkle (`merkleRoot`) en Solana. | jaymusicmachine | [STORY-015-05](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-05-exception-handling-veto-and-circuit-breaker.md) |
| 2026-07-25 | STORY-015-06 | Desarrollar el programa Anchor/Pinocchio `project_config_notary` para la PDA Notario en Solana Devnet. | jaymusicmachine | [STORY-015-06](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-06-onchain-project-config-pda-program.md) |
| 2026-07-25 | STORY-015-07 | Conectar `distribution-engine.ts` para lectura directa de la PDA Notario vía RPC y eliminar cualquier API REST de mutación directa en DB. | jaymusicmachine | [STORY-015-07](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-07-onchain-project-dates-notary-governance.md) |

## Risks and Dependencies
- **Risks**: Fallos de RPC en Solana Devnet durante la transmisión desatendida de sublotes.
- **Dependencies**: Disponibilidad del programa Squads v4 en Devnet (`SQDS426qXaMuXxWrMRWsEGrmLVLknAdWRHmjF6eg582`), SDK `@sqds/multisig` y programa Anchor `project_config_notary`.
- **Mitigations**: Transacciones reintentables por sublote, marcado de ítems fallidos en DB (`partially_failed`) y verificación RPC directa de la PDA Notario On-Chain.

## Open Questions
- [ ] Ninguna. Arquitectura 100% alineada, gobernada y aprobada.

## Traceability
- Issue(s): BRI-8
- PR(s): TBD
- Final commit hash(es): TBD
