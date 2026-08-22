//! Layer: Layer 4 — Infrastructure / Smart Contracts
//! Module: State definitions and account layout for Project Config Notary program
//!
//! What: Declares ProjectConfigState account storage, size constants, and PDA seeds.
//! How: Uses Anchor account macro with explicit 134-byte account layout.

use anchor_lang::prelude::*;

/// Canonical seed for ProjectConfig PDA derivation: `[b"project_config", collection_address]`
pub const PROJECT_CONFIG_SEED: &[u8] = b"project_config";

/// Canonical Squads v4 Program ID on Solana Devnet and Mainnet-Beta
pub const SQUADS_V4_PROGRAM_ID: Pubkey = pubkey!("SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf");

/// Account representing the on-chain notarized configuration for a real-world asset project.
///
/// Account Storage Layout:
/// - Discriminator:       8 bytes
/// - authority_vault:    32 bytes (Squads Vault PDA authorized to modify config)
/// - multisig:           32 bytes (Squads Multisig PDA)
/// - vault_index:         1 byte  (Squads Vault index, default 0)
/// - collection_address: 32 bytes (Metaplex Core Collection Pubkey)
/// - start_at:            8 bytes (Unix timestamp for project active start)
/// - end_at:              8 bytes (Unix timestamp for project active completion)
/// - version:             4 bytes (Configuration version counter)
/// - updated_at:          8 bytes (Unix timestamp of last authorized update)
/// - bump:                1 byte  (PDA bump seed)
/// Total Size: 134 Bytes
#[account]
#[derive(Default)]
pub struct ProjectConfigState {
    /// Squads Vault PDA authorized to perform configuration updates via CPI
    pub authority_vault: Pubkey,
    /// Parent Squads Multisig PDA
    pub multisig: Pubkey,
    /// Squads Vault index associated with this authority
    pub vault_index: u8,
    /// Metaplex Core Collection Address of the tokenized asset
    pub collection_address: Pubkey,
    /// Unix timestamp when the project yield/operations period starts
    pub start_at: i64,
    /// Unix timestamp when the project yield/operations period ends
    pub end_at: i64,
    /// Incremental version counter tracking updates
    pub version: u32,
    /// Unix timestamp of the most recent on-chain modification
    pub updated_at: i64,
    /// PDA bump seed
    pub bump: u8,
}

impl ProjectConfigState {
    /// Total storage size in bytes including the 8-byte Anchor account discriminator
    pub const LEN: usize = 8 + 32 + 32 + 1 + 32 + 8 + 8 + 4 + 8 + 1; // 134 bytes
}
