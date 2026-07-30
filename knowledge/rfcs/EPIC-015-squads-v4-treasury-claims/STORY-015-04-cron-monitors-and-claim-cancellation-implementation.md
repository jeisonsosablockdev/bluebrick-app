---
type: ImplementationSpec
title: STORY-015-04 Cron Monitors & Claim Cancellation Implementation Spec
description: Especificación técnica atómica de implementación SPEC-por-SPEC para los endpoints de cronjobs de caducidad y la ruta API de cancelación de reclamaciones.
tags: [specs, cron, claims, cancellation, api, tdd, refactor-clean]
timestamp: 2026-07-25T20:33:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-04-cron-monitors-and-claim-cancellation-implementation.md
---

# STORY-015-04 Cron Monitors & Claim Cancellation Implementation Spec

## Metadata
- Epic: `EPIC-015-squads-v4-treasury-claims`
- Story ID: `STORY-015-04`
- Parent Branch: `feature/jaymusicmachine-BRI-8-squads-v4-treasury-claims`
- Status: `draft`
- Owner: `jaymusicmachine`

---

## 1. 4-Layer Architecture Mapping

### Layer 1: Presentation Layer
- Botón **"Cancelar Reclamación"** en la interfaz de reclamaciones del inversor para registros en `CLAIM_REQUESTED`.

### Layer 2: Application/Consumption Layer
- **`app/api/cron/claims-expiry/route.ts`**: Marca como `EXPIRED` las reclamaciones en `CLAIM_REQUESTED` tras 48 horas.
- **`app/api/cron/compliance-ttl/route.ts`**: Marca como `RETAINED_COMPLIANCE` los fondos sin reclamar tras 12 meses.
- **`app/api/claims/[claimId]/cancel/route.ts`**: Cancelación activa por el usuario.

### Layer 3: Domain/Pipelines/Services Layer
- **`lib/claims/compliance-monitor.ts`**: Queries SQL con ventanas UTC, locking, límites por página y eventos idempotentes.

### Layer 4: Infrastructure Layer
- Autenticación por cabecera `Authorization: Bearer ${CRON_SECRET}`.

---

## 2. Subagent Orchestration (Gates & Cross-Cutting)

| Gate | Subagente | Momento |
| --- | --- | --- |
| **Gate 1: Pre-Implementation Architecture Review** | `architect` | Antes de SPEC-02 — valida separación de cron endpoints vs. domain service |
| **Gate 2: Post-Implementation Diff Audit** | `architect` | Después de SPEC-04 — audita idempotencia y transiciones de estado |
| **Cross-Cutting: Security Review** | `security` | Revisa `CRON_SECRET` timing-safe comparison, ownership validation en cancel |
| **Cross-Cutting: Docs Sync** | `docs` | Actualiza knowledge artifacts al cierre de la Story |

---

## 3. SPEC Delivery Structure (Atomic Branches)

### SPEC-01: TDD — Tests en Fallo (RED Phase)
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s04-01-tdd`
- **Subagente ejecutor**: `qa`
- **Subagentes de apoyo**: `api` (definir assertions de autenticación cron), `security` (assertions de ownership)
- **Objetivo**: Escribir los tests unitarios e integración en fase RED.
- **Archivos a Crear**:
  - `tests/api/cron-and-cancel-endpoints.test.ts`
- **Assertions**:
  - Llamar a los endpoints de cron sin `CRON_SECRET` retorna `401 UNAUTHORIZED`.
  - Cancelar una reclamación ya ejecutada (`EXECUTED`) retorna `400 INVALID_CLAIM_STATE`.
  - `POST /api/cron/claims-expiry` expira correctamente los registros > 48h.
  - `POST /api/claims/[claimId]/cancel` cambia el estado a `CANCELED` y libera el lock.
  - Invocación duplicada de cron es idempotente (no-op).
- **DoD de SPEC-01**: Todos los tests compilando y fallando correctamente (RED).

---

### SPEC-02: Endpoints de Cronjobs (claims-expiry & compliance-ttl)
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s04-02-cron-endpoints`
- **Subagente ejecutor**: `api`
- **Subagentes de apoyo**: `security` (timing-safe `CRON_SECRET` comparison), `db` (advisory locks, windowed queries)
- **Objetivo**: Implementar los endpoints `/api/cron/claims-expiry` y `/api/cron/compliance-ttl` con autenticación `CRON_SECRET` (comparación en tiempo constante), locking reentrante y queries con ventanas UTC.
- **Archivos a Crear**:
  - `app/api/cron/claims-expiry/route.ts`
  - `app/api/cron/compliance-ttl/route.ts`
