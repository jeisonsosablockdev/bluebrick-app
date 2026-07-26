---
type: ImplementationSpec
title: STORY-015-01 Delegated Allowance Execution Implementation Spec
description: Especificación técnica atómica de implementación para el SDK de Squads v4 y el motor de despacho desatendido en sublotes de 20 transferencias.
tags: [specs, solana, squads, batch, implementation, tdd]
timestamp: 2026-07-25T19:54:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-01-delegated-allowance-execution-implementation.md
---

# STORY-015-01 Delegated Allowance Execution Implementation Spec

## Metadata
- Epic: `EPIC-015-squads-v4-treasury-claims`
- Story ID: `STORY-015-01`
- Atomic Branch: `SPEC/jaymusicmachine-BRI-8-s01-delegated-allowance`
- Status: `draft`
- Owner: `jaymusicmachine`

## 1. 4-Layer Architecture Mapping

### Layer 1: Presentation Layer
- No aplica (se integra en la UI en STORY-015-02).

### Layer 2: Application/Consumption Layer
- **`app/api/admin/batches/create-master-proposal/route.ts`**: Endpoint REST para crear la Propuesta Marco en Squads v4 asociando la corrida `runId`.

### Layer 3: Domain/Pipelines/Services Layer
- **`lib/squads/squads-batch.ts`**: Motor desatendido que agrupa las transferencias en sublotes de máximo 20 ítems (`MAX_LEGS_PER_BATCH = 20`) y reconcilia fallos parciales (`partially_failed`).

### Layer 4: Infrastructure Layer
- **`lib/solana-kit/compat/squads.ts`**: Wrapper que interactúa con `@sqds/multisig` en Solana Devnet (`SQDS426qXaMuXxWrMRWsEGrmLVLknAdWRHmjF6eg582`).

---

## 2. TDD Strategy (Test-Driven Development)

### Unit & Integration Test File
- `tests/lib/squads-batch.test.ts`

### Test Commands
```bash
pnpm test tests/lib/squads-batch.test.ts
```

### Assertions & Test Criteria
1. **RED (Fallo Inicial)**:
   - Intentar despachar un lote sin `@sqds/multisig` arroja `ERR_SQUADS_NOT_INITIALIZED`.
   - Asignar más de 20 transferencias en una transacción dispara `ERR_EXCEEDS_MAX_LEGS_PER_BATCH`.
2. **GREEN (Paso)**:
   - `createMasterProposal` retorna el `masterProposalPda` e `transactionIndex` correcto.
   - El worker desatendido procesa 100 transferencias en exactamente 5 transacciones de 20 transferencias cada una.

---

## 3. Definition of Done (DoD)
- [ ] `@sqds/multisig` instalado en `package.json`.
- [ ] Wrapper `lib/solana-kit/compat/squads.ts` compilando limpiamente.
- [ ] Test `tests/lib/squads-batch.test.ts` ejecutándose al 100% en verde.
