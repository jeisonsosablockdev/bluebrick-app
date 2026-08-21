---
type: RFC
title: EPIC-015 Squads v4 Treasury Claims & Verifiable Settlement
description: Especificación formal RFC para settlement verificable de claims en Solana Devnet: Squads v4 aprueba y fondea una raíz Merkle; un programa on-chain verifica cada pago y evita doble liquidación.
tags: [rfcs, solana, squads, treasury, claims, governance, zero-trust, notary, merkle-tree]
timestamp: 2026-07-26T14:00:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/README.md
---

# EPIC-015-squads-v4-treasury-claims

## Metadata
- Epic ID: `EPIC-015`
- Title: `Squads v4 Treasury Claims & Verifiable Settlement Governance`
- Status: `in-review` (implementation blocked pending Human Design Approval)
- Owner: `jaymusicmachine`
- Spec owner slice: `feature/jaymusicmachine-BRI-8-squads-v4-treasury-claims`
- Created: `2026-07-25`
- Last Updated: `2026-07-26`

## Scope
- **Problem Statement**: La simulación de firmas e interacciones con el programa Squads v4 no ejecuta transacciones reales en Solana Devnet. Además, requerir firmas manuales para 1,000 sublotes en proyectos masivos resulta inviable operacionalmente. Adicionalmente, almacenar fechas operativas del proyecto (`project_start_at` / `project_end_at`) únicamente en Postgres representa una vulnerabilidad de manipulación de datos si no se vincula a una PDA Notario On-Chain.
- **Business Goal**: Permitir que el comité apruebe una corrida de pagos mediante umbral N-de-M, sin delegar en un agente la facultad de modificar beneficiario, monto o elegibilidad después de la aprobación.
- **Technical Goal**:
  1. Integrar `@sqds/multisig` para que una Vault Transaction aprobada por N-de-M inicialice y fondee un `PayoutRun` on-chain. Squads no transfiere legs individuales de claims.
  2. Desarrollar el programa de settlement `payout_settlement`: `TreasuryPolicy` fija on-chain Vault/mint/attesters; `PayoutRun` guarda la raíz; cada pago verifica proof y leaf canónica, usa escrow PDA y crea un recibo PDA para impedir doble pago.
  3. Exigir dos cálculos independientes sobre un snapshot de claims bloqueado; la propuesta sólo puede construirse si ambos producen exactamente el mismo `merkleRoot`, total, cantidad de ítems y versión de reglas.
  3. Vincular la consola `/admin/distributions` con la vista nativa minimalista de multisig en `/admin/treasury/squads`.
  4. Implementar la gobernanza en 2 pasos para cambio de wallet de pago (`distribution_payout_overrides`) asociando el `case_number`.
  5. Automatizar cronjobs de expiración (48h) y compliance (12 meses), con idempotencia, locking y una máquina de estados explícita; habilitar cancelación únicamente cuando no exista ejecución on-chain irreversible.
  6. Registrar on-chain el `merkleRoot`, `snapshotHash`, `rulesVersion`, total, mint, token program, Vault PDA y fecha de expiración; el programa verifica cada settlement. La root no depende de un campo nativo de Squads: es data de la instrucción del programa de settlement dentro de la Vault Transaction aprobada.
  6.1. El codec V1 queda cerrado con Keccak-256, UUID binario canónico, `snapshotVersion` incluido en `snapshotHash`/attestation, árbol con padding `EMPTY` y vectores golden compartidos entre Rust y TypeScript. V1 acepta únicamente USDC Devnet vía SPL Token clásico; Token-2022 queda fuera.
  6.2. La pausa on-chain es permissionless para el relayer, pero no permissionless para la autoridad: una clave Ed25519 de emergencia se configura y rota mediante propuesta Squads N-de-M; su firma solo puede pausar el run durante un TTL de 300 segundos. Reanudar, cancelar, retirar y cambiar policy siguen exigiendo Vault N-de-M.
  7. Desarrollar el programa Anchor para la **PDA Notario (`ProjectConfigPDA`)** en Solana Devnet y autorizar actualizaciones mediante una CPI desde la Vault PDA de Squads; una PDA no puede ser tratada como firmante externo.
  8. Eliminar cualquier API de mutación directa en Postgres para fechas del proyecto.
- **Out of Scope**: Despliegue en Mainnet-Beta, iframe o embeds de la aplicación web externa squads.so, y cambios en el motor de comisiones versionadas (`SPEC-S04-A`).

