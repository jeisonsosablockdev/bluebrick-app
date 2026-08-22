//! Layer: Layer 4 — Infrastructure / Smart Contracts
//! Module: Error codes for Project Config Notary program
//!
//! What: Defines Anchor error codes for project configuration governance.
//! How: Enforces strict invariant checking for PDA authorities and date ranges.

use anchor_lang::prelude::*;

#[error_code]
pub enum ProjectConfigError {
    #[msg("Authority Vault must match the Squads Vault PDA.")]
    UnauthorizedAuthority,

    #[msg("Date range is invalid: start_at must be less than or equal to end_at.")]
    InvalidDateRange,

    #[msg("Project configuration PDA has already been initialized.")]
    AlreadyInitialized,

    #[msg("Invalid Squads multisig account or program owner.")]
    InvalidMultisigAccount,
}
