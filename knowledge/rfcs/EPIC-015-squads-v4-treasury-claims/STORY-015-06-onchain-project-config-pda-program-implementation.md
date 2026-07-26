---
type: ImplementationSpec
title: STORY-015-06 On-Chain Project Config PDA Program Implementation Spec
description: Especificación técnica atómica de implementación para el contrato inteligente Anchor/Pinocchio de la PDA Notario (ProjectConfigPDA) en Solana Devnet.
tags: [specs, solana, anchor, rust, notary, pda, tdd]
timestamp: 2026-07-25T19:54:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-06-onchain-project-config-pda-program-implementation.md
---

# STORY-015-06 On-Chain Project Config PDA Program Implementation Spec

## Metadata
- Epic: `EPIC-015-squads-v4-treasury-claims`
- Story ID: `STORY-015-06`
- Atomic Branch: `SPEC/jaymusicmachine-BRI-8-s06-notary-pda-program`
- Status: `draft`
- Owner: `jaymusicmachine`

## 1. 4-Layer Architecture Mapping

### Layer 1: Presentation Layer
- No aplica (Contrato On-Chain).

### Layer 2: Application/Consumption Layer
- No aplica (Contrato On-Chain).

### Layer 3: Domain/Pipelines/Services Layer
- No aplica (Contrato On-Chain).

### Layer 4: Infrastructure Layer (Rust Anchor Program)
- **`programs/project_config_notary/src/lib.rs`**: Entrypoint del programa Solana.
- **`programs/project_config_notary/src/state.rs`**: Estructura `ProjectConfigState`.
- **`programs/project_config_notary/src/instructions/initialize.rs`**: Instrucción de derivación y setup.
- **`programs/project_config_notary/src/instructions/update_dates.rs`**: Instrucción de modificación con restricción `has_one = squads_multisig_authority`.

---

## 2. TDD Strategy (Test-Driven Development)

### Integration Test File (Anchor / LiteSVM)
- `tests/programs/project-config-notary.test.ts`

### Test Commands
```bash
cargo build-sbf
pnpm test tests/programs/project-config-notary.test.ts
```

### Assertions & Test Criteria
1. **RED (Fallo Inicial)**:
   - Invocar `update_project_dates` con una wallet signataria arbitraria que no sea la `squads_multisig_authority` revierte la transacción con `UnauthorizedAuthority`.
2. **GREEN (Paso)**:
   - Invocar la instrucción habiendo firmado como la PDA de Squads v4 actualiza exitosamente `project_start_at` y `project_end_at` en el estado on-chain.

---

## 3. Definition of Done (DoD)
- [ ] Código Rust en `programs/project_config_notary` compilando con cero advertencias.
- [ ] Ejecución de `program_autofixer` sin alertas pendientes.
- [ ] Programa desplegado en Solana Devnet.
