---
type: ImplementationSpec
title: STORY-015-05 Exception Handling, Veto & Circuit Breaker Implementation Spec
description: Especificación técnica atómica de implementación para el rechazo global, veto granular, freno de emergencia y verificación criptográfica por Árboles de Merkle (merkleRoot).
tags: [specs, security, merkle-tree, veto, circuit-breaker, tdd]
timestamp: 2026-07-25T19:54:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-05-exception-handling-veto-and-circuit-breaker-implementation.md
---

# STORY-015-05 Exception Handling, Veto & Circuit Breaker Implementation Spec

## Metadata
- Epic: `EPIC-015-squads-v4-treasury-claims`
- Story ID: `STORY-015-05`
- Atomic Branch: `SPEC/jaymusicmachine-BRI-8-s05-veto-circuit-breaker`
- Status: `draft`
- Owner: `jaymusicmachine`

## 1. 4-Layer Architecture Mapping

### Layer 1: Presentation Layer
- Botón **"Rechazar Propuesta Marco"** y botones de **"Veto Individual"** por fila en `squads-multisig-console.tsx`.

### Layer 2: Application/Consumption Layer
- **`app/api/admin/batches/[id]/reject/route.ts`**: Cancela la propuesta global y descongela la corrida.
- **`app/api/admin/batches/[id]/veto/route.ts`**: Veta un ítem específico marcándolo como `VETOED_BY_ADMIN`.
- **`app/api/admin/batches/[id]/circuit-breaker/route.ts`**: Pausa inmediatamente el bot ejecutor.

### Layer 3: Domain/Pipelines/Services Layer
- **`lib/squads/merkle-tree-verifier.ts`**: Genera e inspecciona el árbol de Merkle criptográfico (`merkleRoot`) usando hashing Keccak256 sobre las hojas `(claimId, wallet, amount)`.

### Layer 4: Infrastructure Layer
- Verificación en Runtime contra la `merkleRoot` firmada en la cuenta on-chain de Squads v4.

---

## 2. TDD Strategy (Test-Driven Development)

### Unit & Integration Test File
- `tests/lib/merkle-tree-verifier.test.ts`

### Test Commands
```bash
pnpm test tests/lib/merkle-tree-verifier.test.ts
```

### Assertions & Test Criteria
1. **RED (Fallo Inicial)**:
   - Alterar 1 solo centavo en la wallet de pago hace fallar la verificación de la `merkleRoot` con `ERR_MERKLE_ROOT_MISMATCH`.
2. **GREEN (Paso)**:
   - La reconstrucción del árbol de Merkle sobre 1,000 ítems genera exactamente la raíz de 32 bytes coincidente con la transacción de Solana Devnet.

---

## 3. Definition of Done (DoD)
- [ ] Verificador `merkle-tree-verifier.ts` probado en verde.
- [ ] Endpoints de veto y freno de emergencia probados con permisos de admin.
