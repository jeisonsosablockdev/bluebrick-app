---
type: ImplementationSpec
title: STORY-015-05 Exception Handling, Veto & Circuit Breaker Implementation Spec
description: Especificación técnica atómica de implementación SPEC-por-SPEC para el rechazo global, veto granular, freno de emergencia y verificación criptográfica por Árboles de Merkle.
tags: [specs, security, merkle-tree, veto, circuit-breaker, tdd, refactor-clean]
timestamp: 2026-07-25T20:33:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-05-exception-handling-veto-and-circuit-breaker-implementation.md
---

# STORY-015-05 Exception Handling, Veto & Circuit Breaker Implementation Spec

## Metadata
- Epic: `EPIC-015-squads-v4-treasury-claims`
- Story ID: `STORY-015-05`
- Parent Branch: `feature/jaymusicmachine-BRI-8-squads-v4-treasury-claims`
- Status: `draft`
- Owner: `jaymusicmachine`

---

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
- Verificación contra el mensaje/instruction data on-chain. Si la raíz debe ser enforcement on-chain, se requiere un programa de settlement propio.

---

## 2. Subagent Orchestration (Gates & Cross-Cutting)

| Gate | Subagente | Momento |
| --- | --- | --- |
| **Gate 1: Pre-Implementation Architecture Review** | `architect` | Antes de SPEC-02 — valida decisión variante A (auditora) vs B (settlement program) |
| **Gate 2: Post-Implementation Diff Audit** | `architect` | Después de SPEC-04 — audita encoding canónico, compare-and-set del circuit breaker |
| **Cross-Cutting: Security Review (CRÍTICA)** | `security` | Revisa encoding Merkle, domain separator, replay resistance, permisos de veto. **Esta es la Story con mayor carga de seguridad.** |
| **Cross-Cutting: Docs Sync** | `docs` | Documenta formato de hojas Merkle y política de circuit breaker |

---

## 3. SPEC Delivery Structure (Atomic Branches)

### SPEC-01: TDD — Tests en Fallo (RED Phase)
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s05-01-tdd`
- **Subagente ejecutor**: `qa`
- **Subagentes de apoyo**: `security` (definir assertions criptográficas y de permisos)
- **Objetivo**: Escribir los tests unitarios e integración en fase RED.
- **Archivos a Crear**:
  - `tests/lib/merkle-tree-verifier.test.ts`
  - `tests/api/veto-circuit-breaker.test.ts`
- **Assertions**:
  - Alterar 1 solo centavo en la wallet de pago hace fallar la verificación con `ERR_MERKLE_ROOT_MISMATCH`.
  - Reconstrucción del árbol de Merkle sobre 1,000 ítems genera la raíz de 32 bytes exacta.
  - Veto sin permisos de admin retorna `403`.
  - Circuit breaker activado impide ejecución de nuevos mensajes.
- **DoD de SPEC-01**: Todos los tests compilando y fallando correctamente (RED).

---

### SPEC-02: Verificador Criptográfico de Árboles de Merkle
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s05-02-merkle-verifier`
- **Subagente ejecutor**: `security`
- **Subagentes de apoyo**: `solana` (compatibilidad con instruction data on-chain)
- **Objetivo**: Implementar `merkle-tree-verifier.ts` con encoding canónico versionado, Keccak256 hashing, domain separator, ordenamiento de hojas y generación de la `merkleRoot` de 32 bytes.
- **Archivos a Crear**:
  - `lib/squads/merkle-tree-verifier.ts`
- **DoD de SPEC-02**: Verificador generando `merkleRoot` correcta. Tests de Merkle de SPEC-01 en verde.

---

