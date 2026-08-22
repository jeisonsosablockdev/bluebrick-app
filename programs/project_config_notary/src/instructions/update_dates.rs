//! Layer: Layer 4 — Infrastructure / Smart Contracts
//! Module: update_project_dates instruction for Project Config Notary program
//!
//! What: Updates notarized start and end dates for a project configuration.
//! How: Validates 3-Layer Squads Vault PDA signer check via CPI and enforces new_start_at <= new_end_at.

use anchor_lang::prelude::*;

use crate::errors::ProjectConfigError;
use crate::state::{ProjectConfigState, PROJECT_CONFIG_SEED, SQUADS_V4_PROGRAM_ID};

#[derive(Accounts)]
pub struct UpdateProjectDates<'info> {
    /// Squads Vault PDA executing this update instruction via CPI
    pub authority_vault: Signer<'info>,

    /// Squads Multisig Account matching configuration state
    /// CHECK: Validated against state.multisig and SQUADS_V4_PROGRAM_ID owner check
    pub multisig_account: UncheckedAccount<'info>,

    /// Metaplex Core Collection Pubkey associated with this project
    /// CHECK: Validated against state.collection_address
    pub collection_address: UncheckedAccount<'info>,

    /// Project configuration account to update
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

/// Updates start and end dates of a ProjectConfig PDA under strict Squads Vault authority.
///
/// Step-by-Step Logic:
/// // Step 1: Validate new date range invariant (new_start_at <= new_end_at).
/// // Step 2: Validate that multisig_account is owned by Squads v4 program ID.
/// // Step 3: Re-derive expected Squads Vault PDA and assert authority_vault matches.
/// // Step 4: Record previous values, apply updates, increment version, update timestamp.
/// // Step 5: Emit ProjectDatesUpdated event.
pub fn handler(
    ctx: Context<UpdateProjectDates>,
    new_start_at: i64,
    new_end_at: i64,
) -> Result<()> {
    // Step 1: Validate date range
    require!(new_start_at <= new_end_at, ProjectConfigError::InvalidDateRange);

    // Step 2: Validate Squads Multisig Account Owner
    require_keys_eq!(
        *ctx.accounts.multisig_account.owner,
        SQUADS_V4_PROGRAM_ID,
        ProjectConfigError::InvalidMultisigAccount
    );

    // Step 3: Re-derive Squads Vault PDA
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

    // Step 4: Apply date update and increment version
    let clock = Clock::get()?;
    let now = clock.unix_timestamp;

    let old_start_at = config.start_at;
    let old_end_at = config.end_at;

    config.start_at = new_start_at;
    config.end_at = new_end_at;
    config.version = config.version.saturating_add(1);
    config.updated_at = now;

    // Step 5: Emit audit event
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
