---
type: ImplementationSpec
title: STORY-015-01 Delegated Allowance Execution Implementation Spec
description: Especificación técnica atómica de implementación SPEC-por-SPEC para el SDK de Squads v4 y el motor de despacho desatendido en sublotes de 20 transferencias.
tags: [specs, solana, squads, batch, implementation, tdd, refactor-clean]
timestamp: 2026-07-25T20:33:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-01-delegated-allowance-execution-implementation.md
---

# STORY-015-01 Delegated Allowance Execution Implementation Spec

## Metadata
- Epic: `EPIC-015-squads-v4-treasury-claims`
- Story ID: `STORY-015-01`
- Parent Branch: `feature/jaymusicmachine-BRI-8-squads-v4-treasury-claims`
- Status: `draft`
- Owner: `jaymusicmachine`

---

## 1. 4-Layer Architecture Mapping

### Layer 1: Presentation Layer
- No aplica (se integra en la UI en STORY-015-02).

### Layer 2: Application/Consumption Layer
- **`app/api/admin/batches/create-master-proposal/route.ts`**: Endpoint REST para crear la Propuesta Marco en Squads v4 asociando la corrida `runId`.

### Layer 3: Domain/Pipelines/Services Layer
- **`lib/squads/squads-batch.ts`**: Motor desatendido que agrupa las transferencias en sublotes de máximo 20 ítems (`MAX_LEGS_PER_BATCH = 20`) y reconcilia fallos parciales (`partially_failed`).

### Layer 4: Infrastructure Layer
- **`lib/solana-kit/compat/squads.ts`**: Adaptador aislado para `@sqds/multisig`; el program ID y cluster se configuran y se validan por RPC, nunca se asumen desde una constante no verificada.

---

## 2. Subagent Orchestration (Gates & Cross-Cutting)

> **Protocolo Double-Gatekeeper (AGENTS.md)**

| Gate | Subagente | Momento |
| --- | --- | --- |
| **Gate 1: Pre-Implementation Architecture Review** | `architect` | Antes de SPEC-02 — inspecciona y aprueba file paths e imports del Solution Spec |
| **Gate 2: Post-Implementation Diff Audit** | `architect` | Después de SPEC-04 — audita diff, layer isolation, zero forbidden patterns |
| **Cross-Cutting: Security Review** | `security` | Revisa CPI authority, signer validation, replay protection en SPEC-03/04 |
| **Cross-Cutting: Docs Sync** | `docs` | Actualiza knowledge artifacts al cierre de la Story |

---

## 3. SPEC Delivery Structure (Atomic Branches)

### SPEC-01: TDD — Tests en Fallo (RED Phase)
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s01-01-tdd`
- **Subagente ejecutor**: `qa`
- **Subagentes de apoyo**: `solana` (definir assertions de protocolo Squads)
- **Objetivo**: Escribir los tests unitarios e integración en fase RED (fallo controlado) sin implementar lógica de negocio.
- **Archivos a Crear**:
  - `tests/lib/squads-batch.test.ts`
  - `tests/api/create-master-proposal.test.ts`
- **Assertions**:
  - Intentar despachar un lote sin `@sqds/multisig` arroja `ERR_SQUADS_NOT_INITIALIZED`.
  - Un plan que excede el límite serializado, de cuentas o de compute units se rechaza con `ERR_TRANSACTION_BUDGET_EXCEEDED`.
  - `createMasterProposal` retorna el `masterProposalPda` e `transactionIndex` correcto.
  - El worker procesa las transferencias según el planificador y simulación.
- **Test Commands**:
  ```bash
  pnpm test tests/lib/squads-batch.test.ts
  pnpm test tests/api/create-master-proposal.test.ts
  ```
- **DoD de SPEC-01**: Todos los tests compilando y fallando correctamente (RED).

---

### SPEC-02: Instalación SDK & Wrapper de Infraestructura Squads
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s01-02-squads-sdk`
- **Subagente ejecutor**: `solana`
- **Subagentes de apoyo**: `architect` (Gate 1 — validar ubicación en Layer 4)
- **Objetivo**: Instalar `@sqds/multisig` y construir el wrapper de infraestructura en la capa 4.
- **Archivos a Crear/Modificar**:
  - `package.json` (agregar `@sqds/multisig`)
  - `lib/solana-kit/compat/squads.ts` (wrapper con validación RPC del program ID en Devnet)
- **DoD de SPEC-02**: `@sqds/multisig` instalado, wrapper compilando limpiamente, `getAccountInfo(programId)` verificado en Devnet.

---

### SPEC-03: Motor de Despacho Desatendido (squads-batch.ts)
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s01-03-batch-engine`
- **Subagente ejecutor**: `solana`
- **Subagentes de apoyo**: `security` (idempotencia, replay protection), `api` (integración con capa de consumo)
- **Objetivo**: Implementar la lógica de negocio del motor desatendido: agrupación en sublotes, idempotencia `(runId, batchIndex, transactionIndex)`, reconciliación de fallos y reintento con backoff.
- **Archivos a Crear/Modificar**:
  - `lib/squads/squads-batch.ts`
  - `lib/squads/squads-idempotency.ts`
- **DoD de SPEC-03**: Motor desatendido procesa 100 transferencias con simulación previa, registra firma, slot y estado de confirmación por cada transacción. Tests de SPEC-01 en verde para las assertions de batch.

---

### SPEC-04: Endpoint API de Propuesta Marco
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s01-04-api-proposal`
- **Subagente ejecutor**: `api`
- **Subagentes de apoyo**: `solana` (instrucción on-chain), `security` (validación Zod, permisos)
- **Objetivo**: Implementar el endpoint REST `POST /api/admin/batches/create-master-proposal` que crea `batchCreate + batchAddTransaction + proposalCreate` en Squads v4.
- **Archivos a Crear**:
  - `app/api/admin/batches/create-master-proposal/route.ts`
