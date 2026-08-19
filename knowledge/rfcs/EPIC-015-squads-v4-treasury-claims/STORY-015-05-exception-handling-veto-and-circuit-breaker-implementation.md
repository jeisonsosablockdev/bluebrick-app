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
- **`apps/web/src/features/admin/presentation/treasury-console.tsx`**: Botón **"Rechazar Propuesta Marco"** y botones de **"Veto Individual"** por fila en la consola de tesorería.

### Layer 2: Application/Consumption Layer
- **`apps/web/src/app/api/admin/payout-runs/[id]/reject/route.ts`**: Cancela la propuesta global y descongela la corrida.
- **`apps/web/src/app/api/admin/payout-runs/[id]/veto/route.ts`**: Veta un ítem específico **antes de sellar** el run. Excluye la leaf del snapshot, recalcula root y attestations, e invalida la propuesta previa. No opera post-seal (ver §Supersession Contract).
- **`apps/web/src/app/api/admin/payout-runs/[id]/circuit-breaker/route.ts`**: Activa el freno de emergencia en dos capas: **(1) Local:** detiene el bot ejecutor propio (flag en DB/Redis con compare-and-set). **(2) On-chain (obligatorio si el run está sellado):** inicia la creación de una propuesta Squads para invocar `pause_run`, que es la **única** garantía de que un cranker externo o comprometido no pueda ejecutar `settle_claim`. Sin `pause_run` on-chain, la pausa local no tiene efecto fuera del bot propio.

### Layer 3: Domain/Pipelines/Services Layer
- **`apps/web/src/features/staking-distribution/domain/merkle-tree.ts`**: Genera e inspecciona el árbol de Merkle criptográfico (`merkleRoot`) usando el codec canónico único: `keccak256(domain || runId || claimId || mint || tokenProgram || recipientWallet || recipientAta || amountMinor)` con domain separator `"brids:epic015:payout:v1"` (ver `SOLUTION-ARCHITECTURE.md` §Contrato de snapshot y doble verificación).
- **`apps/web/src/features/staking-distribution/application/payout-settlement-flow.ts`**: Manejo de excepciones, veto granular y control del circuit breaker.

### Layer 4: Infrastructure Layer
- **`programs/payout_settlement`**: Verificación on-chain de Merkle proof, freno de emergencia (`pause_run`) y custodia de escrow. El veto individual opera exclusivamente pre-seal; post-seal se usa `pause_run` + `cancel_run` vía Squads.
- **`apps/web/src/lib/solana-kit/compat/payout-settlement.ts`**: Adaptador de comunicación RPC con el programa.

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
  - Circuit breaker local activado detiene el bot propio; `pause_run` on-chain impide `settle_claim` de cualquier cranker (incluido uno externo o comprometido).
- **DoD de SPEC-01**: Todos los tests compilando y fallando correctamente (RED).

---

### SPEC-02: Verificador Criptográfico de Árboles de Merkle
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s05-02-merkle-verifier`
- **Subagente ejecutor**: `security`
- **Subagentes de apoyo**: `solana` (compatibilidad con instruction data on-chain)
- **Objetivo**: Implementar `merkle-tree.ts` (Layer 3 — Domain) con el codec canónico único de 8 campos `keccak256(domain || runId || claimId || mint || tokenProgram || recipientWallet || recipientAta || amountMinor)`, domain separator `"brids:epic015:payout:v1"`, ordenamiento de hojas por `claimId` binario y generación de la `merkleRoot` de 32 bytes. Debe ser idéntico al encoding on-chain de `settle_claim` (ver `SOLUTION-ARCHITECTURE.md` §Codec Canónico Único).
- **Archivos a Crear**:
  - `apps/web/src/features/staking-distribution/domain/merkle-tree.ts` (Layer 3 — Domain)
- **DoD de SPEC-02**: Verificador generando `merkleRoot` correcta. Tests de Merkle de SPEC-01 en verde.

---

### SPEC-03: Endpoints de Veto, Rechazo y Circuit Breaker
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s05-03-veto-endpoints`
- **Subagente ejecutor**: `api`
- **Subagentes de apoyo**: `security` (permisos admin, compare-and-set), `solana` (verificación estado on-chain de la propuesta)
- **Objetivo**: Implementar los endpoints API REST de rechazo global (`reject`), veto granular pre-seal (`veto`) y freno de emergencia de dos capas (`circuit-breaker`: pausa local del bot + creación de propuesta Squads para `pause_run` on-chain) con validación de permisos y transiciones de estado.
- **Archivos a Crear**:
  - `apps/web/src/app/api/admin/payout-runs/[id]/reject/route.ts` (Layer 2 — Application)
  - `apps/web/src/app/api/admin/payout-runs/[id]/veto/route.ts` (Layer 2 — Application)
  - `apps/web/src/app/api/admin/payout-runs/[id]/circuit-breaker/route.ts` (Layer 2 — Application)
