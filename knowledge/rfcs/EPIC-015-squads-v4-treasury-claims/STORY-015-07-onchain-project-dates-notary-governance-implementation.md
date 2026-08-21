---
type: ImplementationSpec
title: STORY-015-07 On-Chain Project Dates Notary Governance Implementation Spec
description: Especificación técnica atómica de implementación SPEC-por-SPEC para la lectura directa del PDA Notario en el motor de cálculo, prohibición de campos de fecha en API HTTP, flujo UI de notificaciones y sincronización de caché.
tags: [specs, distribution-engine, notary, api-security, read-model, tdd, refactor-clean]
timestamp: 2026-07-25T20:33:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-07-onchain-project-dates-notary-governance-implementation.md
---

# STORY-015-07 On-Chain Project Dates Notary Governance Implementation Spec

## Metadata
- Epic: `EPIC-015-squads-v4-treasury-claims`
- Story ID: `STORY-015-07`
- Parent Branch: `feature/jaymusicmachine-BRI-8-squads-v4-treasury-claims`
- Status: `draft`
- Owner: `jaymusicmachine`

---

## 1. 4-Layer Architecture Mapping

### Layer 1: Presentation Layer
- **`apps/web/src/features/admin/presentation/distributions-console.tsx`**: Pestaña/sección de gobernanza y visualización de fechas del proyecto.
- **`apps/web/src/features/admin/presentation/admin-notification-campaign-console.tsx`**: Notificaciones de auditoría de fechas.

### Layer 2: Application/Consumption Layer
- **`apps/web/src/app/api/admin/collections/[id]/date-change-request/route.ts`**: Registra solicitud `PENDING_MULTISIG`.
- **`apps/web/src/features/admin/domain/collection-patch-validator.ts`**: Rechaza peticiones con campos de fechas (`400 IMMUTABLE_PROJECT_DATE_FIELD`).

### Layer 3: Domain/Pipelines/Services Layer
- **`apps/web/src/features/staking-distribution/application/distribution-engine.ts`**: Lectura directa de fechas desde la PDA Notario en Solana RPC vía `@solana/kit`.

### Layer 4: Infrastructure Layer
- **`programs/project_config_notary`**: Contrato Anchor que mantiene el estado canónico de la PDA Notario on-chain.
- Postgres DB como réplica de lectura informativa (*Read-Model Cache*), actualizada solo tras confirmación on-chain.

---

## 2. Subagent Orchestration (Gates & Cross-Cutting)

| Gate | Subagente | Momento |
| --- | --- | --- |
| **Gate 1: Pre-Implementation Architecture Review** | `architect` | Antes de SPEC-02 — valida que la lectura RPC reemplaza a Postgres como fuente de verdad en el motor |
| **Gate 2: Post-Implementation Diff Audit** | `architect` | Después de SPEC-05 — audita que no queden rutas mutadoras residuales, layer isolation |
| **Cross-Cutting: Security Review (CRÍTICA)** | `security` | Revisa eliminación completa de APIs de mutación de fechas, validación de PDA on-chain, grep de rutas residuales. **Desmantelamiento de la superficie de ataque.** |
| **Cross-Cutting: Solana RPC Integration** | `solana` | Valida lectura RPC correcta, cluster, discriminator, account length |
| **Cross-Cutting: Docs Sync** | `docs` | Documenta política de inmutabilidad de fechas y read-model cache |

---

## 3. SPEC Delivery Structure (Atomic Branches)

