import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  prepareSquadsProposalApproveTransaction,
  prepareSquadsVaultTransactionExecute,
  SQUADS_DEVNET_MULTISIG_PDA
} from "@/lib/solana-kit/compat/squads-v4-client";

describe("Layer 4: Squads Protocol v4 Native Vote & Execute Builders", () => {
  const CANONICAL_SIGNER = "3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Step 1: Successfully prepares unsigned VersionedTransaction for proposalApprove with Devnet blockhash", async () => {
    // Arrange & Act
    const result = await prepareSquadsProposalApproveTransaction({
      memberWallet: CANONICAL_SIGNER,
      transactionIndex: 1n,
      multisigAddress: SQUADS_DEVNET_MULTISIG_PDA,
      memo: "BRIDS_GOVERNANCE:approve"
    });

    // Assert
    expect(result.attemptId).toBeDefined();
    expect(result.blockhash).toBeDefined();
    expect(result.signerWallet).toBe(CANONICAL_SIGNER);
    expect(result.transactionIndex).toBe("1");
    expect(typeof result.transactionBase64).toBe("string");
    expect(result.transactionBase64.length).toBeGreaterThan(50);
  });

  it("Step 2: Successfully prepares unsigned VersionedTransaction for vaultTransactionExecute", async () => {
    // Arrange & Act
    const result = await prepareSquadsVaultTransactionExecute({
      memberWallet: CANONICAL_SIGNER,
      transactionIndex: 1n,
      multisigAddress: SQUADS_DEVNET_MULTISIG_PDA
    });

    // Assert
    expect(result.attemptId).toBeDefined();
    expect(result.blockhash).toBeDefined();
    expect(result.signerWallet).toBe(CANONICAL_SIGNER);
    expect(result.transactionIndex).toBe("1");
    expect(typeof result.transactionBase64).toBe("string");
    expect(result.transactionBase64.length).toBeGreaterThan(50);
  });
});
