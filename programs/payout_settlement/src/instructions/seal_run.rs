use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

use crate::state::{TreasuryPolicy, PayoutRun, PayoutRunStatus};
use crate::errors::PayoutSettlementError;

#[derive(Accounts)]
pub struct SealRun<'info> {
    #[account(
        mut,
        seeds = [b"payout_run", payout_run.run_id.as_ref()],
        bump = payout_run.bump,
        has_one = treasury_policy
    )]
    pub payout_run: Account<'info, PayoutRun>,

    #[account(
        seeds = [b"treasury_policy", treasury_policy.multisig_pda.as_ref()],
        bump = treasury_policy.bump,
        has_one = authority_vault @ PayoutSettlementError::UnauthorizedVaultPda
    )]
    pub treasury_policy: Account<'info, TreasuryPolicy>,

    pub authority_vault: Signer<'info>,

    #[account(
        constraint = escrow_ata.key() == payout_run.escrow_ata,
        constraint = escrow_ata.owner == payout_run.key(),
        constraint = escrow_ata.amount == payout_run.total_amount_minor @ PayoutSettlementError::EscrowBalanceMismatch
    )]
    pub escrow_ata: Account<'info, TokenAccount>,
}

pub fn seal_run(ctx: Context<SealRun>) -> Result<()> {
    let run = &mut ctx.accounts.payout_run;

    // Step 1: Ensure run is currently in Draft state
    require_eq!(
        run.status,
        PayoutRunStatus::Draft as u8,
        PayoutSettlementError::RunNotInDraftState
    );

    // Step 2: Transition to Active status and record sealed_at timestamp
    run.status = PayoutRunStatus::Active as u8;
    run.sealed_at = Clock::get()?.unix_timestamp;

    Ok(())
}