- **DoD de SPEC-04**: Endpoint creando Propuesta Marco en Solana Devnet con validación Zod. Tests de SPEC-01 en verde para las assertions de API.

---

### SPEC-05: Clean Code Audit & Refactoring
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s01-05-refactor-clean`
- **Subagente ejecutor**: `reviewer`
- **Subagentes de apoyo**: `architect` (Gate 2 — diff audit, layer isolation), `docs` (JSDoc, knowledge sync)
- **Objetivo**: Auditoría de código limpio según skill `code-refactoring-refactor-clean`. Verificar naming, eliminación de dead code, cumplimiento del patrón de 4 capas, duplicaciones.
- **Verificaciones**:
  - `pnpm validate` ejecutándose con 0 errores y 0 warnings.
  - No hay `any` implícitos.
  - Naming claro y consistente en todo el módulo `lib/squads/`.
  - Archivos separados por responsabilidad (SRP).
  - Documentación JSDoc actualizada.
- **DoD de SPEC-05**: Suite completa en verde, `pnpm validate` limpio y cero hallazgos bloqueantes.

---

## 4. Canonical Documentation References (Squads V4)

> Fuente canónica: [`squads-v4-documentation-reference.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/squads-v4-documentation-reference.md)

| SPEC | Documentación Requerida | URL / Sección |
| --- | --- | --- |
| SPEC-01 (TDD) | Account Structures: `Batch`, `Proposal`, `VaultTransaction` | [Protocol Accounts](https://docs.squads.so/main/protocol/accounts) §3.2–3.4 |
| SPEC-01 (TDD) | Instructions: `batchCreate`, `batchAddTransaction`, `proposalCreate` | [Protocol Instructions](https://docs.squads.so/main/protocol/instructions) |
| SPEC-02 (SDK) | Instalación `@sqds/multisig`, API Surface, PDA derivation | [SDK v4](https://docs.squads.so/main/development/sdk-v4) §2 |
| SPEC-02 (SDK) | Program ID Devnet: `SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf` | [Program IDs](https://docs.squads.so/main/protocol/program-ids) §1 |
| SPEC-03 (Batch Engine) | Guide: Batch Transactions — `batchCreate` + `batchAddTransaction` flow | [Batch Transactions](https://docs.squads.so/main/development/guides/batch-transactions) §6.5 |
| SPEC-03 (Batch Engine) | Guide: Create Proposal — `vaultTransactionCreate` + `proposalCreate` | [Create Proposal](https://docs.squads.so/main/development/guides/create-proposal) §6.2 |
| SPEC-04 (API) | Guide: Execute Proposal — `vaultTransactionExecute`, `Permission.Execute` | [Execute Proposal](https://docs.squads.so/main/development/guides/execute-proposal) §6.4 |
| SPEC-04 (API) | Guide: Vote — `proposalApprove`, threshold model | [Vote on Proposal](https://docs.squads.so/main/development/guides/vote-on-proposal) §6.3 |
| SPEC-04 (API) | Permissions Model: `Proposer`, `Voter`, `Executor` | [Create Multisig](https://docs.squads.so/main/development/guides/create-multisig) §5 |

---

## 5. Blocking Design Contract
- Squads V4 modela `Multisig`, `VaultTransaction`, `Proposal` y `Batch`; una propuesta no es un "allowance" genérico y no almacena `runId` ni `merkleRoot` salvo que se incluyan en memo/instruction data.
- El bot debe ser un miembro con permiso `Executor` o un relayer autorizado que solo ejecute propuestas `Approved`; la aprobación mantiene el umbral N-de-M y la ejecución debe estar separada del voto.
- El presupuesto se valida antes de crear el mensaje y se reconcilia contra el mensaje on-chain, no contra Postgres. Para tokens se fijan token program, mint, ATA origen/destino y decimales.
- Cada intento necesita idempotency key `(runId, batchIndex, transactionIndex)`, firma, slot, estado de confirmación y error. Nunca se reintenta una transacción confirmada con un mensaje nuevo.
- Devnet debe incluir `getAccountInfo(programId)`, lectura de `Multisig`, simulación, confirmación y prueba de saldos/ATA; sin esa evidencia el story no está completo.

## 6. Acceptance and Failure Matrix
| Condition | Required result |
| --- | --- |
| Program ID no existe en Devnet | Fail closed; no crear propuestas |
| Proposal no `Approved` | No ejecutar; mantener `awaiting_threshold` |
| Worker pierde RPC | Reintentar lectura/confirmación con backoff; no duplicar envío |
| Circuit breaker activo | No crear ni ejecutar nuevos mensajes; conservar confirmados |
| Mensaje excede presupuesto | Rechazar antes de firmar y registrar evento |
