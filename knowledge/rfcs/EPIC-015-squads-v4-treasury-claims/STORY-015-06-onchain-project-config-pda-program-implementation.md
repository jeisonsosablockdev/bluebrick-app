---
type: ImplementationSpec
title: STORY-015-06 On-Chain Project Config PDA Program Implementation Spec
description: Especificación técnica atómica de implementación SPEC-por-SPEC para el contrato inteligente Anchor de la PDA Notario (ProjectConfigPDA) en Solana Devnet.
tags: [specs, solana, anchor, rust, notary, pda, tdd, refactor-clean]
timestamp: 2026-07-25T20:33:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-06-onchain-project-config-pda-program-implementation.md
---

# STORY-015-06 On-Chain Project Config PDA Program Implementation Spec

## Metadata
- Epic: `EPIC-015-squads-v4-treasury-claims`
- Story ID: `STORY-015-06`
- Parent Branch: `feature/jaymusicmachine-BRI-8-squads-v4-treasury-claims`
- Status: `draft`
- Owner: `jaymusicmachine`

---

## 1. 4-Layer Architecture Mapping

### Layer 1–3: No aplica (Contrato On-Chain).

### Layer 4: Infrastructure Layer (Rust Anchor Program)
- **`programs/project_config_notary/src/lib.rs`**: Entrypoint del programa Solana.
- **`programs/project_config_notary/src/state.rs`**: Estructura `ProjectConfigState` con `authority_vault`, `multisig`, `vault_index`, `collection_address`, `start_at`, `end_at`, `version`, `updated_at`, `bump`.
- **`programs/project_config_notary/src/instructions/initialize.rs`**: Instrucción de derivación y setup.
- **`programs/project_config_notary/src/instructions/update_dates.rs`**: Instrucción de modificación autorizada por la Vault PDA de Squads mediante CPI.

---

## 2. Subagent Orchestration (Gates & Cross-Cutting)

| Gate | Subagente | Momento |
| --- | --- | --- |
| **Gate 1: Pre-Implementation Architecture Review** | `architect` | Antes de SPEC-02 — valida account layout, semillas PDA y separación de módulos Rust |
| **Gate 2: Post-Implementation Diff Audit** | `architect` | Después de SPEC-05 — audita layer isolation y zero legacy `@solana/web3.js` en tests |
| **Cross-Cutting: Security Review (CRÍTICA)** | `security` | Revisa authority model, CPI signer validation, reinitialize guard, PDA seeds canonicality. **Esta es la Story con mayor carga de seguridad on-chain.** |
| **Cross-Cutting: Solana Program Autofixer** | `solana` | Ejecuta `program_autofixer` hasta que `require_another_tool_call_after_fixing` sea false |
| **Cross-Cutting: Docs Sync** | `docs` | Documenta account layout, discriminator y deployed program ID |

---

## 3. SPEC Delivery Structure (Atomic Branches)

### SPEC-01: TDD — Tests de Integración Anchor en Fallo (RED Phase)
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s06-01-tdd`
- **Subagente ejecutor**: `qa`
- **Subagentes de apoyo**: `solana` (definir assertions de CPI y authority), `security` (assertions de reinitialize guard)
- **Objetivo**: Escribir los tests de integración Anchor / LiteSVM en fase RED.
- **Archivos a Crear**:
  - `tests/programs/project-config-notary.test.ts`
- **Assertions**:
  - Invocar `update_project_dates` con una wallet signataria arbitraria revierte con `UnauthorizedAuthority`.
  - Invocar `initialize` en una PDA ya existente revierte (prevenir duplicados).
  - `end_at < start_at` revierte con rango inválido.
  - Vault key correcta pero sin firma/CPI revierte.
- **Test Commands**:
  ```bash
  cargo build-sbf
  pnpm test tests/programs/project-config-notary.test.ts
  ```
- **DoD de SPEC-01**: Todos los tests compilando y fallando correctamente (RED).

---

### SPEC-02: Estado de Cuenta y Derivación PDA (state.rs)
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s06-02-state`
- **Subagente ejecutor**: `solana`
- **Subagentes de apoyo**: `architect` (Gate 1 — account layout review), `security` (seed canonicality)
- **Objetivo**: Implementar la estructura de cuenta `ProjectConfigState` con los campos requeridos, documentar el tamaño de cuenta y discriminador, y definir las semillas canónicas `[b"project_config", collection_address]`.
- **Archivos a Crear**:
  - `programs/project_config_notary/src/state.rs`
- **DoD de SPEC-02**: Struct compilando con `cargo build-sbf` sin advertencias.

---

