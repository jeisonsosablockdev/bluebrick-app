//! Layer: Layer 4 — Infrastructure / Smart Contracts
//! Program: project_config_notary
//! Description: Squads v4 Authorized On-Chain Project Configuration & Dates Notary Program
//!
//! Security Invariants:
//! - Canonical PDA derivation: `[b"project_config", collection_address]`.
//! - Strict 3-Layer Squads Vault PDA verification for all write operations.
//! - Enforces `start_at <= end_at` date invariant.

use anchor_lang::prelude::*;

pub mod errors;
pub mod instructions;
pub mod state;

use instructions::*;

declare_id!("HLp7YXKZZ8uPuzwN3CtuDxtgYoWhc5Fb1FHj5bHEe9zE");

#[program]
pub mod project_config_notary {
    use super::*;

    /// Initializes a new ProjectConfig PDA bound to a Metaplex Core collection
    pub fn initialize_project_config(
        ctx: Context<InitializeProjectConfig>,
        start_at: i64,
        end_at: i64,
        vault_index: u8,
    ) -> Result<()> {
        instructions::initialize::handler(ctx, start_at, end_at, vault_index)
    }

    /// Updates notarized start and end dates under Squads Vault authority
    pub fn update_project_dates(
        ctx: Context<UpdateProjectDates>,
        new_start_at: i64,
        new_end_at: i64,
    ) -> Result<()> {
        instructions::update_dates::handler(ctx, new_start_at, new_end_at)
    }

    /// Health ping returning program version
    pub fn ping(_ctx: Context<PingContext>) -> Result<()> {
        msg!("project_config_notary::ping ok");
        Ok(())
    }
}

#[derive(Accounts)]
pub struct PingContext<'info> {
    pub signer: Signer<'info>,
}