### SPEC-03: Endpoints de Veto, Rechazo y Circuit Breaker
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s05-03-veto-endpoints`
- **Subagente ejecutor**: `api`
- **Subagentes de apoyo**: `security` (permisos admin, compare-and-set), `solana` (verificación estado on-chain de la propuesta)
- **Objetivo**: Implementar los endpoints API REST de rechazo global (`reject`), veto granular (`veto`) y freno de emergencia (`circuit-breaker`) con validación de permisos y transiciones de estado.
- **Archivos a Crear**:
  - `app/api/admin/batches/[id]/reject/route.ts`
  - `app/api/admin/batches/[id]/veto/route.ts`
  - `app/api/admin/batches/[id]/circuit-breaker/route.ts`
- **DoD de SPEC-03**: Endpoints funcionales con permisos de admin. Tests de SPEC-01 de veto y circuit breaker en verde.

---

### SPEC-04: Controles UI de Rechazo, Veto y Emergencia
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s05-04-veto-ui`
- **Subagente ejecutor**: `frontend`
- **Subagentes de apoyo**: `state` (circuit breaker state management), `qa` (verificación visual de estados)
- **Objetivo**: Agregar los botones de "Rechazar Propuesta Marco", "Veto Individual" y "Freno de Emergencia" en `squads-multisig-console.tsx` con indicadores visuales de estado.
- **Archivos a Modificar**:
  - `components/admin/squads-multisig-console.tsx`
- **DoD de SPEC-04**: Botones renderizando correctamente con estados visuales adecuados.

---

### SPEC-05: Clean Code Audit & Refactoring
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s05-05-refactor-clean`
- **Subagente ejecutor**: `reviewer`
- **Subagentes de apoyo**: `architect` (Gate 2 — diff audit), `security` (final crypto review), `docs` (documentar formato de hojas Merkle)
- **Objetivo**: Auditoría de código limpio: naming del Merkle verifier, separación de encoding/hashing/verificación, documentación de formato de hojas y domain separator.
- **Verificaciones**:
  - `pnpm validate` con 0 errores.
  - Todos los tests de regresión en verde.
- **DoD de SPEC-05**: Suite completa en verde, `pnpm validate` limpio y cero hallazgos bloqueantes.

---

## 4. Canonical Documentation References (Squads V4)

> Fuente canónica: [`squads-v4-documentation-reference.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/squads-v4-documentation-reference.md)

| SPEC | Documentación Requerida | URL / Sección |
| --- | --- | --- |
| SPEC-01 (TDD) | Account: `Proposal` status enum (`Cancelled`, `Rejected`) | [Protocol Accounts](https://docs.squads.so/main/protocol/accounts) §3.2 |
| SPEC-02 (Merkle) | Account: `VaultTransaction.message` — donde se almacenaría la merkleRoot en instruction data | [Protocol Accounts](https://docs.squads.so/main/protocol/accounts) §3.3 |
| SPEC-03 (Veto Endpoints) | Instruction: `proposalReject` — modelo de rechazo por umbral | [Protocol Instructions](https://docs.squads.so/main/protocol/instructions) |
| SPEC-03 (Veto Endpoints) | Instruction: `proposalCancel` — cancelación de propuestas | [Protocol Instructions](https://docs.squads.so/main/protocol/instructions) |
| SPEC-03 (Veto Endpoints) | Guide: Vote on Proposal — flow de rechazo | [Vote on Proposal](https://docs.squads.so/main/development/guides/vote-on-proposal) §6.3 |

---

## 5. Blocking Design Contract
- Elegir explícitamente una de dos variantes: (A) root auditora off-chain o (B) programa de settlement que almacena root y verifica proofs.
- Las hojas deben tener encoding canónico versionado: `claimId`, address bytes, mint, amount integer en unidades mínimas y domain separator.
- Rechazo/cancelación sigue el modelo Squads: alcanzar el umbral requerido.
- El circuito de emergencia es un estado compartido con compare-and-set; no revierte pagos confirmados.
- Veto antes de aprobación invalida el snapshot y crea nueva versión; veto después de aprobación requiere cancelar/reemplazar.

## 6. Acceptance and Failure Matrix
| Case | Expected result |
| --- | --- |
| Root encoding differs | Fail closed before proposal |
| DB item changes after approval | Message hash/root check detects mismatch |
| Proposal approved and circuit breaker on | No further execution; confirmed legs immutable |
| Veto after execution | Audit-only/dispute flow; never fake reversal |
| Unauthorized reject/veto | 403 and no on-chain/DB transition |