### SPEC-03: Instrucción de Inicialización de Configuración (initialize.rs)
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s06-03-initialize`
- **Subagente ejecutor**: `solana`
- **Subagentes de apoyo**: `security` (reinitialize guard, authority bootstrap, 3-layer Vault validation)
- **Objetivo**: Implementar la instrucción `initialize_project_config` que crea la PDA vinculada a la colección con la autoridad de bootstrap explícita. Valida que `authority_vault` sea signer, que su dirección coincida con la PDA re-derivada de Squads v4 (`[b"multisig", multisig_pda.as_ref(), b"vault", &[vault_index]]`) contra `SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf`, y que `multisig_account.owner == SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf`. Impedir duplicados.
- **Archivos a Crear**:
  - `programs/project_config_notary/src/instructions/initialize.rs`
- **DoD de SPEC-03**: Instrucción compilando. Test de SPEC-01 para duplicados y validación de 3 capas de Vault en verde.

---

### SPEC-04: Instrucción de Actualización de Fechas (update_dates.rs)
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s06-04-update-dates`
- **Subagente ejecutor**: `solana`
- **Subagentes de apoyo**: `security` (CPI signer validation, 3-layer Vault check)
- **Objetivo**: Implementar `update_project_dates` con validación de 3 capas: `authority_vault.key() == state.authority_vault`, `authority_vault.is_signer` (firma proviene de CPI de Squads), y re-derivación contra Squads v4 program ID con `multisig_account.owner == SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf`; validación `start_at <= end_at`, versionado y emisión de evento con valores old/new.
- **Archivos a Crear**:
  - `programs/project_config_notary/src/instructions/update_dates.rs`
- **DoD de SPEC-04**: Instrucción compilando. Tests de SPEC-01 de autoridad y rangos en verde.

---

### SPEC-05: Despliegue en Devnet y Evidencia On-Chain
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s06-05-deploy`
- **Subagente ejecutor**: `solana`
- **Subagentes de apoyo**: `security` (verificar program authority), `docs` (registrar program ID y evidence)
- **Objetivo**: Desplegar el programa en Solana Devnet, ejecutar `program_autofixer`, y documentar la evidencia (program ID, transaction signature, account state).
- **DoD de SPEC-05**: Programa desplegado en Devnet, `program_autofixer` sin alertas pendientes, evidencia registrada.

---

### SPEC-06: Clean Code Audit & Refactoring
- **Branch**: `SPEC/jaymusicmachine-BRI-8-s06-06-refactor-clean`
- **Subagente ejecutor**: `reviewer`
- **Subagentes de apoyo**: `architect` (Gate 2 — diff audit, Rust module separation), `security` (final on-chain security review), `docs` (account layout docs)
- **Objetivo**: Auditoría de código Rust limpio: naming, separación de módulos, documentación de tamaño de cuenta, eliminación de `unsafe` innecesario, verificación de best practices de Anchor.
- **Verificaciones**:
  - `cargo clippy` con 0 warnings.
  - `cargo build-sbf` limpio.
  - Documentación actualizada.
- **DoD de SPEC-06**: Suite completa en verde, `cargo clippy` limpio y cero hallazgos bloqueantes.

---

## 4. Canonical Documentation References (Squads V4 & Solana)

> Fuente canónica: [`squads-v4-documentation-reference.md`](file:///Users/jaymusicmachine/Documents/Desarrollo/brids/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/squads-v4-documentation-reference.md)

| SPEC | Documentación Requerida | URL / Sección |
| --- | --- | --- |
| SPEC-01 (TDD) | Account: `Multisig` — `members`, `threshold`, Vault PDA derivation | [Protocol Accounts](https://docs.squads.so/main/protocol/accounts) §3.1 |
| SPEC-02 (State) | PDA Derivation: `multisig.getVaultPda({ multisigPda, index })` | [SDK v4](https://docs.squads.so/main/development/sdk-v4) §2 |
| SPEC-03 (Initialize) | Guide: Create Multisig — patrón de creación con `createKey` seed | [Create Multisig](https://docs.squads.so/main/development/guides/create-multisig) §6.1 |
| SPEC-04 (Update Dates) | Guide: Execute Proposal — CPI execution model, `Permission.Execute` | [Execute Proposal](https://docs.squads.so/main/development/guides/execute-proposal) §6.4 |
| SPEC-04 (Update Dates) | Account: `VaultTransaction.message` — CPI firmada por Vault PDA | [Protocol Accounts](https://docs.squads.so/main/protocol/accounts) §3.3 |
| SPEC-05 (Deploy) | Program ID Devnet: `SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf` | [Program IDs](https://docs.squads.so/main/protocol/program-ids) §1 |
| Transversal | Solana MCP: `program_autofixer` — ejecutar hasta sin alertas pendientes | Skill: `solana-dev` |
| Transversal | Anchor Docs: Account discriminator, PDA seeds, `init` macro | [Anchor Book](https://www.anchor-lang.com/docs) |

---

## 5. Blocking Design Contract
- `ProjectConfigState` debe incluir `authority_vault`, `multisig`, `vault_index`, `collection_address`, `start_at`, `end_at`, `version`, `updated_at` y `bump`; tamaño y discriminador documentados.
- Semillas canónicas y únicas: `[b"project_config", collection_address]`.
- `initialize` y `update_project_dates` comprueban validación de 3 capas para `authority_vault`: (1) `authority_vault.is_signer`, (2) re-derivación de la Vault PDA `[b"multisig", multisig_pda, b"vault", &[vault_index]]` contra `SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf`, y (3) `multisig_account.owner == SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf`. La firma proviene de CPI de Squads durante `vaultTransactionExecute`.
- El programa no puede leer ni confiar en Postgres, `runId`, ni una firma HTTP.

## 6. Acceptance and Failure Matrix
| Case | Expected result |
| --- | --- |
| Arbitrary signer | Revert `UnauthorizedAuthority` |
| Vault key correct but no signer/CPI | Revert |
| Wrong collection/PDA seeds | Revert |
| `end_at < start_at` or invalid range | Revert |
| Reinitialize existing PDA | Revert |
| Valid Squads CPI | Update state and emit event with old/new values |
