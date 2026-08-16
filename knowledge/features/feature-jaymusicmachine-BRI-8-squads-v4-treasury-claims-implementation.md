# Solution Spec: squads-v4-treasury-claims Implementation (BRI-8)

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `solana` (Solana Kit, Squads v4 & Anchor Programs) & `frontend` (Admin Treasury Console) & `db` (Governance Schema & Repositories)
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2 — Monorepo FDD & 4-Layer Guardian)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security` (CPI authority, signer boundary, Merkle proof replay review)

## 2. Solution Overview & Monorepo 4-Layer Feature-Driven Design (PR #327 Aligned)

La solución implementa la integración del SDK `@sqds/multisig` en Solana Devnet bajo el **Modelo Payout Settlement On-Chain** (aprobación atómica de setup Squads, creación y fondeo de `PayoutRun`, sellado de Merkle Root, y despacho permissionless vía Merkle Proof contra Escrow PDA), el programa Anchor `project_config_notary` para la **PDA Notario On-Chain**, y la eliminación de mutaciones directas de fechas de proyectos en base de datos.

Toda la implementación se organiza estrictamente en la arquitectura **Monorepo Workspaces & 4-Layer Feature-Driven Design (FDD)** establecida en PR #327 (`BRI-186`):

```
+----------------------------------------------------------------------------------------------------+
| 1. Presentation Layer (apps/web/src/features/admin/presentation, apps/web/src/features/staking-...) |
|    - TreasuryConsole (apps/web/src/features/admin/presentation/treasury-console.tsx)               |
|    - DistributionsConsole (apps/web/src/features/admin/presentation/distributions-console.tsx)     |
|    - ComplianceConsole (apps/web/src/features/admin/presentation/compliance-console.tsx)           |
|    - RentasModule & StakeModule (apps/web/src/features/staking-distribution/presentation/)         |
+----------------------------------------------------------------------------------------------------+
                                                 |
+----------------------------------------------------------------------------------------------------+
| 2. Application / Consumption Layer (apps/web/src/app/api/* & features/*/application)               |
|    - Route Handlers: apps/web/src/app/api/admin/payout-runs/create-proposal/route.ts              |
|    - Route Handlers: apps/web/src/app/api/cron/{claims-expiry,compliance-ttl}/route.ts             |
|    - Route Handlers: apps/web/src/app/api/claims/[claimId]/cancel/route.ts                         |
|    - Application Services: apps/web/src/features/staking-distribution/application/                |
|      * snapshot-verifier.ts (Doble attestation independiente de snapshot y Merkle root)           |
|      * settlement-cranker.ts (Despacho desatendido de proofs y reconciliación de ClaimReceipt)     |
|      * claim-flow.ts (Gobernanza de Payout Overrides con case_number y estado PENDING)             |
|      * compliance-monitor.ts (Cronjobs y ciclo de vida de cotizaciones/compliance)                |
+----------------------------------------------------------------------------------------------------+
                                                 |
+----------------------------------------------------------------------------------------------------+
| 3. Domain / Pipelines / Services Layer (apps/web/src/features/staking-distribution/domain/)        |
|    - payout-leaf.ts: Hasheo canónico Keccak256 de leaves (claimId, wallet, amountMinor, mint)      |
|    - merkle-tree.ts: Construcción determinista y validación de árboles de Merkle                   |
|    - fee-policy.ts: Políticas de retención, tarifas y reglas de cálculo de staking/yield           |
|    - yield-calculation.ts: Cálculo de elegibilidad y snapshot bloqueado                            |
+----------------------------------------------------------------------------------------------------+
                                                 |
