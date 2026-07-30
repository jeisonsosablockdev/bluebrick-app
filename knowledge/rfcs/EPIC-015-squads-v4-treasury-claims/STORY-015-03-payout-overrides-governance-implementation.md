---
type: ImplementationSpec
title: STORY-015-03 Payout Overrides Governance Flow Implementation Spec
description: Especificación técnica atómica de implementación SPEC-por-SPEC para la cola de aprobación en 2 pasos de cambio de wallet de pago con vinculación obligatoria de case_number.
tags: [specs, compliance, payout-overrides, governance, db, tdd, refactor-clean]
timestamp: 2026-07-25T20:33:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-03-payout-overrides-governance-implementation.md
---

# STORY-015-03 Payout Overrides Governance Flow Implementation Spec

## Metadata
- Epic: `EPIC-015-squads-v4-treasury-claims`
- Story ID: `STORY-015-03`
- Parent Branch: `feature/jaymusicmachine-BRI-8-squads-v4-treasury-claims`
- Status: `draft`
- Owner: `jaymusicmachine`

---

## 1. 4-Layer Architecture Mapping

### Layer 1: Presentation Layer
- **`components/admin/compliance-console.tsx`**: Modal/formulario **"Resolución de Caso & Reasignación de Wallet"** con inputs `case_number` y `requested_wallet`.

### Layer 2: Application/Consumption Layer
- **`app/api/admin/compliance/overrides/route.ts`**: Endpoints GET (listar pendientes) y POST (crear solicitud `PENDING`).
- **`app/api/admin/compliance/overrides/[id]/approve/route.ts`**: Endpoint POST para aprobación multisig/admin.

### Layer 3: Domain/Pipelines/Services Layer
- **`lib/claims/payout-override-service.ts`**: Lógica de negocio que impide usar la nueva wallet hasta que el estado sea `APPROVED`.

### Layer 4: Infrastructure Layer
- **DB Migration (`scripts/db/migrations/*`)**: Tabla con `case_number` normalizado, wallet solicitada, wallet efectiva, actor, motivo, estado, versión y trazabilidad on-chain; constraint único e índice de estado.

---

## 2. Subagent Orchestration (Gates & Cross-Cutting)

| Gate | Subagente | Momento |
| --- | --- | --- |
| **Gate 1: Pre-Implementation Architecture Review** | `architect` | Antes de SPEC-02 — valida separación servicio vs. repositorio y DB schema |
| **Gate 2: Post-Implementation Diff Audit** | `architect` | Después de SPEC-04 — audita transiciones de estado, optimistic locking correctness |
| **Cross-Cutting: Security Review** | `security` | Valida que override no permite reescritura de beneficiario post-ejecución |
| **Cross-Cutting: Docs Sync** | `docs` | Actualiza knowledge artifacts al cierre de la Story |

---

## 3. SPEC Delivery Structure (Atomic Branches)

### SPEC-01: TDD — Tests en Fallo (RED Phase)
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s03-01-tdd`
- **Subagente ejecutor**: `qa`
- **Subagentes de apoyo**: `security` (definir assertions de brechas de override), `db` (assertions de constraint)
- **Objetivo**: Escribir los tests unitarios e integración en fase RED.
- **Archivos a Crear**:
  - `tests/lib/payout-override-governance.test.ts`
  - `tests/api/compliance-overrides.test.ts`
- **Assertions**:
  - Registrar un override sin `case_number` arroja `ERR_CASE_NUMBER_REQUIRED`.
  - Transferir dinero a una wallet con override `PENDING` dispara `ERR_OVERRIDE_NOT_APPROVED`.
  - Aprobaciones concurrentes: una versión gana, la otra recibe conflicto.
  - Wallet inválida retorna `400`.
- **DoD de SPEC-01**: Todos los tests compilando y fallando correctamente (RED).

---

### SPEC-02: Migración SQL y Esquema de DB
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s03-02-db-migration`
- **Subagente ejecutor**: `db`
- **Subagentes de apoyo**: `architect` (Gate 1 — schema review), `security` (constraint de seguridad)
- **Objetivo**: Crear la migración SQL con la columna `case_number VARCHAR(64)`, constraint único, índice de estado y versionado (`optimistic locking`).
- **Archivos a Crear**:
  - `scripts/db/migrations/XXXX_add_payout_overrides_case_number.sql`
- **DoD de SPEC-02**: Migración ejecutada sin errores, `validate:db` pasando.

---