## Success Criteria
- [ ] `@sqds/multisig` instalado y wrappers de transacción probados en Solana Devnet.
- [ ] Una propuesta Squads alcanza el umbral configurado y, de forma atómica, inicializa el `PayoutRun`, crea/fondea el escrow por el total exacto y sella la raíz aprobada.
- [ ] Un worker sin autoridad de tesorería sólo puede enviar `settle_claim`; el programa rechaza proof inválido, destinatario/monto/mint distintos, run pausado/expirado y cualquier leaf ya liquidada.
- [ ] Consola `/admin/distributions` integrada redirigiendo a `/admin/treasury/squads`.
- [ ] Tabla `distribution_payout_overrides` en estado `PENDING` previniendo dispersión hasta su aprobación con `case_number`.
- [ ] Endpoints `/api/cron/claims-expiry` y `/api/cron/compliance-ttl` protegidos por `CRON_SECRET`.
- [ ] Endpoint `/api/claims/[claimId]/cancel` funcional para usuarios.
- [ ] Programa Anchor para `ProjectConfigPDA` desplegado en Devnet, validado mediante CPI desde la Vault PDA y leído por `distribution-engine.ts`.
- [ ] APIs de mutación directa de fechas eliminadas y desmanteladas en favor de `POST /api/admin/collections/[id]/date-change-request`.

## Story & Implementation Index
| Story ID | Title | Intention RFC | Implementation Spec | Branch Name | Notes |
| --- | --- | --- | --- | --- | --- |
| STORY-015-01 | Treasury Settlement Authorization & Squads SDK | [`STORY-015-01-delegated-allowance-execution.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-01-delegated-allowance-execution.md) | [`STORY-015-01-...-implementation.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-01-delegated-allowance-execution-implementation.md) | `SPEC/jaymusicmachine-BRI-8-s01-settlement` | `@sqds/multisig`, escrow y proof enforcement |
| STORY-015-02 | Admin Distributions & Treasury Multisig UI | [`STORY-015-02-admin-distributions-treasury-ui.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-02-admin-distributions-treasury-ui.md) | [`STORY-015-02-...-implementation.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-02-admin-distributions-treasury-ui-implementation.md) | `SPEC/jaymusicmachine-BRI-8-s02-treasury-ui` | UI minimalista y Banner Alerta de Auditoría |
| STORY-015-03 | Payout Overrides Governance Flow | [`STORY-015-03-payout-overrides-governance.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-03-payout-overrides-governance.md) | [`STORY-015-03-...-implementation.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-03-payout-overrides-governance-implementation.md) | `SPEC/jaymusicmachine-BRI-8-s03-payout-overrides` | Cola de overrides con `case_number` |
| STORY-015-04 | Cron Monitors & User Claim Cancellation | [`STORY-015-04-cron-monitors-and-claim-cancellation.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-04-cron-monitors-and-claim-cancellation.md) | [`STORY-015-04-...-implementation.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-04-cron-monitors-and-claim-cancellation-implementation.md) | `SPEC/jaymusicmachine-BRI-8-s04-cron-cancellation` | Cronjobs de 48h/12M y cancelación |
| STORY-015-05 | Exception Handling, Veto & Circuit Breaker | [`STORY-015-05-exception-handling-veto-and-circuit-breaker.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-05-exception-handling-veto-and-circuit-breaker.md) | [`STORY-015-05-...-implementation.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-05-exception-handling-veto-and-circuit-breaker-implementation.md) | `SPEC/jaymusicmachine-BRI-8-s05-veto-circuit-breaker` | Veto, freno de emergencia y Merkle Root |
| STORY-015-06 | On-Chain Project Config PDA Program | [`STORY-015-06-onchain-project-config-pda-program.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-06-onchain-project-config-pda-program.md) | [`STORY-015-06-...-implementation.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-06-onchain-project-config-pda-program-implementation.md) | `SPEC/jaymusicmachine-BRI-8-s06-notary-pda-program` | Contrato Anchor PDA Notario |
| STORY-015-07 | On-Chain Project Dates Notary Governance | [`STORY-015-07-onchain-project-dates-notary-governance.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-07-onchain-project-dates-notary-governance.md) | [`STORY-015-07-...-implementation.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-07-onchain-project-dates-notary-governance-implementation.md) | `SPEC/jaymusicmachine-BRI-8-s07-notary-engine-integration` | Lectura RPC directa en motor y bloqueo API |

