//! =========================================================================================
//! Layer: Solana Program Instructions (Anchor On-Chain Handler)
//! Program: payout_settlement
//! Instruction: update_project_dates
//!
//! 🏛️ ARCHITECTURAL INTENT:
//! Safely updates start and end dates of a tokenized project on its canonical ProjectConfig PDA.
//!
//! 🛡️ SECURITY INVARIANTS:
//! 1. 3-Layer Squads Vault Authentication: authority_vault must sign via CPI from Squads v4.
//! 2. has_one validations: ensures authority_vault, multisig, and collection_address match state.
//! 3. Runtime re-derivation against SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf.
//! 4. Temporal Range Invariant: new_start_at <= new_end_at.
//! =========================================================================================

use anchor_lang::prelude::*;

use crate::errors::PayoutSettlementError;
use crate::state::{ProjectConfigState, PROJECT_CONFIG_SEED, SQUADS_V4_PROGRAM_ID};

/// Account constraints for updating notarized project dates
#[derive(Accounts)]
pub struct UpdateProjectDates<'info> {
    /// 🏛️ Squads v4 Vault PDA executing update via CPI (must be Signer)
    pub authority_vault: Signer<'info>,

    /// 🤝 Squads v4 Multisig Account
    /// CHECK: Validated against state.multisig and canonical Squads v4 program ownership.
    pub multisig: UncheckedAccount<'info>,

    /// 🎨 Metaplex Core Collection public address
    /// CHECK: Validated against state.collection_address constraint.
    pub collection_address: UncheckedAccount<'info>,

    /// 📝 ProjectConfig PDA to update
    #[account(
        mut,
        seeds = [PROJECT_CONFIG_SEED, collection_address.key().as_ref()],
        bump = project_config.bump,
        has_one = authority_vault @ PayoutSettlementError::UnauthorizedAuthority,
        has_one = multisig @ PayoutSettlementError::InvalidMultisigAccount,
        has_one = collection_address @ PayoutSettlementError::UnauthorizedAuthority
    )]
    pub project_config: Account<'info, ProjectConfigState>,
}

/// Audit event emitted upon updating project dates
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

/// Instruction handler for update_project_dates
pub fn update_project_dates(
    ctx: Context<UpdateProjectDates>,
    new_start_at: i64,
    new_end_at: i64,
) -> Result<()> {
    // Step 1: Validate date range invariant (new_start_at <= new_end_at)
    require!(new_start_at <= new_end_at, PayoutSettlementError::InvalidDateRange);

    // Step 2: Validate multisig ownership by official Squads v4 program
    require_keys_eq!(
        *ctx.accounts.multisig.owner,
        SQUADS_V4_PROGRAM_ID,
        PayoutSettlementError::InvalidMultisigAccount
    );

    // Step 3: Re-derive expected Squads v4 Vault PDA and verify match
    let config = &mut ctx.accounts.project_config;
    let (expected_vault_pda, _) = Pubkey::find_program_address(
        &[
            b"multisig",
            ctx.accounts.multisig.key().as_ref(),
            b"vault",
            &[config.vault_index],
        ],
        &SQUADS_V4_PROGRAM_ID,
    );


    require_keys_eq!(
        ctx.accounts.authority_vault.key(),
        expected_vault_pda,
        PayoutSettlementError::InvalidSquadsVaultSigner
    );

    // Step 4: Record previous values, update dates, increment version
    let clock = Clock::get()?;
    let old_start = config.start_at;
    let old_end = config.end_at;

    config.start_at = new_start_at;
    config.end_at = new_end_at;
    config.version = config.version.saturating_add(1);
    config.updated_at = clock.unix_timestamp;

    // Step 5: Emit audit event
    emit!(ProjectDatesUpdated {
        collection_address: config.collection_address,
        authority_vault: config.authority_vault,
        old_start_at: old_start,
        old_end_at: old_end,
        new_start_at: new_start_at,
        new_end_at: new_end_at,
        version: config.version,
        timestamp: clock.unix_timestamp,
    });

    msg!(
        "Project dates updated for collection {}: new version is {}",
        config.collection_address,
        config.version
    );

    Ok(())
}