### SPEC-03: Servicio de Dominio (payout-override-service.ts)
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s03-03-service`
- **Subagente ejecutor**: `api`
- **Subagentes de apoyo**: `security` (validar transiciones y optimistic locking), `db` (queries y locking)
- **Objetivo**: Implementar la lógica de negocio del servicio de overrides: validación de address Solana, normalización de `case_number`, transiciones `PENDING -> APPROVED | REJECTED | EXPIRED`, optimistic locking/version e idempotencia.
- **Archivos a Crear**:
  - `lib/claims/payout-override-service.ts`
- **DoD de SPEC-03**: Servicio de dominio compilando. Tests de SPEC-01 para las transiciones de estado en verde.

---

### SPEC-04: Endpoints API REST y UI de Compliance
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s03-04-api-ui`
- **Subagente ejecutor**: `api` (endpoints) + `frontend` (UI modal)
- **Subagentes de apoyo**: `security` (validación Zod, permisos), `state` (React Query invalidation)
- **Objetivo**: Implementar los endpoints API REST con esquemas Zod y actualizar `compliance-console.tsx` con el formulario de resolución de caso.
- **Archivos a Crear/Modificar**:
  - `app/api/admin/compliance/overrides/route.ts`
  - `app/api/admin/compliance/overrides/[id]/approve/route.ts`
  - `components/admin/compliance-console.tsx`
- **DoD de SPEC-04**: Endpoints funcionando con validación Zod. Tests de SPEC-01 de la API en verde.

---

### SPEC-05: Clean Code Audit & Refactoring
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s03-05-refactor-clean`
- **Subagente ejecutor**: `reviewer`
- **Subagentes de apoyo**: `architect` (Gate 2 — diff audit), `security` (final security review), `docs` (knowledge sync)
- **Objetivo**: Auditoría de código limpio: naming, eliminación de dead code, separación de responsabilidades en servicio vs. repositorio, documentación JSDoc.
- **Verificaciones**:
  - `pnpm validate` con 0 errores.
  - Todos los tests de regresión en verde.
- **DoD de SPEC-05**: Suite completa en verde, `pnpm validate` limpio y cero hallazgos bloqueantes.

---

## 4. Canonical Documentation References (Squads V4)

> Fuente canónica: [`squads-v4-documentation-reference.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/squads-v4-documentation-reference.md)

| SPEC | Documentación Requerida | URL / Sección |
| --- | --- | --- |
| SPEC-03 (Service) | Account: `Proposal` status transitions (`Active` → `Approved`) | [Protocol Accounts](https://docs.squads.so/main/protocol/accounts) §3.2 |
| SPEC-04 (API & UI) | Guide: Execute Proposal — prueba on-chain de aprobación | [Execute Proposal](https://docs.squads.so/main/development/guides/execute-proposal) §6.4 |
| SPEC-04 (API & UI) | Permissions Model: quién puede aprobar overrides | [Create Multisig](https://docs.squads.so/main/development/guides/create-multisig) §5 |

> **Nota**: STORY-015-03 tiene menor dependencia directa del SDK de Squads. La gobernanza de overrides se vincula con Squads a través de la prueba de ejecución on-chain del override aprobado.

---

## 5. Blocking Design Contract
- Estados válidos: `PENDING -> APPROVED | REJECTED | EXPIRED`; `APPROVED` solo después de una transacción Squads ejecutada que autorice la wallet.
- La aprobación debe ser idempotente y usar optimistic locking/version.
- `requested_wallet` se valida como address Solana, `case_number` se normaliza.
- El payout engine resuelve la wallet efectiva dentro de la misma transacción DB que toma el lock y verifica el estado.
- Registrar actor, firma, proposal/transaction index, slot y evento de auditoría.

## 6. Acceptance and Failure Matrix
| Case | Expected result |
| --- | --- |
| Missing/duplicate case number | 400; no row mutation |
| Invalid wallet | 400; no row mutation |
| Concurrent approval | One version wins; other gets conflict |
| Approved without execution proof | Remains pending |
| Payout already executed | Override rejected; never rewrites beneficiary |

## 7. Supersession Contract — Override y Snapshot

Un override aprobado sólo puede ser seleccionado al construir un snapshot aún no bloqueado. `effective_wallet` queda comprometida en la leaf y en sus dos attestationes; después de `PayoutRun.seal_run` no se cambia, aunque el receipt todavía no exista. Para un run sellado se debe pausar/cancelar mediante una propuesta Squads y crear un run de reemplazo para las claims no liquidadas. Ningún endpoint de override puede escribir `payout_run_items`, proof, leaf, root o receipt.
