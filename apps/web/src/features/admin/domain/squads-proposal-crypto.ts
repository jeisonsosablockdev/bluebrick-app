/**
 * =========================================================================================
 * Layer 3: Domain Layer — Squads Proposal Cryptographic Sealing & Invariant Verification
 * Module: squads-proposal-crypto
 *
 * 🏛️ ARCHITECTURAL CONTEXT & CANONICAL STANDARD:
 * Aligns strictly with EPIC-015 SOLUTION-ARCHITECTURE.md and Solana Native Syscalls.
 * Uses Keccak-256 (`solana_program::keccak::hashv` / `@noble/hashes/sha3`) for pure off-chain
 * proposal sealing and on-chain governance verification.
 *
 * 🛡️ SECURITY INVARIANTS:
 * 1. Determinism: Hash computation is strictly deterministic and idempotent.
 * 2. Zero-Trust Tampering Detection: Any mutation to collection, dates, justification,
 *    or nonce results in an avalanche mismatch, invalidating the proposal execution.
 * 3. Pure Functional Domain: Zero React, zero UI, zero DB/RPC network dependencies.
 *
 * @spec BRI-8 (SPEC-10) / EPIC-015 SOLUTION-ARCHITECTURE
 * =========================================================================================
 */

import { keccak_256 } from "@noble/hashes/sha3";
import { bytesToHex } from "@noble/hashes/utils";

/**
 * Payload interface required to compute the deterministic Keccak-256 proposal seal.
 */
export type ProposalSealPayload = {
  /** Canonical Solana Metaplex Core collection address (Base58) */
  collectionAddress: string;
  /** ISO 8601 string representation of the proposed start date */
  proposedStartAt: string;
  /** ISO 8601 string representation of the proposed end date */
  proposedEndAt: string;
  /** Administrative justification rationale */
  justification: string;
  /** Cryptographic unique nonce ensuring proposal unicity */
  nonce: string;
};

/**
 * Verification result emitted after comparing candidate payload against expected hash.
 */
export type ProposalIntegrityResult = {
  /** True if computed hash matches expected hash */
  isValid: boolean;
  /** Computed Keccak-256 hex digest */
  computedHash: string;
  /** Expected Keccak-256 hex digest provided for comparison */
  expectedHash: string;
  /** Specific failure reason if invalid, null otherwise */
  reason: "HASH_MISMATCH_TAMPERING_DETECTED" | null;
};

/**
 * Computes a deterministic, lowercase 64-character hex Keccak-256 hash from proposal payload parameters.
 *
 * Step-by-Step Logic:
 * // Step 1: Normalize all fields to canonical strings.
 * // Step 2: Assemble canonical pre-image buffer with deterministic delimiters.
 * // Step 3: Compute Keccak-256 digest and return hex string.
 *
 * @param payload - Raw proposal seal payload
 * @returns 64-character lowercase hex Keccak-256 digest
 */
export function computeProposalPayloadHash(payload: ProposalSealPayload): string {
  // Step 1: Normalize inputs to prevent formatting discrepancies
  const canonicalCollection = payload.collectionAddress.trim();
  const canonicalStart = new Date(payload.proposedStartAt).toISOString();
  const canonicalEnd = new Date(payload.proposedEndAt).toISOString();
  const canonicalJustification = payload.justification.trim();
  const canonicalNonce = payload.nonce.trim();

  // Step 2: Build deterministic pre-image
  const preImage = [
    "BRIDS_PROPOSAL_SEAL_V1",
    canonicalCollection,
    canonicalStart,
    canonicalEnd,
    canonicalJustification,
    canonicalNonce
  ].join("|");

  // Step 3: Generate Keccak-256 hash via @noble/hashes/sha3
  const buffer = new TextEncoder().encode(preImage);
  return bytesToHex(keccak_256(buffer)).toLowerCase();
}

/**
 * Verifies that a candidate proposal payload matches its declared cryptographic hash.
 *
 * Step-by-Step Logic:
 * // Step 1: Compute candidate SHA-256 hash from supplied payload.
 * // Step 2: Assert constant-time / string equivalence with expected hash.
 * // Step 3: Return typed ProposalIntegrityResult.
 *
 * @param payload - Candidate proposal payload
 * @param expectedHash - Expected 64-character SHA-256 hash
 * @returns ProposalIntegrityResult
 */
export function verifyProposalIntegrity(
  payload: ProposalSealPayload,
  expectedHash: string
): ProposalIntegrityResult {
  // Step 1: Recompute candidate hash
  const computedHash = computeProposalPayloadHash(payload);

  // Step 2: Check match
  const isValid = computedHash.toLowerCase() === expectedHash.toLowerCase();

  // Step 3: Return result
  return {
    isValid,
    computedHash,
    expectedHash,
    reason: isValid ? null : "HASH_MISMATCH_TAMPERING_DETECTED"
  };
}

/**
 * Formats canonical Solana Memo Program v2 instruction string for multi-sig governance votes.
 *
 * @param params - Vote memo parameters
 * @returns Canonical Solana Memo string under 250 bytes
 */
export function formatOnChainVoteMemo(params: {
  proposalId: string;
  newStartAt: string;
  newEndAt: string;
  proposalHash: string;
  signerWallet: string;
  timestamp: number;
}): string {
  const { proposalId, newStartAt, newEndAt, proposalHash, signerWallet, timestamp } = params;
  const startIso = new Date(newStartAt).toISOString().slice(0, 10);
  const endIso = new Date(newEndAt).toISOString().slice(0, 10);

  return `BRIDS_SQUADS_VOTE:${proposalId}:${startIso}_${endIso}:${proposalHash}:SIGNER:${signerWallet}:${timestamp}`;
}