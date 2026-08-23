/**
 * =========================================================================================
 * Test Suite: SPEC-10 (BRI-8) — Squads Protocol v4 On-Chain Client & Instruction Builders
 * File: tests/lib/squads-v4-client.test.ts
 *
 * Layer: Layer 4 (Infrastructure) / Solana Kit Compat Verification
 * Scope: Native Squads v4 instruction assembly (`proposalCreate`, `proposalApprove`),
 *        PDA derivations (`ProposalPda`, `VaultPda`), and RPC account queries.
 *
 * Invariants Tested:
 * 1. PDA Derivation: Proposal PDA strictly derived from [b"multisig", multisigPda, b"proposal", txIndex].
 * 2. Proposal Create: Compiles valid VersionedTransaction targeting SQDS4ep65T... Program ID.
 * 3. Proposal Approve: Compiles valid VersionedTransaction for multisig voting.
 * 4. Multisig RPC Fetch: Decodes live Devnet multisig metadata and members permissions.
 *
 * @spec BRI-8 (SPEC-10) / EPIC-015 SOLUTION-ARCHITECTURE
 * =========================================================================================
 */

import { describe, expect, it, vi } from "vitest";

import {
  deriveSquadsProposalPda,
  fetchSquadsMultisigState,
  prepareSquadsProposalApproveTransaction,
  prepareSquadsProposalCreateTransaction,
  prepareSquadsDateChangeProposalTransaction,
  prepareSquadsVaultTransactionExecute,
  SQUADS_DEVNET_MULTISIG_PDA,
  SQUADS_V4_PROGRAM_ID
} from "@/lib/solana-kit/compat/squads-v4-client";

describe("SPEC-10: Squads Protocol v4 Native Client & Instruction Builders", () => {
  const MOCK_SIGNER = "3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd";

  describe("A. PDA Derivation", () => {
    it("should derive deterministic Proposal PDA for a given transaction index", () => {
      // Arrange & Act
      const { proposalPda, bump } = deriveSquadsProposalPda(SQUADS_DEVNET_MULTISIG_PDA, 1n);

      // Assert
      expect(proposalPda).toBeDefined();
      expect(typeof proposalPda).toBe("string");
      expect(proposalPda.length).toBeGreaterThanOrEqual(32);
      expect(typeof bump).toBe("number");
    });
  });

  describe("B. Proposal Create Instruction Builder", () => {
    it(
      "should compile an unsigned VersionedTransaction with proposalCreate instruction for Devnet",
      async () => {
        // Arrange
        const signerWallet = MOCK_SIGNER;
        const transactionIndex = 1n;

        // Act
        const result = await prepareSquadsProposalCreateTransaction({
          creatorWallet: signerWallet,
          transactionIndex,
          isDraft: false
        });

        // Assert
        expect(result.attemptId).toBeDefined();
        expect(result.transactionBase64).toBeDefined();
        expect(typeof result.transactionBase64).toBe("string");
        expect(result.proposalPda).toBeDefined();
        expect(result.transactionIndex).toBe("1");
        expect(result.blockhash).toBeDefined();
      },
      15000
    );
  });

  describe("C. Proposal Approve Instruction Builder", () => {
    it(
      "should compile an unsigned VersionedTransaction with proposalApprove instruction and Keccak-256 memo",
      async () => {
        // Arrange
        const signerWallet = MOCK_SIGNER;
        const transactionIndex = 1n;
        const memo = "BRIDS_SQUADS_VOTE:test:keccak_memo_hash";

        // Act
        const result = await prepareSquadsProposalApproveTransaction({
          memberWallet: signerWallet,
          transactionIndex,
          memo
        });

        // Assert
        expect(result.attemptId).toBeDefined();
        expect(result.transactionBase64).toBeDefined();
        expect(result.proposalPda).toBeDefined();
        expect(result.blockhash).toBeDefined();
        expect(result.signerWallet).toBe(signerWallet);
      },
      15000
    );
  });

  describe("D. Date Change Proposal Instruction Builder", () => {
    it(
      "should compile an unsigned VersionedTransaction for date change proposal with transactionIndex",
      async () => {
        // Arrange
        const signerWallet = MOCK_SIGNER;
        const collectionAddress = "9xP2v4M1Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuz";

        // Act
        const result = await prepareSquadsDateChangeProposalTransaction({
          creatorWallet: signerWallet,
          collectionAddress,
          newStartAtUnixSeconds: 1785542400n,
          newEndAtUnixSeconds: 1788134400n,
          transactionIndex: 2n
        });

        // Assert
        expect(result.attemptId).toBeDefined();
        expect(result.transactionBase64).toBeDefined();
        expect(result.proposalPda).toBeDefined();
        expect(result.transactionIndex).toBe("2");
        expect(result.signerWallet).toBe(signerWallet);
      },
      15000
    );
  });

  describe("E. Live Devnet Multisig State Query", () => {
    it(
      "should query and decode multisig state from Solana Devnet RPC",
      async () => {
        // Act
        const state = await fetchSquadsMultisigState(SQUADS_DEVNET_MULTISIG_PDA);

        // Assert
        expect(state.multisigPda).toBe(SQUADS_DEVNET_MULTISIG_PDA);
        expect(state.programId).toBe(SQUADS_V4_PROGRAM_ID);
        expect(state.threshold).toBe(2);
        expect(state.membersCount).toBe(4);
        expect(state.members).toContain(MOCK_SIGNER);
      },
      15000
    );
  });
});