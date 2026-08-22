//! Layer: Layer 4 — Infrastructure / Smart Contracts
//! Module: initialize_project_config instruction for Project Config Notary program
//!
//! What: Initializes on-chain ProjectConfigState PDA bound to a Metaplex collection.
//! How: Validates 3-Layer Squads Vault PDA derivation and enforces start_at <= end_at.

use anchor_lang::prelude::*;

use crate::errors::ProjectConfigError;
use crate::state::{ProjectConfigState, PROJECT_CONFIG_SEED, SQUADS_V4_PROGRAM_ID};

#[derive(Accounts)]
#[instruction(start_at: i64, end_at: i64, vault_index: u8)]
pub struct InitializeProjectConfig<'info> {
    /// Squads Vault PDA acting as the authorized creator via CPI
    pub authority_vault: Signer<'info>,

    /// Squads Multisig Account (must be owned by Squads v4 program)
    /// CHECK: Validated against SQUADS_V4_PROGRAM_ID owner check and PDA re-derivation
    pub multisig_account: UncheckedAccount<'info>,

    /// Metaplex Core Collection Pubkey associated with this project
    /// CHECK: Canonical pubkey used as seed for PDA derivation
    pub collection_address: UncheckedAccount<'info>,

    /// Project configuration account to initialize
    #[account(
        init,
        payer = payer,
        space = ProjectConfigState::LEN,
        seeds = [PROJECT_CONFIG_SEED, collection_address.key().as_ref()],
        bump
    )]
    pub project_config: Account<'info, ProjectConfigState>,

    /// Rent payer for the project_config account creation
    #[account(mut)]
    pub payer: Signer<'info>,

    /// System program for account allocation
    pub system_program: Program<'info, System>,
}

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

/// Initializes a new ProjectConfig PDA bound to a specific NFT collection.
///
/// Step-by-Step Logic:
/// // Step 1: Validate date range invariant (start_at <= end_at).
/// // Step 2: Validate that multisig_account is owned by Squads v4 program ID.
/// // Step 3: Re-derive expected Squads Vault PDA and assert authority_vault matches.
/// // Step 4: Populate ProjectConfigState fields and record bump seed.
/// // Step 5: Emit ProjectConfigInitialized event.
pub fn handler(
    ctx: Context<InitializeProjectConfig>,
    start_at: i64,
    end_at: i64,
    vault_index: u8,
) -> Result<()> {
    // Step 1: Validate date range
    require!(start_at <= end_at, ProjectConfigError::InvalidDateRange);

    // Step 2: Validate Squads Multisig Account Owner
    require_keys_eq!(
        *ctx.accounts.multisig_account.owner,
        SQUADS_V4_PROGRAM_ID,
        ProjectConfigError::InvalidMultisigAccount
    );

    // Step 3: Re-derive Squads Vault PDA [b"multisig", multisig_pda, b"vault", &[vault_index]]
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

    // Step 4: Populate state
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

    // Step 5: Emit audit event
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