- **DoD de SPEC-03**: Endpoints funcionales con permisos de admin. El endpoint `circuit-breaker` detiene el bot local Y crea una propuesta Squads para `pause_run` cuando el run está sellado. Tests de SPEC-01 de veto y circuit breaker en verde.

---

### SPEC-04: Controles UI de Rechazo, Veto y Emergencia
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s05-04-veto-ui`
- **Subagente ejecutor**: `frontend`
- **Subagentes de apoyo**: `state` (circuit breaker state management), `qa` (verificación visual de estados)
- **Objetivo**: Agregar los botones de "Rechazar Propuesta Marco", "Veto Individual" (pre-seal only) y "Freno de Emergencia" en `treasury-console.tsx` (Layer 1 — Presentation) con indicadores visuales de estado. El botón de emergencia debe mostrar dos estados: **(a)** pausa local activa (bot detenido, indicador ámbar) y **(b)** `pause_run` on-chain confirmado (indicador rojo, settlement bloqueado para cualquier cranker). Si solo hay pausa local sin `pause_run`, el UI debe advertir explícitamente que un cranker externo aún puede liquidar leaves.
- **Archivos a Modificar**:
  - `apps/web/src/features/admin/presentation/treasury-console.tsx` (Layer 1 — Presentation)
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

## 4. Canonical Documentation References (Squads V4 & Helium Circuit Breaker)

> Fuente canónica: [`squads-v4-documentation-reference.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/squads-v4-documentation-reference.md)
> Referencia Open-Source Permisiva: [Helium Circuit Breaker (Apache-2.0)](https://github.com/helium/helium-program-library/tree/master/programs/circuit-breaker)

| SPEC | Documentación Requerida | URL / Sección |
| --- | --- | --- |
| SPEC-01 (TDD) | Account: `Proposal` status enum (`Cancelled`, `Rejected`) | [Protocol Accounts](https://docs.squads.so/main/protocol/accounts) §3.2 |
| SPEC-02 (Merkle) | Account: `VaultTransaction.message` — donde se almacena la `merkleRoot` en `PayoutRun` | [Protocol Accounts](https://docs.squads.so/main/protocol/accounts) §3.3 |
| SPEC-02 (Circuit Breaker) | Patrón de pausa de emergencia y límites de flujo on-chain (Apache-2.0) | [Helium Circuit Breaker Program](https://github.com/helium/helium-program-library/tree/master/programs/circuit-breaker) |
| SPEC-03 (Veto Endpoints) | Instruction: `proposalReject` — modelo de rechazo por umbral | [Protocol Instructions](https://docs.squads.so/main/protocol/instructions) |
| SPEC-03 (Veto Endpoints) | Instruction: `proposalCancel` — cancelación de propuestas | [Protocol Instructions](https://docs.squads.so/main/protocol/instructions) |
| SPEC-03 (Veto Endpoints) | Guide: Vote on Proposal — flow de rechazo | [Vote on Proposal](https://docs.squads.so/main/development/guides/vote-on-proposal) §6.3 |

---

## 5. Blocking Design Contract
- **Decisión cerrada:** `payout_settlement` almacena root y verifica proofs on-chain. La variante de root auditora queda prohibida.
- Las hojas deben tener el codec canónico único de 8 campos definido en `SOLUTION-ARCHITECTURE.md` §Codec Canónico Único.
- Rechazo/cancelación sigue el modelo Squads: alcanzar el umbral requerido.
- El circuito de emergencia es un estado compartido con compare-and-set; no revierte pagos confirmados.

> [!IMPORTANT]
> **Regla de Veto Pre-Seal Only (P0 — Unificada):**
> - **Antes de `seal_run`:** El admin puede vetar filas individuales. Cada veto excluye la leaf del snapshot, recalcula root + attestations e invalida la propuesta Squads previa. Se genera un nuevo ciclo (snapshot → attestation → proposal).
> - **Después de `seal_run`:** El root es inmutable on-chain. **No existe instrucción `revoke_leaf` ni PDA de revocación.** Un `VETOED_BY_ADMIN` en Postgres NO impide que una proof válida liquide la leaf vía `settle_claim`. El mecanismo post-seal es: circuit breaker (detiene al cranker) → `pause_run` (propuesta Squads, detiene settlement on-chain) → `cancel_run` (propuesta Squads) → nuevo run excluyendo las leaves vetadas y las ya liquidadas.
> - **Post-ejecución:** Un pago confirmado con `ClaimReceipt` es irrevocable. Solo aplica flujo de auditoría/disputa.

## 6. Acceptance and Failure Matrix
| Case | Expected result |
| --- | --- |
| Root encoding differs | Fail closed before proposal |
| DB item changes after approval | Message hash/root check detects mismatch |
| Proposal approved and circuit breaker local on | Own bot stops; external cranker still can settle. Requires `pause_run` on-chain for full stop |
| Proposal approved and `pause_run` on-chain confirmed | `settle_claim` reverts for any cranker; confirmed legs immutable |
| Veto after execution | Audit-only/dispute flow; never fake reversal |
| Unauthorized reject/veto | 403 and no on-chain/DB transition |

## 7. Supersession Contract — Circuit Breaker y PayoutRun

> [!WARNING]
> **Defensa en Profundidad de Dos Capas (P0 — Decisión Cerrada):**
>
> | Capa | Mecanismo | Alcance | Garantía |
> |---|---|---|---|
> | **1. Local (Circuit Breaker)** | Flag en DB/Redis con compare-and-set; el endpoint `circuit-breaker/route.ts` lo activa | Solo detiene el bot ejecutor propio | ⚠️ **No es garantía on-chain.** Un cranker comprometido, externo o un script con la proof puede llamar `settle_claim` directamente. |
> | **2. On-chain (`pause_run`)** | Instrucción del programa `payout_settlement`, validada con 3 capas (signer + PDA re-derivation contra Squads v4 + multisig owner check) | Bloquea `settle_claim` para **cualquier** cranker a nivel del runtime de Solana | ✅ **Garantía criptográfica.** El programa revierte la tx si el run está pausado. |
>
> El endpoint `circuit-breaker` DEBE iniciar automáticamente la creación de una propuesta Squads para `pause_run` cuando el run está sellado. La UI debe advertir si solo existe pausa local sin `pause_run` on-chain confirmado.

Para reanudar o cancelar un run pausado, otra propuesta Vault firma `resume_run` o `cancel_run` respectivamente. Un veto previo a `seal_run` invalida la propuesta y recalcula root; después de sellar, la corrección requiere `pause_run` → `cancel_run` → `refund_unclaimed` → nuevo run excluyendo leaves vetadas + ya liquidadas. STORY-015-05 no implementa Merkle ni escrow: esas invariantes pertenecen exclusivamente a STORY-015-01.
