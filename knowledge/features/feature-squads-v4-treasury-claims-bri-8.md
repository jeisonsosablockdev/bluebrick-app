---
id: FEAT-BRI-8-PROBLEM
title: "Feature: Squads v4 Treasury Claims & Delegated Allowance Settlement"
issue: BRI-8
epic: EPIC-015
story: STORY-015-01
owner: jaymusicmachine
status: implemented
created_at: 2026-08-20T00:00:00.000Z
updated_at: 2026-08-21T00:00:00.000Z
---

# Feature: Squads v4 Treasury Claims & Delegated Allowance Settlement (Problem Document)

## 1. Problem Statement & Business Context

In decentralized staking and yield distribution systems, protocol treasuries held in multisig vaults (Squads v4) must distribute USDC rewards across hundreds or thousands of staking participants without requiring a separate multisig transaction signature for every individual claimant.

Direct single-transfer multisig executions create several critical failure modes:
1. **Multisig Proposal Fatigue & Gas Exhaustion:** Requiring a 2-of-4 multisig quorum for every micro-payout is unscalable and economically prohibitive.
2. **Double-Claim & Reentrancy Risks:** Without deterministic on-chain receipts, off-chain crankers or compromised relayers could attempt replay attacks.
3. **Sybil & Collusion Vulnerabilities:** Off-chain calculation services could unilaterally forge allocation snapshots without independent cryptographic verification.

## 2. Target Requirements & Security Guardrails

* **Delegated Settlement Architecture:** Treasury executes a single setup proposal in Squads v4 that deposits the exact total into an on-chain `PayoutRun` Escrow PDA.
* **Double Attestation Requirement:** Every payout run requires two independent attestation signatures (Attester A and Attester B) over the canonical Merkle root and total amount.
* **Helium-Style Merkle Proofs:** On-chain verification of 191-byte leaf preimages using Keccak-256 and bitwise directional Merkle paths.
* **Atomic ClaimReceipt PDA:** Instant zero-balance initialization of `[b"claim_receipt", run_id, claim_id]` to enforce single-claim execution.
* **Emergency Circuit Breaker:** On-chain `pause_run` authority capable of halting settlement in abnormal network conditions.
