---
type: RFC
title: STORY-015-06 On-Chain Project Config PDA Program
description: Especificación técnica para el desarrollo e inicialización del programa de Solana (Anchor/Pinocchio) para la PDA Notario de Configuración del Proyecto (ProjectConfigPDA).
tags: [rfcs, solana, anchor, squads, notary, pda, project-config, rust]
timestamp: 2026-07-25T19:39:00Z
resource: https://github.com/jeisonsosablockdev/brids/blob/develop/knowledge/rfcs/EPIC-015-squads-v4-treasury-claims/STORY-015-06-onchain-project-config-pda-program.md
---

# STORY-015-06 On-Chain Project Config PDA Program

## Metadata
- Epic: `EPIC-015-squads-v4-treasury-claims`
- Story ID: `STORY-015-06-onchain-project-config-pda-program`
- Status: `draft`
- Owner: `jaymusicmachine`
- RFC owner slice: `feature/jaymusicmachine-BRI-8-squads-v4-treasury-claims`
- Created: `2026-07-25`
- Last Updated: `2026-07-25`

## Context
- **Problem**: Se requiere una cuenta de almacenamiento inmutable en la blockchain de Solana que resguarde las fechas operativas del proyecto (`project_start_at` y `project_end_at`) y que únicamente acepte modificaciones firmadas por la PDA de Squads v4.
- **Why now**: Crear el programa de Solana para disponer del contrato on-chain que sirve como Fuente Única de Verdad (*Single Source of Truth*).
- **Constraints**: Desarrollo en Rust (Anchor/Pinocchio) desplegado en Solana Devnet.
- **Affected paths**: `programs/project_config_notary/`, `lib/solana-kit/compat/squads.ts`.

## Technical Specification

### 1. Estructura de Cuenta PDA (`ProjectConfigPDA`)
```rust
#[account]
pub struct ProjectConfigState {
    pub collection_address: Pubkey,        // 32 bytes: Pubkey de la Colección
    pub squads_multisig_authority: Pubkey, // 32 bytes: PDA de Squads v4 (Autoridad de Gobernanza)
    pub project_start_at: u64,             // 8 bytes: Unix Timestamp de inicio
    pub project_end_at: Option<u64>,       // 9 bytes: Unix Timestamp de fin (opcional)
    pub last_updated_at: u64,              // 8 bytes: Timestamp de última actualización
    pub bump: u8,                          // 1 byte: PDA Bump
}
```

### 2. Instrucciones del Programa en Rust/Anchor

#### A. `initialize_project_config`
- Inicializa la PDA `ProjectConfigPDA` vinculada a la colección mediante las semillas `seeds = [b"project_config", collection_mint_pubkey.as_ref()]`.
- Asigna la `squads_multisig_authority` como la única entidad con permiso de edición.

#### B. `update_project_dates`
- Recibe los parámetros `new_project_start_at` y `new_project_end_at`.
  - **Restricción de Seguridad Rígida**:
  ```rust
  #[account(
      mut,
      seeds = [b"project_config", collection_mint.key().as_ref()],
      bump = project_config.bump,
      // La autoridad efectiva debe ser la Vault PDA y llegar como signer de una CPI de Squads.
      // `has_one` solo compara claves y no demuestra autorización.
    )]
  pub project_config: Account<'info, ProjectConfigState>,
  ```
- Si la instrucción no viene firmada por la PDA de Squads v4, la runtime de Solana revierte la transacción.

### Security correction
`update_project_dates` debe recibir la Vault PDA configurada, comprobar igualdad con el estado y `is_signer`, y validar que la invocación proviene de la CPI aprobada. La API no puede firmar como la PDA ni cambiar fechas directamente.

## Status
- **Current status**: `draft`
- **Exit criteria**:
  - [ ] Programa Anchor/Pinocchio `project_config_notary` desarrollado y compilar con cero advertencias.
  - [ ] Contrato desplegado e inicializado en Solana Devnet.

## Traceability
- Related issue(s): BRI-8
- Related PR(s): TBD
- Final commit hash(es): TBD
