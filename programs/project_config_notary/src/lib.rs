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
pub mod state;

declare_id!("HLp7YXKZZ8uPuzwN3CtuDxtgYoWhc5Fb1FHj5bHEe9zE");

#[program]
pub mod project_config_notary {
    use super::*;

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
