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
- Status: `in-review` (implementation blocked pending Human Design Approval)
- Owner: `jaymusicmachine`
- Spec owner slice: `feature/jaymusicmachine-BRI-8-squads-v4-treasury-claims`
- Created: `2026-07-25`
- Last Updated: `2026-07-25`

## Scope
- **Problem Statement**: La simulación de firmas e interacciones con el programa Squads v4 no ejecuta transacciones reales en Solana Devnet. Además, requerir firmas manuales para 1,000 sublotes en proyectos masivos resulta inviable operacionalmente. Adicionalmente, almacenar fechas operativas del proyecto (`project_start_at` / `project_end_at`) únicamente en Postgres representa una vulnerabilidad de manipulación de datos si no se vincula a una PDA Notario On-Chain.
- **Business Goal**: Permitir que el comité de administración apruebe una corrida marco mediante el umbral N-de-M configurado y ejecute sus transacciones agrupadas, reduciendo la carga operativa sin degradar el control interno.
- **Technical Goal**:
  1. Integrar el SDK `@sqds/multisig` para crear, votar y ejecutar **Squads Batch** en Solana Devnet: un batch, una propuesta marco y una Vault Transaction por pierna de pago.
  2. Implementar un planificador de transacciones basado en tamaño serializado, cuentas, compute units y simulación; `20` es un objetivo operativo inicial, no un límite del protocolo.
  3. Vincular la consola `/admin/distributions` con la vista nativa minimalista de multisig en `/admin/treasury/squads`.
  4. Implementar la gobernanza en 2 pasos para cambio de wallet de pago (`distribution_payout_overrides`) asociando el `case_number`.
  5. Automatizar cronjobs de expiración (48h) y compliance (12 meses), con idempotencia, locking y una máquina de estados explícita; habilitar cancelación únicamente cuando no exista ejecución on-chain irreversible.
  6. Definir si `merkleRoot` será una huella auditora o si existirá un programa de settlement que la almacene y verifique on-chain. Squads no añade por sí mismo un campo `merkleRoot` a una Vault Transaction.
  7. Desarrollar el programa Anchor para la **PDA Notario (`ProjectConfigPDA`)** en Solana Devnet y autorizar actualizaciones mediante una CPI desde la Vault PDA de Squads; una PDA no puede ser tratada como firmante externo.
  8. Eliminar cualquier API de mutación directa en Postgres para fechas del proyecto.
- **Out of Scope**: Despliegue en Mainnet-Beta, iframe o embeds de la aplicación web externa squads.so, y cambios en el motor de comisiones versionadas (`SPEC-S04-A`).

## Success Criteria
- [ ] `@sqds/multisig` instalado y wrappers de transacción probados en Solana Devnet.
- [ ] Una propuesta de Squads alcanza el umbral configurado (no “1 sola firma” salvo aprobación expresa) y contiene un batch reproducible para `runId`.
- [ ] Worker desatendido ejecutando únicamente transacciones aprobadas, con planificador por límites reales y reconciliación idempotente en DB (`executed`, `partially_failed`, `paused`).
- [ ] Consola `/admin/distributions` integrada redirigiendo a `/admin/treasury/squads`.
- [ ] Tabla `distribution_payout_overrides` en estado `PENDING` previniendo dispersión hasta su aprobación con `case_number`.
- [ ] Endpoints `/api/cron/claims-expiry` y `/api/cron/compliance-ttl` protegidos por `CRON_SECRET`.
- [ ] Endpoint `/api/claims/[claimId]/cancel` funcional para usuarios.
- [ ] Programa Anchor para `ProjectConfigPDA` desplegado en Devnet, validado mediante CPI desde la Vault PDA y leído por `distribution-engine.ts`.
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
| 2026-07-25 | EPIC | Adoptar **Squads Batch + una Vault Transaction por pierna**, no Spending Limits, para los pagos de claims. `merkleRoot` es una huella auditora en esta épica; no autoriza ni liquida pagos. | jaymusicmachine | [Arquitectura y contratos](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/SOLUTION-ARCHITECTURE.md) |
| 2026-07-25 | STORY-015-01 | Sustituir “1 firma y 20 fijos” por batch/proposal/execute de Squads V4, umbral N-de-M y planificación según límites reales. | jaymusicmachine | [STORY-015-01](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-01-delegated-allowance-execution.md) |
| 2026-07-25 | STORY-015-02 | Diseñar vista minimalista en `/admin/treasury/squads` con toggle "Expandir Todos / Ocultar Todos", datos de staking/mint y Alerta de Auditoría de Fechas. | jaymusicmachine | [STORY-015-02](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-02-admin-distributions-treasury-ui.md) |
| 2026-07-25 | STORY-015-03 | Exigir vinculación obligatoria de `case_number` en solicitudes de cambio de wallet de pago. | jaymusicmachine | [STORY-015-03](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-03-payout-overrides-governance.md) |
| 2026-07-25 | STORY-015-04 | Alinear monitores de cronjobs al SOP de EPIC-014 y ofrecer ruta de cancelación para el usuario. | jaymusicmachine | [STORY-015-04](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-04-cron-monitors-and-claim-cancellation.md) |
| 2026-07-25 | STORY-015-05 | Reemplazar checksums planos por Verificación Criptográfica de Árboles de Merkle (`merkleRoot`) en Solana. | jaymusicmachine | [STORY-015-05](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-05-exception-handling-veto-and-circuit-breaker.md) |
| 2026-07-25 | STORY-015-06 | Desarrollar el programa Anchor/Pinocchio `project_config_notary` para la PDA Notario en Solana Devnet. | jaymusicmachine | [STORY-015-06](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-06-onchain-project-config-pda-program.md) |
| 2026-07-25 | STORY-015-07 | Conectar `distribution-engine.ts` para lectura directa de la PDA Notario vía RPC y eliminar cualquier API REST de mutación directa en DB. | jaymusicmachine | [STORY-015-07](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-07-onchain-project-dates-notary-governance.md) |

