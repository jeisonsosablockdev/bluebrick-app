---
type: Feature Spec
title: Feature Stake Distribution Traceability EPIC- 014
description: Feature Stake Distribution Traceability EPIC- 014 - migrated from knowledge/
tags: [features]
timestamp: 2026-07-20T04:23:56Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/features/feature-stake-distribution-traceability-epic-014.md
---

# Feature Brief: Stake Distribution Traceability System (EPIC-014)

---

## VERSION ESPAÑOL

### Ownership
- **Issue ID**: `BRI-7` / `EPIC-014`
- **Developer**: Jeison Sosa (`jaysosa`)
- **Team**: Solana Core & Yield Distribution
- **Feature Type**: New Feature / Epic Infrastructure
- **Priority**: High
- **Label**: `feature`, `solana`, `yield`, `governance`

### Objective
Proporcionar un sistema de distribución de rendimientos inmobiliarios verificable en la blockchain de Solana, auditable de extremo a extremo, para tenedores de NFTs BRIDS que congelan/congelan sus activos en MPL Core. El cálculo debe ser matemáticamente determinista usando enteros `BigInt` (método de Hamilton) y la ejecución del tesoro se realiza mediante transacciones en lote de Squads v4.

### Scope
- Captura de eventos de Stake/Unstake en Solana con la extensión `FreezeDelegate` de MPL Core (autoridad Owner).
- Registro de Proveniencia de Mint que vincula cada NFT elegible a su Candy Machine aprobada.
- Reconstrucción de intervalos históricos de congelamiento desde nodos RPC Archival (Helius Archive primario + Alchemy Archive secundario).
- Cálculo determinista con matemática de enteros de 64 bits (`BigInt`) aplicando el algoritmo de resto mayor (Hamilton) con desempate en 3 niveles.
- Control de tesorería multisig mediante Squads v4 en transacciones por lote (`initiate_batch_transfer` máximo 20 instrucciones por propuesta).
- Ciclo de vida de reclamo de usuarios con política de comisiones versionadas y triple-gate de compliance (KYC + AML + Fully Verified).
- TTL de 12 meses para fondos en retención por cumplimiento (`COMPLIANCE_HOLD`) con devolución automática (`clawback`) a la reserva del proyecto.
- Registro de auditoría inmutable (`claim_or_payout_events` y `distribution_audit_events`).

### Non-goals
- Soporte para alcance financiero basado en colecciones (Candy Machine es el único alcance financiero en v1).
- Nodos RPC auto-hospedados (únicamente Helius Archive y Alchemy Archive).
- Pagos desde wallets calientes (hot wallets prohibidas).
- Aritmética de punto flotante para dinero.
- Dilución de inversores tempranos mediante inyección de capital posterior (la dilución es un mecanismo intencional y la autoridad de mint se congela al inicio del proyecto).

### Acceptance Criteria
1. `pnpm validate` ejecuta sin errores de compilación, linters ni contratos de gobernanza de documentación.
2. Todos los eventos de freeze/thaw en Solana se reconcilian desde nodos RPC archival y se registran en `user_profile_stake_events`.
3. El cálculo de distribución es idéntico a la suma del pool (`Σ grossAmountMinor == distributionPoolAmountMinor`) utilizando matemática entera `BigInt`.
4. Si la participación congelada total es cero (`pool_time_weight == 0`), el run pasa a `BLOCKED` con la razón `no_eligible_participation`.
5. Si ambos proveedores de RPC archival fallan en la cobertura de slots, el run pasa a `BLOCKED` con la razón `dual_provider_gap`.
6. Las propuestas de Squads v4 se fragmentan en lotes de máximo 20 receptores para no exceder los límites de CUs de Solana.
7. Los usuarios bloqueados por compliance (`restricted_aml` o `suspended`) no pueden iniciar reclamos y sus fondos expiran a los 12 meses hacia `TreasuryClawbackReserve`.

### Risks
- Brechas de slot simultáneas en Helius Archive y Alchemy Archive -> Mitigado con bloqueo automático `dual_provider_gap` y revisión manual del comité.
- Transacciones de reclamo masivo excediendo CUs -> Mitigado con fragmentación en lotes de 20 instrucciones por propuesta Squads.
- Override malicioso de wallet de reclamo -> Mitigado requiriendo firma criptográfica SIWS y aprobación del comité.