+----------------------------------------------------------------------------------------------------+
| 4. Infrastructure Layer (apps/web/src/features/*/infrastructure, lib/solana-kit, packages, programs)|
|    - Repositories: apps/web/src/features/staking-distribution/infrastructure/                      |
|      * distribution-repository.ts & payout-run-repository.ts (vía @/features/shared/db/pool)      |
|    - Solana Kit Adapters: apps/web/src/lib/solana-kit/compat/                                      |
|      * squads.ts (Derivación determinista de PDAs Squads v4 con @solana/kit)                       |
|      * payout-settlement.ts (Interacción tipada con programa de settlement y PDAs)                 |
|    - Solana Client Workspace: packages/solana-client (Codama IDL generated bindings)              |
|    - On-Chain Anchor Programs:                                                                     |
|      * programs/payout_settlement (Contrato Anchor: initialize_run, transfer_escrow, seal, settle) |
|      * programs/project_config_notary (Contrato Anchor PDA Notario para fechas inmutables)         |
+----------------------------------------------------------------------------------------------------+
```

## 3. Atomic Slices & Story Breakdown (STORY-015-01 a STORY-015-07)

- **STORY-015-01 (Treasury Settlement Authorization & Squads SDK Integration)**:
  - Setup atómico Squads: creación de `PayoutRun`, fondeo de escrow PDA y sellado de Merkle root.
  - Adaptadores `@solana/kit` en `apps/web/src/lib/solana-kit/compat/squads.ts` y `@/features/staking-distribution/infrastructure/`.
- **STORY-015-02 (Admin Distributions & Treasury Console UI)**:
  - Consola nativa en `apps/web/src/features/admin/presentation/treasury-console.tsx` y ruta `/admin/treasury/squads`.
  - Controles minimalistas: toggle "Expandir Todos / Ocultar Todos", badges `case_number` y Banner de Auditoría de Fechas.
- **STORY-015-03 (Payout Overrides Governance & Case Number Binding)**:
  - Flujo de cambio de wallet en 2 pasos asociando `case_number` obligatorio en `apps/web/src/features/staking-distribution/application/claim-flow.ts`.
  - Cola de aprobación en `apps/web/src/features/admin/presentation/compliance-console.tsx`.
- **STORY-015-04 (Cron Monitors & User Claim Cancellation)**:
  - Route Handlers en `apps/web/src/app/api/cron/{claims-expiry,compliance-ttl}/route.ts`.
  - Endpoint de cancelación `apps/web/src/app/api/claims/[claimId]/cancel/route.ts` para solicitudes en `CLAIM_REQUESTED`.
- **STORY-015-05 (Exception Handling, Veto & Merkle Circuit Breaker)**:
  - Rechazo de propuesta (`proposalReject`), veto granular on-chain de leaves no liquidadas y freno de emergencia en `programs/payout_settlement`.
- **STORY-015-06 (On-Chain Project Config PDA Program)**:
  - Contrato Anchor `programs/project_config_notary` en Solana Devnet para resguardar fechas y parámetros inmutables del proyecto.
- **STORY-015-07 (On-Chain Project Dates Notary Governance & RPC Direct Reader)**:
  - Conexión de `distribution-engine.ts` para lectura directa RPC de la PDA Notario, eliminación de endpoints de mutación directa en base de datos.

## 4. TDD (Test-Driven Development) Strategy

### Unit/Integration Tests (RED Phase)
- **Suite de Pruebas FDD**:
  - `tests/features/staking-distribution/payout-settlement.test.ts`
  - `tests/features/staking-distribution/snapshot-verifier.test.ts`
  - `tests/features/staking-distribution/payout-override-governance.test.ts`
  - `tests/features/staking-distribution/distribution-engine-pda.test.ts`
  - `tests/api/cron-endpoints.test.ts`
  - `tests/programs/payout-settlement-program.test.ts`
- **Objetivos de Aserción**:
  1. Validar que la generación de la propuesta Squads sella la Merkle root exacta y exige que el monto fondeado al escrow coincida al centavo.
  2. Verificar que `settle_claim` rechaza proofs inválidas, montos alterados o reutilización de `ClaimReceipt`.
  3. Confirmar que `distribution-engine.ts` lee directamente la PDA Notario on-chain e ignora cualquier dato modificado manualmente en base de datos.
  4. Verificar que las mutaciones REST a fechas de proyecto son rechazadas inmediatamente con `400 IMMUTABLE_PROJECT_DATE_FIELD`.

## 5. Local Definition of Done (DoD)
- [ ] 7 historias de EPIC-015 estructuradas con separación estricta de 4 capas FDD.
- [ ] 0 symlinks en root; todos los imports apuntan a `@/features/*`, `@/lib/*` o `packages/*`.
- [ ] 0 `@solana/web3.js` v1 (`new Connection()`, `PublicKey`, etc.); 100% `@solana/kit`.
- [ ] Suite de pruebas de regresión pasa al 100% en verde (`pnpm test`).
- [ ] `pnpm validate` pasa cleanly con los 16 gates en verde.
- [ ] Aprobación de Arquitectura (Gate 1 & Gate 2) y Human Acceptance registradas.

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-jaymusicmachine-BRI-8-squads-v4-treasury-claims.md](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/features/feature-jaymusicmachine-BRI-8-squads-v4-treasury-claims.md)
- **Solution Spec**: [feature-jaymusicmachine-BRI-8-squads-v4-treasury-claims-implementation.md](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/features/feature-jaymusicmachine-BRI-8-squads-v4-treasury-claims-implementation.md)
- **Linear Issue**: [Linear Ticket #BRI-8](https://linear.app/brids-app/issue/BRI-8)