## Risks and Dependencies
- **Risks**: Fallos de RPC en Solana Devnet durante la transmisión desatendida de sublotes.
- **Dependencies**: Disponibilidad verificada por RPC del programa Squads V4 en Devnet, SDK `@sqds/multisig` compatible con ese despliegue y programa Anchor `project_config_notary`.
- **Mitigations**: Transacciones reintentables por sublote, marcado de ítems fallidos en DB (`partially_failed`) y verificación RPC directa de la PDA Notario On-Chain.

## Open Questions / Blocking Decisions
- [x] ~~Crear una SPEC inicial estrictamente TDD/RED y una SPEC final estrictamente clean/refactor~~: **Resuelto** — Cada una de las 7 stories incluye SPEC-01 TDD/RED y SPEC final `refactor-clean`. Ver sección 2 "SPEC Delivery Structure" en cada Implementation Spec.
- [x] ~~Confirmar el program ID V4 realmente desplegado en Devnet~~: **Resuelto provisionalmente** — `SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf` respondió como cuenta de programa en Devnet mediante consulta RPC de sólo lectura. El primer SPEC debe repetir esa prueba y fallar cerrado si no coincide.
- [x] ~~Elegir entre `merkleRoot` auditora y settlement program~~: **Resuelto** — para EPIC-015 es sólo auditoría determinista; root/proof no se usan como autorización on-chain. Un settlement program requiere una épica distinta.
- [x] ~~Fijar el modelo de ejecución~~: **Resuelto** — sólo un miembro registrado de Squads con `Execute` puede ejecutar una propuesta aprobada; un relayer puede pagar tasas, nunca sustituir esa autoridad. Spending Limits quedan fuera del flujo de claims.
- [ ] Completar el **Authority Manifest** real: multisig PDA, vault index/PDA, threshold, miembros y permisos, timelock, executor operativo, token program y rotación. Sin este documento firmado, ningún SPEC de implementación puede iniciar.
- [ ] Linear no pudo consultarse porque el conector requiere reautenticación; no se debe afirmar sincronización ni aprobación allí.

## Canonical Documentation Reference
- **Squads V4 SDK & Protocol**: [`squads-v4-documentation-reference.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/squads-v4-documentation-reference.md) — Referencia canónica de la documentación oficial de Squads V4, incluyendo Program IDs, Account Structures, Instructions, Code Patterns y URL Index.
- **Arquitectura y contratos transversales**: [`SOLUTION-ARCHITECTURE.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/SOLUTION-ARCHITECTURE.md) — decisiones de diseño obligatorias, límites de confianza y contratos que todos los SPEC deben respetar.

## Traceability
- Issue(s): BRI-8
- PR(s): TBD
- Final commit hash(es): TBD
