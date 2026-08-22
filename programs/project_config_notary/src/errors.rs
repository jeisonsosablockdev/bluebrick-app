//! =========================================================================================
//! Layer: Layer 4 — Infrastructure / Smart Contracts (Solana Anchor Runtime)
//! Program: project_config_notary
//! Module: errors
//!
//! 🏛️ PROPÓSITO:
//! Define los errores tipados y mensajes descriptivos emitidos por el contrato Notario
//! cuando se violan las invariantes de autoridad de Squads v4 o las restricciones de fechas.
//! =========================================================================================

use anchor_lang::prelude::*;

#[error_code]
pub enum ProjectConfigError {
    /// 🚫 Error 6000: La cuenta firmante no coincide exactamente con la Vault PDA de Squads v4.
    /// Impide que cualquier wallet externa o atacante intente modificar las fechas on-chain.
    #[msg("Authority Vault must match the Squads Vault PDA.")]
    UnauthorizedAuthority,

    /// 🚫 Error 6001: Invariante temporal violada. Se intentó registrar una fecha final anterior a la fecha de inicio.
    #[msg("Date range is invalid: start_at must be less than or equal to end_at.")]
    InvalidDateRange,

    /// 🚫 Error 6002: El PDA Notario ya existe para esta colección y no puede ser reinicializado.
    #[msg("Project configuration PDA has already been initialized.")]
    AlreadyInitialized,

    /// 🚫 Error 6003: La cuenta multisig suministrada no pertenece al programa oficial de Squads v4.
    #[msg("Invalid Squads multisig account or program owner.")]
    InvalidMultisigAccount,
}
