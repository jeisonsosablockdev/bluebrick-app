//! ============================================================================
//! Layer: Solana Program Instruction (Anchor Instruction Handler)
//! Instruction: initialize_run
//! Description: Initializes PayoutRun state in Draft status and creates Escrow ATA
//! ============================================================================

use anchor_lang::prelude::*;
use anchor_lang::solana_program::sysvar::instructions as ix_sysvar;
use anchor_spl::token::{Token, TokenAccount, Mint};
use anchor_spl::associated_token::AssociatedToken;

use crate::state::{TreasuryPolicy, PayoutRun, PayoutRunStatus};
use crate::errors::PayoutSettlementError;

#[derive(Accounts)]
#[instruction(run_id: [u8; 16])]
pub struct InitializeRun<'info> {
    #[account(
        init,
        payer = payer,
        space = PayoutRun::LEN,
        seeds = [b"payout_run", run_id.as_ref()],
        bump
    )]
    pub payout_run: Account<'info, PayoutRun>,

    #[account(
        seeds = [b"treasury_policy", treasury_policy.multisig_pda.as_ref()],
        bump = treasury_policy.bump,
        has_one = authority_vault @ PayoutSettlementError::UnauthorizedVaultPda
    )]
    pub treasury_policy: Account<'info, TreasuryPolicy>,

    pub authority_vault: Signer<'info>,

    pub mint: Account<'info, Mint>,

    #[account(
        init,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payout_run
    )]
    pub escrow_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: Instructions sysvar for verifying dual Ed25519 program signatures
    #[account(address = ix_sysvar::ID)]
    pub instructions_sysvar: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn initialize_run(
    ctx: Context<InitializeRun>,
    run_id: [u8; 16],
    merkle_root: [u8; 32],
    total_amount_minor: u64,
    item_count: u32,
    rules_version: u16,
    snapshot_version: u32,
) -> Result<()> {
    // Step 1: Validate token program is canonical SPL Token (Tokenkeg...)
    require_keys_eq!(
        ctx.accounts.token_program.key(),
        anchor_spl::token::ID,
        PayoutSettlementError::UnsupportedTokenProgram
    );

    // Step 2: Initialize PayoutRun state in Draft status
    let run = &mut ctx.accounts.payout_run;
    run.treasury_policy = ctx.accounts.treasury_policy.key();
    run.run_id = run_id;
    run.merkle_root = merkle_root;
    run.total_amount_minor = total_amount_minor;
    run.item_count = item_count;
    run.rules_version = rules_version;
    run.mint = ctx.accounts.mint.key();
    run.token_program = ctx.accounts.token_program.key();
    run.escrow_ata = ctx.accounts.escrow_ata.key();
    run.snapshot_version = snapshot_version;
    run.status = PayoutRunStatus::Draft as u8;
    run.created_at = Clock::get()?.unix_timestamp;
    run.sealed_at = 0;
    run.bump = ctx.bumps.payout_run;

    Ok(())
}
