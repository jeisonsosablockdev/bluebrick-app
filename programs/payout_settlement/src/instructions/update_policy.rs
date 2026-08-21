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

    let attester_a = new_payout_attester_a.unwrap_or(policy.payout_attester_a);
    let attester_b = new_payout_attester_b.unwrap_or(policy.payout_attester_b);

    require_keys_neq!(
        attester_a,
        attester_b,
        PayoutSettlementError::IdenticalAttestersForbidden
    );

    policy.payout_attester_a = attester_a;
    policy.payout_attester_b = attester_b;

    if let Some(new_pause_auth) = new_emergency_pause_authority {
        policy.emergency_pause_authority = new_pause_auth;
        policy.emergency_pause_key_version = policy.emergency_pause_key_version.saturating_add(1);
    }

    policy.policy_version = policy.policy_version.saturating_add(1);

    Ok(())
}
