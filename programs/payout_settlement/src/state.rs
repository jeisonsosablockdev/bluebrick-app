//! ============================================================================
//! Layer: Solana Program State (Anchor On-Chain State Definitions)
//! Program: payout_settlement
//! Description: Account structures, layouts and constants for Payout Settlement
//! ============================================================================

use anchor_lang::prelude::*;

/**
 * Canonical Squads Protocol v4 Program ID constant on Solana.
 */
pub const SQUADS_V4_PROGRAM_ID: Pubkey = pubkey!("SQDS4ep65T869zMMBKyuUq6aD6EgTu8psMjkvj52pCf");

/**
 * Status enumeration for a PayoutRun.
 */
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Default)]
#[repr(u8)]
pub enum PayoutRunStatus {
    #[default]
    Draft = 0,
    Active = 1,
    Paused = 2,
    Cancelled = 3,
    Completed = 4,
}

/**
 * Account: TreasuryPolicy
 * 
 * Root governance policy account binding a Squads v4 Multisig Vault to the settlement program.
 * Seeds: [b"treasury_policy", multisig_pda.as_ref()]
 */
#[account]
pub struct TreasuryPolicy {
  /// The Squads v4 Multisig State Account PDA
  pub multisig_pda: Pubkey,
  /// The Squads Vault index (typically 0)
  pub vault_index: u8,
  /// The Squads Vault PDA derived with [b"multisig", multisig_pda, b"vault", &[vault_index]]
  pub authority_vault: Pubkey,
  /// Policy increment version
  pub policy_version: u32,
  /// Public key of authorized off-chain Payout Attester A
  pub payout_attester_a: Pubkey,
  /// Public key of authorized off-chain Payout Attester B (must differ from A)
  pub payout_attester_b: Pubkey,
  /// Ed25519 public key authorized to perform emergency fast pause
  pub emergency_pause_authority: Pubkey,
  /// Version of the emergency pause key (increments on rotation)
  pub emergency_pause_key_version: u64,
  /// Sequential nonce tracking emergency pause triggers
  pub pause_nonce: u64,
  /// PDA bump seed
  pub bump: u8,
}

impl TreasuryPolicy {
    pub const LEN: usize = 8 // Discriminator
        + 32 // multisig_pda
        + 1  // vault_index
        + 32 // authority_vault
        + 4  // policy_version
        + 32 // payout_attester_a
        + 32 // payout_attester_b
        + 32 // emergency_pause_authority
        + 8  // emergency_pause_key_version
        + 8  // pause_nonce
        + 1; // bump
}

/**
 * Account: PayoutRun
 * 
 * Individual batch payout run containing committed Merkle root and escrow account reference.
 * Seeds: [b"payout_run", run_id.as_ref()]
 */
#[account]
pub struct PayoutRun {
  /// Reference to governing TreasuryPolicy PDA
  pub treasury_policy: Pubkey,
  /// Unique 16-byte Big-Endian UUID of the Payout Run
  pub run_id: [u8; 16],
  /// Committed 32-byte Keccak-256 Merkle root
  pub merkle_root: [u8; 32],
  /// Total aggregate amount to be disbursed in minor units
  pub total_amount_minor: u64,
  /// Total number of claims in the Merkle tree
  pub item_count: u32,
  /// Distribution rules engine version
  pub rules_version: u16,
  /// SPL Token Mint address (e.g. USDC)
  pub mint: Pubkey,
  /// SPL Token Program ID
  pub token_program: Pubkey,
  /// Escrow Associated Token Account owned by this PayoutRun PDA
  pub escrow_ata: Pubkey,
  /// Snapshot schema version (e.g. 1)
  pub snapshot_version: u32,
  /// Lifecycle status of the run
  pub status: u8,
  /// Creation timestamp (unix epoch)
  pub created_at: i64,
  /// Timestamp when run was sealed and activated (unix epoch)
  pub sealed_at: i64,
  /// PDA bump seed
  pub bump: u8,
}

impl PayoutRun {
    pub const LEN: usize = 8 // Discriminator
        + 32 // treasury_policy
        + 16 // run_id
        + 32 // merkle_root
        + 8  // total_amount_minor
        + 4  // item_count
        + 2  // rules_version
        + 32 // mint
        + 32 // token_program
        + 32 // escrow_ata
        + 4  // snapshot_version
        + 1  // status
        + 8  // created_at
        + 8  // sealed_at
        + 1; // bump
}

/**
 * Account: ClaimReceipt
 * 
 * Zero-data PDA indicating a specific leaf has already been settled (double claim prevention).
 * Seeds: [b"claim_receipt", run_id.as_ref(), claim_id.as_ref()]
 */
#[account]
pub struct ClaimReceipt {
  /// Run ID UUID bytes
  pub run_id: [u8; 16],
  /// Claim ID UUID bytes
  pub claim_id: [u8; 16],
  /// Settlement timestamp
  pub settled_at: i64,
  /// PDA bump seed
  pub bump: u8,
}

impl ClaimReceipt {
    pub const LEN: usize = 8 // Discriminator
        + 16 // run_id
        + 16 // claim_id
        + 8  // settled_at
        + 1; // bump
}