### SPEC-01: TDD — Tests en Fallo (RED Phase)
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s07-01-tdd`
- **Subagente ejecutor**: `qa`
- **Subagentes de apoyo**: `security` (assertions de inmutabilidad), `solana` (assertions de lectura RPC)
- **Objetivo**: Escribir los tests unitarios e integración en fase RED.
- **Archivos a Crear**:
  - `tests/lib/distribution-engine-pda-read.test.ts`
  - `tests/api/date-change-request.test.ts`
  - `tests/lib/collection-patch-immutable-dates.test.ts`
- **Assertions**:
  - Alterar `project_start_at` en Postgres no altera el resultado del cálculo en `distribution-engine.ts`.
  - Enviar `project_start_at` en un payload PATCH retorna `400 IMMUTABLE_PROJECT_DATE_FIELD`.
  - `POST /date-change-request` crea una solicitud `PENDING_MULTISIG` sin modificar Postgres.
  - RPC fallido bloquea el cálculo (no hace fallback silencioso a Postgres).
- **DoD de SPEC-01**: Todos los tests compilando y fallando correctamente (RED).

---

### SPEC-02: Inmutabilidad Explícita en Validadores API
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s07-02-immutable-validators`
- **Subagente ejecutor**: `api`
- **Subagentes de apoyo**: `security` (verificar eliminación completa de rutas mutadoras), `architect` (Gate 1 — source of truth validation)
- **Objetivo**: Actualizar `collection-patch-payload.ts` declarando `IMMUTABLE_PROJECT_DATE_FIELDS` y rechazando cualquier petición que contenga campos de fechas. Verificar que no quede ninguna ruta mutadora residual en el código.
- **Archivos a Modificar**:
  - `apps/web/src/features/admin/domain/collection-patch-validator.ts` (Layer 3 — Domain: pure validation rules, 0 external deps)
- **DoD de SPEC-02**: Validador rechazando mutaciones de fechas. Tests de SPEC-01 de inmutabilidad en verde.

---

### SPEC-03: Lectura Directa RPC en distribution-engine.ts
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s07-03-engine-rpc`
- **Subagente ejecutor**: `solana`
- **Subagentes de apoyo**: `api` (integración con capa de consumo), `security` (validación cluster, program owner, discriminator)
- **Objetivo**: Modificar `calculateDistributionPreparation` para que consulte `fetchProjectConfigPDAOnChain` directamente vía Solana RPC, validando cluster, program owner, PDA seeds, discriminator, account length y versión antes de decodificar. RPC fallido bloquea el cálculo.
- **Archivos a Crear/Modificar**:
  - `apps/web/src/features/staking-distribution/application/distribution-engine.ts` (Layer 2 — Application: calculation service)
  - `apps/web/src/lib/solana-kit/pda/project-config-reader.ts` (Layer 4 — Infrastructure: Solana RPC reader)
- **DoD de SPEC-03**: Motor leyendo directamente de Solana. Tests de SPEC-01 de lectura RPC en verde.

---

### SPEC-04: Endpoint date-change-request y Flujo UI de Notificaciones
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s07-04-date-request-ui`
- **Subagente ejecutor**: `api` (endpoint) + `frontend` (UI components)
- **Subagentes de apoyo**: `state` (notification state management), `security` (audit trail)
- **Objetivo**: Implementar `POST /api/admin/collections/[id]/date-change-request` que crea intención auditable sin modificar Postgres. Implementar la UI del botón "Solicitar Cambio de Fecha" en `/admin/collections/[id]`, la notificación destacada en `/admin/notifications` y la pestaña "Gobernanza de Proyectos" en `/admin/treasury/squads`.
- **Archivos a Crear/Modificar**:
  - `apps/web/src/app/api/admin/collections/[id]/date-change-request/route.ts` (Layer 2 — Application/API: Next.js route)
  - Componente de solicitud de cambio de fecha en `/admin/collections/[id]`
  - Componente de notificación de gobernanza en `/admin/notifications`
  - Pestaña de gobernanza en `apps/web/src/features/admin/presentation/treasury-console.tsx`
- **DoD de SPEC-04**: Flujo UI/UX completo funcional. Tests de SPEC-01 del endpoint en verde.

---

