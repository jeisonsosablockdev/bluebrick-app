//! =========================================================================================
//! Layer: Layer 4 — Infrastructure / Smart Contracts (Solana Anchor Runtime)
//! Program: project_config_notary
//! Instruction: initialize_project_config
//!
//! 🏛️ PROPÓSITO:
//! Inicializa por primera vez la cuenta PDA Notario (`[b"project_config", collection_address]`)
//! para una colección Metaplex Core en Solana.
//!
//! 🛡️ REGLAS DE SEGURIDAD & MODELO DE 3 CAPAS:
//! 1. La cuenta creadora (`authority_vault`) debe ser firmante mediante CPI desde Squads v4.
//! 2. Se verifica que `multisig_account` pertenezca al programa oficial de Squads v4.
//! 3. Se re-deriva la Vault PDA de Squads on-chain para asegurar que coincida con `authority_vault`.
//! 4. Se asegura que la fecha de inicio no sea posterior a la fecha de finalización (`start_at <= end_at`).
//! =========================================================================================

use anchor_lang::prelude::*;

use crate::errors::ProjectConfigError;
use crate::state::{ProjectConfigState, PROJECT_CONFIG_SEED, SQUADS_V4_PROGRAM_ID};

/// Estructura de Cuentas requeridas para inicializar el PDA Notario
#[derive(Accounts)]
#[instruction(start_at: i64, end_at: i64, vault_index: u8)]
pub struct InitializeProjectConfig<'info> {
    /// 🏛️ Vault PDA de Squads v4 actuando como autoridad creadora mediante CPI
    pub authority_vault: Signer<'info>,

    /// 🤝 Cuenta Multisig de Squads v4 (debe pertenecer a `SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf`)
    /// CHECK: Validado en el handler contra el owner oficial de Squads v4 y re-derivación de la Vault PDA.
    pub multisig_account: UncheckedAccount<'info>,

    /// 🎨 Dirección pública de la Colección Metaplex Core vinculada al proyecto
    /// CHECK: Clave pública canónica utilizada como semilla para la derivación del PDA.
    pub collection_address: UncheckedAccount<'info>,

    /// 📝 Cuenta PDA Notario que se crea y asigna en Solana (134 bytes)
    #[account(
        init,
        payer = payer,
        space = ProjectConfigState::LEN,
        seeds = [PROJECT_CONFIG_SEED, collection_address.key().as_ref()],
        bump
    )]
    pub project_config: Account<'info, ProjectConfigState>,

    /// 💳 Pagador de la renta SOL para la asignación de la cuenta en Solana
    #[account(mut)]
    pub payer: Signer<'info>,

    /// ⚙️ Programa del Sistema de Solana para la creación física de cuentas
    pub system_program: Program<'info, System>,
}

/// Evento de auditoría emitido tras la inicialización exitosa del PDA Notario
#[event]
pub struct ProjectConfigInitialized {
    pub collection_address: Pubkey,
    pub authority_vault: Pubkey,
    pub multisig: Pubkey,
    pub vault_index: u8,
    pub start_at: i64,
    pub end_at: i64,
    pub version: u32,
    pub timestamp: i64,
}

/// Manejador de la instrucción `initialize_project_config`
///
/// Lógica Paso a Paso:
/// // Paso 1: Validar la invariante de rango temporal (start_at <= end_at).
/// // Paso 2: Validar que multisig_account pertenezca al program ID de Squads v4.
/// // Paso 3: Re-derivar determinísticamente la Vault PDA de Squads y comprobar que authority_vault coincida.
/// // Paso 4: Poblar el estado on-chain del ProjectConfigState y almacenar la semilla bump.
/// // Paso 5: Emitir el evento de auditoría ProjectConfigInitialized.
pub fn handler(
    ctx: Context<InitializeProjectConfig>,
    start_at: i64,
    end_at: i64,
    vault_index: u8,
) -> Result<()> {
    // Paso 1: Validar invariante de fechas (la fecha de inicio debe ser anterior o igual al fin)
    require!(start_at <= end_at, ProjectConfigError::InvalidDateRange);

    // Paso 2: Validar que la cuenta multisig sea legalmente propiedad del programa de Squads v4
    require_keys_eq!(
        *ctx.accounts.multisig_account.owner,
        SQUADS_V4_PROGRAM_ID,
        ProjectConfigError::InvalidMultisigAccount
    );

    // Paso 3: Re-derivar la Vault PDA esperada de Squads v4 para asegurar autenticidad
    let (expected_vault_pda, _) = Pubkey::find_program_address(
        &[
            b"multisig",
            ctx.accounts.multisig_account.key().as_ref(),
            b"vault",
            &[vault_index],
        ],
        &SQUADS_V4_PROGRAM_ID,
    );

    require_keys_eq!(
        ctx.accounts.authority_vault.key(),
        expected_vault_pda,
        ProjectConfigError::UnauthorizedAuthority
    );

    // Paso 4: Asignar y guardar los datos en la cuenta de estado on-chain
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    let config = &mut ctx.accounts.project_config;
    config.authority_vault = ctx.accounts.authority_vault.key();
    config.multisig = ctx.accounts.multisig_account.key();
    config.vault_index = vault_index;
    config.collection_address = ctx.accounts.collection_address.key();
    config.start_at = start_at;
    config.end_at = end_at;
    config.version = 1;
    config.updated_at = now;
    config.bump = ctx.bumps.project_config;

    // Paso 5: Emitir evento público indexable en Solana
    emit!(ProjectConfigInitialized {
        collection_address: config.collection_address,
        authority_vault: config.authority_vault,
        multisig: config.multisig,
        vault_index,
        start_at,
        end_at,
        version: 1,
        timestamp: now,
    });

    Ok(())
}
