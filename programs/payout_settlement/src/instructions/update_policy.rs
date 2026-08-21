//! ============================================================================
//! Layer: Solana Program Instruction (Anchor Instruction Handler)
//! Instruction: update_policy
//! Description: Updates attesters and emergency pause authority for TreasuryPolicy
//! ============================================================================

use anchor_lang::prelude::*;
use crate::state::TreasuryPolicy;
use crate::errors::PayoutSettlementError;

#[derive(Accounts)]
pub struct UpdatePolicy<'info> {
    #[account(
        mut,
        seeds = [b"treasury_policy", treasury_policy.multisig_pda.as_ref()],
        bump = treasury_policy.bump,
        has_one = authority_vault @ PayoutSettlementError::UnauthorizedVaultPda
    )]
    pub treasury_policy: Account<'info, TreasuryPolicy>,

    pub authority_vault: Signer<'info>,
}

pub fn update_policy(
    ctx: Context<UpdatePolicy>,
    new_payout_attester_a: Option<Pubkey>,
    new_payout_attester_b: Option<Pubkey>,
    new_emergency_pause_authority: Option<Pubkey>,
) -> Result<()> {
    let policy = &mut ctx.accounts.treasury_policy;

    // Step 1: Resolve new or retained attesters
    let attester_a = new_payout_attester_a.unwrap_or(policy.payout_attester_a);
    let attester_b = new_payout_attester_b.unwrap_or(policy.payout_attester_b);

    // Step 2: Invariant Check — Sybil Attack Prevention (Attester A != Attester B)
    require_keys_neq!(
        attester_a,
        attester_b,
        PayoutSettlementError::IdenticalAttestersForbidden
    );

    policy.payout_attester_a = attester_a;
    policy.payout_attester_b = attester_b;

    // Step 3: Handle emergency pause authority rotation and version increment
    if let Some(new_pause_auth) = new_emergency_pause_authority {
        policy.emergency_pause_authority = new_pause_auth;
        policy.emergency_pause_key_version = policy.emergency_pause_key_version.saturating_add(1);
    }

    // Step 4: Increment overall policy version
    policy.policy_version = policy.policy_version.saturating_add(1);

    // Step 5: Successfully conclude instruction
    Ok(())
}