## Decision Log
| Date | Story | Decision | Owner | Link |
| --- | --- | --- | --- | --- |
| 2026-07-26 | EPIC | **Decisión vinculante:** reemplazar Batch por leg y Merkle auditora por `payout_settlement`. Squads aprueba/fondea la raíz; el programa valida cada leaf contra esa raíz y bloquea el doble pago. Spending Limits permanecen prohibidos. | jaymusicmachine | [Arquitectura y contratos](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/SOLUTION-ARCHITECTURE.md) |
| 2026-07-26 | STORY-015-01 | Sustituir definitivamente “allowance/batch/20” por settlement con root sellada, escrow PDA, proof y receipt. | jaymusicmachine | [STORY-015-01](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-01-delegated-allowance-execution.md) |
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
- [x] ~~Elegir entre `merkleRoot` auditora y settlement program~~: **Resuelto (2026-07-26)** — EPIC-015 incluye `payout_settlement`: la root y la configuración del run se almacenan on-chain y cada payout exige proof válida y recibo de no-reuso. La decisión anterior de root auditora queda invalidada.
- [x] ~~Fijar el modelo de ejecución~~: **Resuelto** — sólo un miembro registrado de Squads con `Execute` puede ejecutar una propuesta aprobada; un relayer puede pagar tasas, nunca sustituir esa autoridad. Spending Limits quedan fuera del flujo de claims.
- [x] ~~Fijar el modelo de pausa de emergencia~~: **Resuelto** — la Vault PDA no tiene clave privada ni firma independiente. Squads configura on-chain `emergency_pause_authority`; cualquier relayer puede retransmitir una firma Ed25519 vigente sin aportar firmas del umbral. La clave no puede reanudar, cancelar, retirar fondos ni cambiar policy.
- [x] Generar y congelar [`tests/fixtures/payout-settlement-v1.json`](../../../tests/fixtures/payout-settlement-v1.json) con preimages, hashes, roots, proofs y PDAs concretos para árboles de 1/2/3 hojas. El fixture es un vector criptográfico determinista y no pretende ser el program ID desplegado.
- [x] ~~Aprobar política de token V1~~: **Resuelto** — EPIC-015 usa únicamente USDC Devnet (`4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU`) con SPL Token clásico (`TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`). SOL, otros SPL mints y Token-2022 quedan fuera de V1.
- [x] ~~Registrar Authority Manifest base~~: **Resuelto** — `create_key=AZGhDBuomd6cRf1LZoUNfk4fWn6HpoZjmp8dzZibZK7c` confirmado por RPC + re-derivación criptográfica (bump=253). `time_lock=0s` confirmado por RPC (u32 LE = 0). Los 4 miembros con permisos `7` (Propose|Vote|Execute) verificados. Manifest completo en [`SOLUTION-ARCHITECTURE.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/SOLUTION-ARCHITECTURE.md).
- [ ] Completar campos **post-deploy** del Authority Manifest: `PAYOUT_SETTLEMENT_PROGRAM_ID` (requiere `anchor deploy`), `TREASURY_POLICY_PDA` (requiere `initialize_policy` on-chain), `PAYOUT_ATTESTER_A_PUBKEY`, `PAYOUT_ATTESTER_B_PUBKEY` y `EMERGENCY_PAUSE_AUTHORITY_PUBKEY` (los tres requieren `solana-keygen`; los dos últimos requieren también propuesta Squads N-de-M). Ver secuencia de desbloqueo en `SOLUTION-ARCHITECTURE.md §Authority Manifest`.
- [ ] Linear no pudo consultarse porque el conector requiere reautenticación; no se debe afirmar sincronización ni aprobación allí.

## Canonical Documentation Reference
- **Squads V4 SDK & Protocol**: [`squads-v4-documentation-reference.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/squads-v4-documentation-reference.md) — Referencia canónica de la documentación oficial de Squads V4, incluyendo Program IDs, Account Structures, Instructions, Code Patterns y URL Index.
- **Arquitectura y contratos transversales**: [`SOLUTION-ARCHITECTURE.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/SOLUTION-ARCHITECTURE.md) — decisiones de diseño obligatorias, límites de confianza y contratos que todos los SPEC deben respetar.

## Traceability
- Issue(s): BRI-8
- PR(s): TBD
- Final commit hash(es): TBD