- **DoD de SPEC-02**: Endpoints funcionales. Tests de SPEC-01 de cron en verde.

---

### SPEC-03: Endpoint de Cancelación de Reclamaciones
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s04-03-cancel-endpoint`
- **Subagente ejecutor**: `api`
- **Subagentes de apoyo**: `security` (ownership validation, row locking), `solana` (verificar que no hay tx on-chain confirmada)
- **Objetivo**: Implementar `POST /api/claims/[claimId]/cancel` con validación de propiedad del usuario, bloqueo de fila, verificación de que no hay transferencia on-chain confirmada y transición `CLAIM_REQUESTED -> CANCELED`.
- **Archivos a Crear**:
  - `app/api/claims/[claimId]/cancel/route.ts`
- **DoD de SPEC-03**: Endpoint funcional. Tests de SPEC-01 de cancelación en verde.

---

### SPEC-04: Botón de Cancelación en UI del Inversor
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s04-04-cancel-ui`
- **Subagente ejecutor**: `frontend`
- **Subagentes de apoyo**: `state` (React Query mutation + invalidation), `qa` (verificación visual)
- **Objetivo**: Agregar el botón "Cancelar Reclamación" en la interfaz del inversor, visible solo para reclamaciones en estado `CLAIM_REQUESTED`.
- **Archivos a Modificar**:
  - Componente de reclamaciones del inversor.
- **DoD de SPEC-04**: Botón renderizando y funcional en la UI.

---

### SPEC-05: Clean Code Audit & Refactoring
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s04-05-refactor-clean`
- **Subagente ejecutor**: `reviewer`
- **Subagentes de apoyo**: `architect` (Gate 2 — diff audit), `security` (final idempotency review), `docs` (knowledge sync)
- **Objetivo**: Auditoría de código limpio: naming, eliminación de dead code, idempotencia de cronjobs, documentación de transiciones de estado.
- **Verificaciones**:
  - `pnpm validate` con 0 errores.
  - Todos los tests de regresión en verde.
- **DoD de SPEC-05**: Suite completa en verde, `pnpm validate` limpio y cero hallazgos bloqueantes.

---

---

## 4. Canonical Documentation References (Squads V4)

> Fuente canónica: [`squads-v4-documentation-reference.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/squads-v4-documentation-reference.md)

| SPEC | Documentación Requerida | URL / Sección |
| --- | --- | --- |
| SPEC-03 (Cancel) | Account: `Proposal` status — verificar si hay ejecución on-chain pendiente | [Protocol Accounts](https://docs.squads.so/main/protocol/accounts) §3.2 |
| SPEC-03 (Cancel) | Instruction: `proposalCancel` — cancelación de propuestas activas | [Protocol Instructions](https://docs.squads.so/main/protocol/instructions) |

> **Nota**: STORY-015-04 tiene menor dependencia del SDK de Squads. Los cronjobs operan sobre la DB. La cancelación verifica estado on-chain antes de permitir la transición.

---

## 5. Blocking Design Contract
- Los cronjobs son reentrantes: cada ejecución usa `runId`, lock/advisory lock, `UPDATE ... WHERE state AND cutoff`, y registra el conteo afectado.
- `CRON_SECRET` se compara en tiempo constante, no se acepta query-string.
- Cancelación requiere autenticación del propietario y bloqueo de fila; no libera una wallet ni revierte una transferencia on-chain confirmada.
- Reintentos de cron no duplican `claim_or_payout_events`; toda transición conserva actor, timestamp y causa.

## 6. Acceptance and Failure Matrix
| Case | Expected result |
| --- | --- |
| Missing/wrong cron secret | 401; no query mutating state |
| Duplicate cron invocation | Second run is no-op/idempotent |
| Claim already paid/on-chain | Cancellation rejected |
| Ownership mismatch | 403; no state change |
| Concurrent cancel/expiry | One guarded transition wins; other reports conflict |

## 7. Supersession Contract — Cancelación con Settlement

El cron y la ruta de cancelación consultan `ClaimReceipt` antes de mutar una claim. Un receipt confirmado vuelve la cancelación irreversiblemente inválida. Si la claim está en un `PayoutRun` sellado pero sin receipt, la ruta sólo crea una solicitud de pausa/cancelación de run; no elimina una item ni altera proof/root. Los cronjobs no pueden liberar fondos: `refund_unclaimed` exige la Vault PDA signer dentro de una propuesta Squads posterior a expiración.
