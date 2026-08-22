//! =========================================================================================
//! Layer: Layer 4 — Infrastructure / Smart Contracts (Solana Anchor Runtime)
//! Program: project_config_notary
//! Instruction: update_project_dates
//!
//! 🏛️ PROPÓSITO:
//! Actualiza de forma segura y notarizada las fechas de inicio (`start_at`) y fin (`end_at`)
//! de un proyecto inmobiliario en su PDA Notario on-chain.
//!
//! 🛡️ REGLAS DE SEGURIDAD & MODELO DE 3 CAPAS:
//! 1. `authority_vault` DEBE ser un firmante (`Signer`). Dado que es un PDA sin clave privada,
//!    esta firma SOLO puede originarse mediante una invocación Cross-Program (CPI) ejecutada
//!    por el programa de Squads v4 tras haber alcanzado el quórum del comité multisig.
//! 2. `has_one = authority_vault`: Verifica que la Vault firmante coincida con la registrada en el PDA.
//! 3. `has_one = multisig`: Verifica que el multisig coincida con el registrado en el PDA.
//! 4. `has_one = collection_address`: Verifica que la colección pertenezca a este PDA.
//! 5. Re-derivación en tiempo de ejecución: Re-deriva la Vault PDA contra `SQUADS_V4_PROGRAM_ID`.
//! 6. Invariante temporal: `new_start_at <= new_end_at`.
//! =========================================================================================

use anchor_lang::prelude::*;

use crate::errors::ProjectConfigError;
use crate::state::{ProjectConfigState, PROJECT_CONFIG_SEED, SQUADS_V4_PROGRAM_ID};

/// Estructura de cuentas validadas para la actualización de fechas notarizadas
#[derive(Accounts)]
pub struct UpdateProjectDates<'info> {
    /// 🏛️ Vault PDA de Squads v4 ejecutando esta actualización mediante CPI
    /// Esta cuenta DEBE ser firmante (`Signer`). Nadie puede falsificar su firma sin la aprobación de Squads.
    pub authority_vault: Signer<'info>,

    /// 🤝 Cuenta Multisig de Squads v4
    /// CHECK: Validado en el handler contra `state.multisig` y comprobación de owner de Squads v4.
    pub multisig_account: UncheckedAccount<'info>,

    /// 🎨 Dirección de la Colección Metaplex Core del proyecto
    /// CHECK: Validado en constraints de Anchor contra `state.collection_address`.
    pub collection_address: UncheckedAccount<'info>,

    /// 📝 Cuenta PDA Notario que se actualizará
    #[account(
        mut,
        seeds = [PROJECT_CONFIG_SEED, collection_address.key().as_ref()],
        bump = project_config.bump,
        has_one = authority_vault @ ProjectConfigError::UnauthorizedAuthority,
        has_one = multisig @ ProjectConfigError::InvalidMultisigAccount,
        has_one = collection_address @ ProjectConfigError::UnauthorizedAuthority
    )]
    pub project_config: Account<'info, ProjectConfigState>,
}

/// Evento de auditoría emitido en la blockchain cuando las fechas son modificadas exitosamente
#[event]
pub struct ProjectDatesUpdated {
    pub collection_address: Pubkey,
    pub authority_vault: Pubkey,
    pub old_start_at: i64,
    pub old_end_at: i64,
    pub new_start_at: i64,
    pub new_end_at: i64,
    pub version: u32,
    pub timestamp: i64,
}

/// Manejador de la instrucción `update_project_dates`
///
/// Lógica Paso a Paso:
/// // Paso 1: Validar que el nuevo rango de fechas sea coherente (new_start_at <= new_end_at).
/// // Paso 2: Validar que multisig_account sea propiedad del program ID de Squads v4.
/// // Paso 3: Re-derivar la Vault PDA esperada y verificar que coincida exactamente con authority_vault.
/// // Paso 4: Guardar valores anteriores para auditoría, aplicar nuevas fechas e incrementar versión.
/// // Paso 5: Emitir evento público ProjectDatesUpdated en Solana.
pub fn handler(
    ctx: Context<UpdateProjectDates>,
    new_start_at: i64,
    new_end_at: i64,
) -> Result<()> {
    // Paso 1: Validar coherencia temporal
    require!(new_start_at <= new_end_at, ProjectConfigError::InvalidDateRange);

    // Paso 2: Validar que la cuenta multisig sea de Squads v4
    require_keys_eq!(
        *ctx.accounts.multisig_account.owner,
        SQUADS_V4_PROGRAM_ID,
        ProjectConfigError::InvalidMultisigAccount
    );

    // Paso 3: Re-derivar la Vault PDA de Squads v4 y asegurar autenticidad
    let config = &mut ctx.accounts.project_config;
    let (expected_vault_pda, _) = Pubkey::find_program_address(
        &[
            b"multisig",
            ctx.accounts.multisig_account.key().as_ref(),
            b"vault",
            &[config.vault_index],
        ],
        &SQUADS_V4_PROGRAM_ID,
    );

    require_keys_eq!(
        ctx.accounts.authority_vault.key(),
        expected_vault_pda,
        ProjectConfigError::UnauthorizedAuthority
    );

    // Paso 4: Aplicar cambios de fechas, incrementar versión y actualizar timestamp
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    let old_start_at = config.start_at;
    let old_end_at = config.end_at;

    config.start_at = new_start_at;
    config.end_at = new_end_at;
    config.version = config.version.saturating_add(1);
    config.updated_at = now;

    // Paso 5: Emitir evento inmutable de auditoría en la blockchain
    emit!(ProjectDatesUpdated {
        collection_address: config.collection_address,
        authority_vault: config.authority_vault,
        old_start_at,
        old_end_at,
        new_start_at,
        new_end_at,
        version: config.version,
        timestamp: now,
    });

    Ok(())
}
