use anchor_lang::prelude::*;

pub mod state;
pub mod errors;
pub mod instructions;

use instructions::*;

declare_id!("J2xccRtuG43drESLYznHhLhQkLTdfepcKYbiQ9BsJVaf");

#[program]
pub mod payout_settlement {
    use super::*;

    /**
     * Initializes the TreasuryPolicy PDA binding a Squads v4 Multisig Vault.
     * Enforces 3-layer Squads Vault authentication.
     */
    pub fn initialize_policy(
        ctx: Context<InitializePolicy>,
        vault_index: u8,
        payout_attester_a: Pubkey,
        payout_attester_b: Pubkey,
        emergency_pause_authority: Pubkey,
    ) -> Result<()> {
        instructions::initialize_policy::initialize_policy(
            ctx,
            vault_index,
            payout_attester_a,
            payout_attester_b,
            emergency_pause_authority,
        )
    }

    /**
     * Updates attesters or emergency pause authority for the TreasuryPolicy.
     * Only executable by the authorized Squads Vault PDA.
     */
    pub fn update_policy(
        ctx: Context<UpdatePolicy>,
        new_payout_attester_a: Option<Pubkey>,
        new_payout_attester_b: Option<Pubkey>,
        new_emergency_pause_authority: Option<Pubkey>,
    ) -> Result<()> {
        instructions::update_policy::update_policy(
            ctx,
            new_payout_attester_a,
            new_payout_attester_b,
            new_emergency_pause_authority,
        )
    }

    /**
     * Initializes a PayoutRun and creates its Escrow ATA in Draft state.
     */
    pub fn initialize_run(
        ctx: Context<InitializeRun>,
        run_id: [u8; 16],
        merkle_root: [u8; 32],
        total_amount_minor: u64,
        item_count: u32,
        rules_version: u16,
        snapshot_version: u32,
    ) -> Result<()> {
        instructions::initialize_run::initialize_run(
            ctx,
            run_id,
            merkle_root,
            total_amount_minor,
            item_count,
            rules_version,
            snapshot_version,
        )
    }

    /**
     * Seals a PayoutRun after verifying that Escrow ATA balance exactly equals total_amount_minor.
     * Transitions status to Active.
     */
    pub fn seal_run(ctx: Context<SealRun>) -> Result<()> {
        instructions::seal_run::seal_run(ctx)
    }
}
