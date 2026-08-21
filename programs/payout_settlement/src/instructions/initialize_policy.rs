use anchor_lang::prelude::*;
use crate::state::{TreasuryPolicy, SQUADS_V4_PROGRAM_ID};
use crate::errors::PayoutSettlementError;

#[derive(Accounts)]
#[instruction(vault_index: u8)]
pub struct InitializePolicy<'info> {
    #[account(
        init,
        payer = payer,
        space = TreasuryPolicy::LEN,
        seeds = [b"treasury_policy", multisig.key().as_ref()],
        bump
    )]
    pub treasury_policy: Account<'info, TreasuryPolicy>,

    /// CHECK: Validated against Squads v4 program owner
    #[account(
        constraint = multisig.owner == &SQUADS_V4_PROGRAM_ID @ PayoutSettlementError::InvalidMultisigOwner
    )]
    pub multisig: UncheckedAccount<'info>,

    /// The Squads Vault PDA signing the transaction
    #[account(
        signer,
        constraint = authority_vault.key() == Pubkey::find_program_address(
            &[b"multisig", multisig.key().as_ref(), b"vault", &[vault_index]],
            &SQUADS_V4_PROGRAM_ID
        ).0 @ PayoutSettlementError::UnauthorizedVaultPda
    )]
    pub authority_vault: Signer<'info>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_policy(
    ctx: Context<InitializePolicy>,
    vault_index: u8,
    payout_attester_a: Pubkey,
    payout_attester_b: Pubkey,
    emergency_pause_authority: Pubkey,
) -> Result<()> {
    require_keys_neq!(
        payout_attester_a,
        payout_attester_b,
        PayoutSettlementError::IdenticalAttestersForbidden
    );

    let policy = &mut ctx.accounts.treasury_policy;
    policy.multisig_pda = ctx.accounts.multisig.key();
    policy.vault_index = vault_index;
    policy.authority_vault = ctx.accounts.authority_vault.key();
    policy.policy_version = 1;
    policy.payout_attester_a = payout_attester_a;
    policy.payout_attester_b = payout_attester_b;
    policy.emergency_pause_authority = emergency_pause_authority;
    policy.emergency_pause_key_version = 1;
    policy.pause_nonce = 0;
    policy.bump = ctx.bumps.treasury_policy;

    Ok(())
}