### SPEC-05: Sincronización Read-Model Cache (Postgres Indexer)
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s07-05-read-model-sync`
- **Subagente ejecutor**: `solana` (indexer on-chain) + `db` (Postgres sync)
- **Subagentes de apoyo**: `security` (signature/slot verification)
- **Objetivo**: Implementar el listener/indexador que sincroniza Postgres cuando una transacción de Squads ejecuta la instrucción `update_project_dates` en el programa `project_config_notary`. Guardar `observed_at`, `slot`, `signature`, `config_version` y estado de sincronización.
- **Archivos a Crear**:
  - `apps/web/src/lib/solana-kit/indexers/project-config-indexer.ts` (Layer 4 — Infrastructure: Solana event indexer)
- **DoD de SPEC-05**: Sincronización funcional con evidencia on-chain.

---

### SPEC-06: Clean Code Audit & Refactoring
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s07-06-refactor-clean`
- **Subagente ejecutor**: `reviewer`
- **Subagentes de apoyo**: `architect` (Gate 2 — diff audit, residual mutation grep), `security` (final attack surface review), `docs` (immutability policy documentation)
- **Objetivo**: Auditoría de código limpio: naming, eliminación de dead code, búsqueda exhaustiva de rutas mutadoras residuales en la API, documentación de la política de inmutabilidad de fechas.
- **Verificaciones**:
  - `pnpm validate` con 0 errores.
  - Todos los tests de regresión en verde.
  - Búsqueda grep exhaustiva confirma cero rutas mutadoras residuales.
- **DoD de SPEC-06**: Suite completa en verde, `pnpm validate` limpio y cero hallazgos bloqueantes.

---

## 4. Canonical Documentation References (Squads V4 & Solana)

> Fuente canónica: [`squads-v4-documentation-reference.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/squads-v4-documentation-reference.md)

| SPEC | Documentación Requerida | URL / Sección |
| --- | --- | --- |
| SPEC-01 (TDD) | Account: `Multisig` — `configAuthority`, PDA derivation | [Protocol Accounts](https://docs.squads.so/main/protocol/accounts) §3.1 |
| SPEC-02 (Validators) | Instruction: `proposalCancel` — invalidar peticiones de mutación HTTP | [Protocol Instructions](https://docs.squads.so/main/protocol/instructions) |
| SPEC-03 (Engine RPC) | SDK v4: `multisig.accounts.Multisig.fromAccountAddress()` — lectura RPC | [SDK v4](https://docs.squads.so/main/development/sdk-v4) §2 |
| SPEC-03 (Engine RPC) | PDA Derivation: `multisig.getVaultPda()` para validar Vault PDA origen | [SDK v4](https://docs.squads.so/main/development/sdk-v4) §2 |
| SPEC-04 (Date Request) | Guide: Create Proposal — flujo de `vaultTransactionCreate` + `proposalCreate` | [Create Proposal](https://docs.squads.so/main/development/guides/create-proposal) §6.2 |
| SPEC-04 (Date Request) | Guide: Vote — `proposalApprove` para el comité | [Vote on Proposal](https://docs.squads.so/main/development/guides/vote-on-proposal) §6.3 |
| SPEC-05 (Indexer) | Guide: Execute Proposal — confirmación de ejecución on-chain | [Execute Proposal](https://docs.squads.so/main/development/guides/execute-proposal) §6.4 |
| SPEC-05 (Indexer) | Account: `Proposal.status` — detectar `Executed` para indexar | [Protocol Accounts](https://docs.squads.so/main/protocol/accounts) §3.2 |
| SPEC-05 (Indexer) | Program ID: verificar `SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf` como program owner | [Program IDs](https://docs.squads.so/main/protocol/program-ids) §1 |

---

## 5. Blocking Design Contract
- `date-change-request` crea intención auditable; no cambia fechas ni marca `APPROVED` por sí misma.
- La lectura RPC valida cluster, program owner, PDA seeds, discriminator, account length, `collection_address`, `authority_vault` y versión antes de decodificar.
- RPC fallido, cuenta ausente o schema inesperado bloquea el cálculo; no hace fallback silencioso a Postgres.
- Postgres conserva `observed_at`, `slot`, `signature`, `config_version`.
- El motor recibe tiempos como enteros (`bigint`/milisegundos derivado de segundos), sin floats.
- El PATCH de colección rechaza fechas tanto en schema como en repositorio/SQL.

## 6. Acceptance and Failure Matrix
| Case | Expected result |
| --- | --- |
| POST date change request | `PENDING_MULTISIG`; no date mutation |
| RPC timeout or wrong owner | Calculation fails closed with observable error |
| DB differs from PDA | PDA wins; cache marked stale and alert shown |
| Valid confirmed Squads CPI | Indexer updates read model with signature/slot |
| Direct PATCH with date field | 400 `IMMUTABLE_PROJECT_DATE_FIELD` at schema boundary |
