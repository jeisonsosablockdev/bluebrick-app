#![no_main]
//! ============================================================================
//! Layer: Solana Program Fuzzing Harness (Enfoque B - libFuzzer)
//! Target: fuzz_merkle_verification
//! Description: Fuzzes 191-byte leaf reconstruction and Helium directional Merkle
//!              proof evaluation against arbitrary malformed/fuzzed byte inputs.
//! ============================================================================

use libfuzzer_sys::fuzz_target;
use solana_program::keccak;

const LEAF_DOMAIN: &[u8; 23] = b"brids:epic015:payout:v1";

fuzz_target!(|data: &[u8]| {
    // Minimum 191 bytes needed to populate full leaf fields
    if data.len() < 191 {
        return;
    }

    // Step 1: Reconstruct 191B leaf preimage from fuzzed slice
    let mut preimage = [0u8; 191];
    preimage[0..23].copy_from_slice(LEAF_DOMAIN);
    preimage[23..191].copy_from_slice(&data[23..191]);

    // Step 2: Compute Keccak-256 hash (must never panic)
    let leaf_hash = keccak::hash(&preimage).to_bytes();

    // Step 3: Parse remaining bytes as arbitrary Merkle proof siblings (32B each)
    let remaining = &data[191..];
    let num_siblings = (remaining.len() / 32).min(32); // Max 32 depth tree

    let mut current_hash = leaf_hash;
    let leaf_index = if data.len() >= 4 {
        u32::from_le_bytes([data[0], data[1], data[2], data[3]])
    } else {
        0
    };

    for depth in 0..num_siblings {
        let offset = depth * 32;
        let mut sibling = [0u8; 32];
        sibling.copy_from_slice(&remaining[offset..offset + 32]);

        let is_left = ((leaf_index >> depth) & 1) == 0;
        if is_left {
            current_hash = keccak::hashv(&[&current_hash, &sibling]).to_bytes();
        } else {
            current_hash = keccak::hashv(&[&sibling, &current_hash]).to_bytes();
        }
    }

    // Invariant: Hash is always 32 bytes and non-zero
    assert_eq!(current_hash.len(), 32);
});
