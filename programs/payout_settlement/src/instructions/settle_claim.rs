//! ============================================================================
//! Layer: Solana Program Instruction (Anchor On-Chain Runtime)
//! Instruction: settle_claim
//! Description: Liquidates an individual payout leaf by verifying the Merkle proof,
//!              recording a ClaimReceipt PDA (double-claim prevention), and executing
//!              an SPL Token transfer from the Escrow ATA to the recipient ATA.
//! ============================================================================

use anchor_lang::prelude::*;
use anchor_lang::solana_program::keccak;
use anchor_spl::token::{self, Token, TokenAccount, Mint, Transfer};

use crate::state::{PayoutRun, ClaimReceipt, PayoutRunStatus};
use crate::errors::PayoutSettlementError;

/// Canonical 23-byte ASCII domain separator for individual payout leaves.
pub const LEAF_DOMAIN: &[u8; 23] = b"brids:epic015:payout:v1";

#[derive(Accounts)]
#[instruction(claim_id: [u8; 16])]
pub struct SettleClaim<'info> {
    #[account(
        mut,
        seeds = [b"payout_run", payout_run.run_id.as_ref()],
        bump = payout_run.bump,
        constraint = payout_run.status == PayoutRunStatus::Active as u8 @ PayoutSettlementError::RunNotInDraftState
    )]
    pub payout_run: Account<'info, PayoutRun>,

    #[account(
        init,
        payer = payer,
        space = ClaimReceipt::LEN,
        seeds = [b"claim_receipt", payout_run.run_id.as_ref(), claim_id.as_ref()],
        bump
    )]
    pub claim_receipt: Account<'info, ClaimReceipt>,

    #[account(
        mut,
        constraint = escrow_ata.key() == payout_run.escrow_ata,
        constraint = escrow_ata.owner == payout_run.key()
    )]
    pub escrow_ata: Account<'info, TokenAccount>,

    /// The recipient user wallet (must match leaf preimage)
    /// CHECK: Validated against leaf preimage
    pub recipient_wallet: UncheckedAccount<'info>,

    /// The recipient user ATA (must match leaf preimage and mint)
    #[account(
        mut,
        constraint = recipient_ata.owner == recipient_wallet.key(),
        constraint = recipient_ata.mint == mint.key()
    )]
    pub recipient_ata: Account<'info, TokenAccount>,

    #[account(
        constraint = mint.key() == payout_run.mint
    )]
    pub mint: Account<'info, Mint>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn settle_claim(
    ctx: Context<SettleClaim>,
    claim_id: [u8; 16],
    amount_minor: u64,
    leaf_index: u32,
    merkle_proof: Vec<[u8; 32]>,
) -> Result<()> {
    // Step 1: Reconstruct the exact 191-byte canonical leaf preimage
    let mut preimage = [0u8; 191];
    preimage[0..23].copy_from_slice(LEAF_DOMAIN);
    preimage[23..39].copy_from_slice(&ctx.accounts.payout_run.run_id);
    preimage[39..55].copy_from_slice(&claim_id);
    preimage[55..87].copy_from_slice(ctx.accounts.mint.key().as_ref());
    preimage[87..119].copy_from_slice(ctx.accounts.token_program.key().as_ref());
    preimage[119..151].copy_from_slice(ctx.accounts.recipient_wallet.key().as_ref());
    preimage[151..183].copy_from_slice(ctx.accounts.recipient_ata.key().as_ref());
    preimage[183..191].copy_from_slice(&amount_minor.to_le_bytes());

    // Step 2: Compute Keccak-256 hash of the leaf
    let leaf_hash = keccak::hash(&preimage).to_bytes();

    // Step 3: Verify Helium directional Merkle proof against committed root
    let mut current_hash = leaf_hash;
    for (depth, sibling) in merkle_proof.iter().enumerate() {
        let is_left = ((leaf_index >> depth) & 1) == 0;
        if is_left {
            current_hash = keccak::hashv(&[&current_hash, sibling]).to_bytes();
        } else {
            current_hash = keccak::hashv(&[sibling, &current_hash]).to_bytes();
        }
    }

    require!(
        current_hash == ctx.accounts.payout_run.merkle_root,
        PayoutSettlementError::InvalidMerkleProof
    );

    // Step 4: Record settlement in ClaimReceipt PDA state
    let receipt = &mut ctx.accounts.claim_receipt;
    receipt.run_id = ctx.accounts.payout_run.run_id;
    receipt.claim_id = claim_id;
    receipt.settled_at = Clock::get()?.unix_timestamp;
    receipt.bump = ctx.bumps.claim_receipt;

    // Step 5: Transfer tokens from Escrow ATA to Recipient ATA signed by PayoutRun PDA
    let run_id = ctx.accounts.payout_run.run_id;
    let bump = ctx.accounts.payout_run.bump;
    let signer_seeds: &[&[&[u8]]] = &[&[b"payout_run", run_id.as_ref(), &[bump]]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.escrow_ata.to_account_info(),
        to: ctx.accounts.recipient_ata.to_account_info(),
        authority: ctx.accounts.payout_run.to_account_info(),
    };
    let cpi_ctx = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        cpi_accounts,
        signer_seeds,
    );
    token::transfer(cpi_ctx, amount_minor)?;

    Ok(())
}
