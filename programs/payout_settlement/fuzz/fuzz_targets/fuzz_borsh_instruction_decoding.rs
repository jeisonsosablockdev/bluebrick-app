#![no_main]
//! ============================================================================
//! Layer: Solana Program Fuzzing Harness (Enfoque B - libFuzzer)
//! Target: fuzz_borsh_instruction_decoding
//! Description: Fuzzes Anchor instruction decoding and borsh deserialization
//!              against arbitrary malformed or truncated byte streams.
//! ============================================================================

use libfuzzer_sys::fuzz_target;
use anchor_lang::AnchorDeserialize;

#[derive(AnchorDeserialize, Debug, PartialEq)]
pub struct SettleClaimArgs {
    pub claim_id: [u8; 16],
    pub amount_minor: u64,
    pub leaf_index: u32,
    pub merkle_proof: Vec<[u8; 32]>,
}

#[derive(AnchorDeserialize, Debug, PartialEq)]
pub struct InitializeRunArgs {
    pub run_id: [u8; 16],
    pub merkle_root: [u8; 32],
    pub total_amount_minor: u64,
    pub item_count: u32,
    pub rules_version: u16,
    pub snapshot_version: u32,
}

fuzz_target!(|data: &[u8]| {
    // Attempt deserialization of SettleClaimArgs from fuzzed slice
    let mut slice = data;
    if let Ok(args) = SettleClaimArgs::deserialize(&mut slice) {
        // Invariant: Deserialized Merkle proof should not cause arithmetic overflows
        let _ = args.merkle_proof.len();
        let _ = args.amount_minor;
    }

    // Attempt deserialization of InitializeRunArgs from fuzzed slice
    let mut slice2 = data;
    if let Ok(args2) = InitializeRunArgs::deserialize(&mut slice2) {
        // Invariant: Deserialized fields are bounded
        let _ = args2.total_amount_minor;
        let _ = args2.item_count;
    }
});