### Open Questions
- [x] Selección de proveedor de nodos archival -> Resuelto: Helius Archive primario + Alchemy Archive secundario (sin nodos self-hosted).
- [x] TTL de retención de fondos por compliance -> Resuelto: 12 meses con retorno automático a la reserva de tesorería del proyecto.
- [x] Manejo de residuo entero en divisiones -> Resuelto: Algoritmo de Hamilton (resto mayor) en 2 pases con desempate FIFO y dirección de wallet.

---

## ENGLISH VERSION

### Ownership
- **Issue ID**: `BRI-7` / `EPIC-014`
- **Developer**: Jeison Sosa (`jaysosa`)
- **Team**: Solana Core & Yield Distribution
- **Feature Type**: New Feature / Epic Infrastructure
- **Priority**: High
- **Label**: `feature`, `solana`, `yield`, `governance`

### Objective
Provide a blockchain-verified, end-to-end auditable real estate yield distribution system on Solana for BRIDS NFT holders who stake/freeze their MPL Core assets. Calculation is mathematically deterministic using `BigInt` integer arithmetic (Hamilton largest-remainder method) and treasury execution uses Squads v4 batch transfer proposals.

### Scope
- Stake/Unstake event capture on Solana via MPL Core `FreezeDelegate` plugin (Owner authority).
- Mint Provenance Registry mapping each eligible NFT to exactly one approved Candy Machine.
- Historical freeze interval reconstruction from Archival RPC nodes (Helius Archive primary + Alchemy Archive secondary).
- Deterministic 64-bit integer arithmetic (`BigInt`) using Largest-Remainder (Hamilton) allocation with 3-tier tie-breaking.
- Multisig treasury control via Squads v4 batch transfers (`initiate_batch_transfer` capped at 20 transfer instructions per proposal).
- User claim lifecycle with versioned fee policy and triple-gate compliance verification (KYC + AML + Fully Verified).
- 12-month TTL for funds locked under compliance hold (`COMPLIANCE_HOLD`) with automatic clawback to per-project reserve.
- Immutable audit logging (`claim_or_payout_events` and `distribution_audit_events`).

### Non-goals
- Collection-level financial scope (Candy Machine is the sole financial scope for v1).
- Self-hosted RPC nodes (only Helius Archive and Alchemy Archive permitted).
- Hot wallet payouts (forbidden).
- Floating-point money math.
- Late capital injections (early investor dilution is an intentional reward mechanism; mint authority is frozen at project start).

### Acceptance Criteria
1. `pnpm validate` passes cleanly with zero compilation, linter, or doc-governance errors.
2. All Solana freeze/thaw events reconcile via Archival RPC endpoints into `user_profile_stake_events`.
3. Distribution gross allocation sum matches pool amount exactly (`Σ grossAmountMinor == distributionPoolAmountMinor`) via `BigInt` math.
4. Zero-participation pool (`pool_time_weight == 0`) transitions run to `BLOCKED` with reason `no_eligible_participation`.
5. Dual provider slot gap on archival nodes transitions run to `BLOCKED` with reason `dual_provider_gap`.
6. Squads v4 proposals are chunked to maximum 20 legs per proposal to avoid Solana CU limits.
7. Compliance-blocked wallets (`restricted_aml` or `suspended`) cannot claim; funds expire after 12 months to `TreasuryClawbackReserve`.

### Risks
- Simultaneous slot gaps on Helius + Alchemy -> Mitigated by automatic `dual_provider_gap` run blocking and committee review.
- Compute unit exhaustion on large distribution batches -> Mitigated by capping batch proposals at 20 legs.
- Malicious payout wallet override -> Mitigated by requiring SIWS cryptographic proof and committee approval.

### Open Questions
- [x] Archival node provider selection -> Resolved: Helius Archive primary + Alchemy Archive secondary (no self-hosted nodes).
- [x] Compliance hold TTL -> Resolved: 12 months max with auto-clawback to project treasury reserve.
- [x] Rounding remainder handling -> Resolved: 2-pass Hamilton largest-remainder algorithm with deterministic tie-breaking.
