//! =========================================================================================
//! Layer: Solana Program Instructions (Anchor On-Chain Handler)
//! Program: payout_settlement
//! Instruction: initialize_project_config
//!
//! 🏛️ ARCHITECTURAL INTENT:
//! Initializes the canonical ProjectConfig PDA for a tokenized Metaplex Core collection.
//! Binds the operational dates and Squads v4 multisig authority on-chain.
//!
//! 🛡️ SECURITY INVARIANTS:
//! 1. 3-Layer Squads Vault Authentication: authority_vault must sign via CPI from Squads v4.
//! 2. Multisig Program Ownership: multisig_account must be owned by SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf.
//! 3. Canonical PDA derivation: seeds = [b"project_config", collection_address].
//! 4. Temporal Range Invariant: start_at <= end_at.
//! =========================================================================================

use anchor_lang::prelude::*;

use crate::errors::PayoutSettlementError;
use crate::state::{ProjectConfigState, PROJECT_CONFIG_SEED, SQUADS_V4_PROGRAM_ID};

/// Account constraints for ProjectConfig PDA initialization
#[derive(Accounts)]
#[instruction(start_at: i64, end_at: i64, vault_index: u8)]
pub struct InitializeProjectConfig<'info> {
    /// 🏛️ Squads v4 Vault PDA acting as creator authority via CPI
    pub authority_vault: Signer<'info>,

    /// 🤝 Squads v4 Multisig Account
    /// CHECK: Validated in handler against canonical Squads v4 program ownership and Vault PDA re-derivation.
    pub multisig_account: UncheckedAccount<'info>,

    /// 🎨 Metaplex Core Collection address for the project
    /// CHECK: Canonical pubkey used as deterministic seed for PDA derivation.
    pub collection_address: UncheckedAccount<'info>,

    /// 📝 ProjectConfig PDA account to allocate on Solana (134 bytes)
    #[account(
        init,
        payer = payer,
        space = ProjectConfigState::LEN,
        seeds = [PROJECT_CONFIG_SEED, collection_address.key().as_ref()],
        bump
    )]
    pub project_config: Account<'info, ProjectConfigState>,

    /// 💳 SOL Rent payer for account allocation
    #[account(mut)]
    pub payer: Signer<'info>,

    /// ⚙️ Solana System Program
    pub system_program: Program<'info, System>,
}

/// Audit event emitted upon ProjectConfig PDA initialization
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

/// Instruction handler for initialize_project_config
pub fn initialize_project_config(
    ctx: Context<InitializeProjectConfig>,
    start_at: i64,
    end_at: i64,
    vault_index: u8,
) -> Result<()> {
    // Step 1: Validate date range invariant (start_at <= end_at)
    require!(start_at <= end_at, PayoutSettlementError::InvalidDateRange);

    // Step 2: Validate that multisig_account is owned by official Squads v4 program ID
    require_keys_eq!(
        *ctx.accounts.multisig_account.owner,
        SQUADS_V4_PROGRAM_ID,
        PayoutSettlementError::InvalidMultisigAccount
    );

    // Step 3: Re-derive expected Squads v4 Vault PDA and verify match against authority_vault
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
        PayoutSettlementError::InvalidSquadsVaultSigner
    );

    // Step 4: Populate ProjectConfigState on-chain fields
    let clock = Clock::get()?;
    let config = &mut ctx.accounts.project_config;

    config.authority_vault = ctx.accounts.authority_vault.key();
    config.multisig = ctx.accounts.multisig_account.key();
    config.vault_index = vault_index;
    config.collection_address = ctx.accounts.collection_address.key();
    config.start_at = start_at;
    config.end_at = end_at;
    config.version = 1;
    config.updated_at = clock.unix_timestamp;
    config.bump = ctx.bumps.project_config;

    // Step 5: Emit audit event
    emit!(ProjectConfigInitialized {
        collection_address: config.collection_address,
        authority_vault: config.authority_vault,
        multisig: config.multisig,
        vault_index: config.vault_index,
        start_at: config.start_at,
        end_at: config.end_at,
        version: config.version,
        timestamp: clock.unix_timestamp,
    });

    msg!(
        "ProjectConfig PDA initialized for collection: {} with version 1",
        config.collection_address
    );

    Ok(())
}
