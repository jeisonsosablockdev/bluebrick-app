//! =========================================================================================
//! Layer: Layer 4 — Infrastructure / Smart Contracts (Solana Anchor Framework)
//! Program: project_config_notary
//! Program ID: HLp7YXKZZ8uPuzwN3CtuDxtgYoWhc5Fb1FHj5bHEe9zE
//!
//! 🏛️ RESUMEN ARQUITECTÓNICO DEL PROGRAMA NOTARIO:
//! Este programa de Solana es el custodio inmutable de los parámetros y fechas oficiales
//! de los proyectos tokenizados en BRIDS.
//!
//! 🔐 GARANTÍAS CRIPTOGRÁFICAS PRINCIPALES:
//! 1. PDA Canónico: `[b"project_config", collection_address]`.
//! 2. Modelo de 3 Capas de Autenticación de Squads v4:
//!    - Verificación de firmante: `authority_vault` debe firmar la transacción.
//!    - Re-derivación en runtime: Se verifica matemáticamente que la Vault PDA pertenezca al multisig de Squads.
//!    - Verificación de Owner: Se verifica que el multisig pertenezca al programa oficial de Squads v4.
//! 3. Invariante de Rango: `start_at <= end_at` (evita fechas ilógicas o manipuladas).
//! =========================================================================================

use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("EAwShRn1voHtw3MgHEfyw5Svb4Xv1hePNPWQvD8NjvRi");

#[program]
pub mod project_config_notary {
    use super::*;

    /// 📝 Inicializa un nuevo PDA Notario vinculado a una colección Metaplex Core.
    /// Registra las fechas iniciales de operación (`start_at`, `end_at`) y la autoridad de Squads.
    pub fn initialize_project_config(
        ctx: Context<InitializeProjectConfig>,
        start_at: i64,
        end_at: i64,
        vault_index: u8,
    ) -> Result<()> {
        instructions::initialize::handler(ctx, start_at, end_at, vault_index)
    }

    /// 🔄 Actualiza las fechas notarizadas de inicio y fin.
    /// Exclusivamente ejecutable mediante CPI firmado por la Vault PDA de Squads v4.
    pub fn update_project_dates(
        ctx: Context<UpdateProjectDates>,
        new_start_at: i64,
        new_end_at: i64,
    ) -> Result<()> {
        instructions::update_dates::handler(ctx, new_start_at, new_end_at)
    }

    /// 🩺 Endpoint de salud / ping del programa Notario.
    pub fn ping(_ctx: Context<PingContext>) -> Result<()> {
        msg!("project_config_notary::ping ok");
        Ok(())
    }
}

/// Contexto de cuentas para la instrucción de comprobación de salud (ping)
#[derive(Accounts)]
pub struct PingContext<'info> {
    pub signer: Signer<'info>,
}
