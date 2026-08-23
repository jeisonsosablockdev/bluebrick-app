/**
 * @vitest-environment jsdom
 * =========================================================================================
 * Test Suite: Squads Proposal Service (Layer 2 — Application Service Tests)
 * Feature: BRI-8 / SPEC-12 (Clean Code Audit & SOLID Refactoring)
 *
 * Description:
 * Tests the decoupled application service responsible for orchestrating proposal submissions
 * and multisig vote/execution actions across wallet signing and backend RPC routes.
 *
 * Scenarios Covered:
 * 1. submitDateChangeProposal fails when wallet is disconnected.
 * 2. submitDateChangeProposal successfully prepares, signs, and broadcasts on-chain proposal.
 * 3. submitDateChangeProposal handles user wallet rejection gracefully.
 * 4. dispatchMultisigAction successfully prepares and broadcasts vote transaction.
 * 5. dispatchMultisigAction successfully prepares and broadcasts execution transaction.
 * =========================================================================================
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  submitDateChangeProposal,
  dispatchMultisigAction,
  type SubmitDateProposalParams,
  type DispatchMultisigActionParams
} from "@/features/admin/application/squads-proposal-service";

vi.mock("@/lib/solana-kit/compat/web3-transactions", () => ({
  deserializeLegacyVersionedTransaction: vi.fn(() => ({})),
  serializeLegacyVersionedTransaction: vi.fn(() => new Uint8Array([1, 2, 3]))
}));

describe("SquadsProposalService Application Service (SRP & Clean Code)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fails to submit proposal if wallet is not connected", async () => {
    const params: SubmitDateProposalParams = {
      collectionId: "fix-flip-brandon-117-666",
      collectionAddress: "9xP2v4M1Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuz",
      proposedStartDate: "2026-09-01",
      proposedEndDate: "2027-09-01",
      justification: "Ajuste de cronograma",
      signerWallet: null,
      signTransaction: undefined
    };

    await expect(submitDateChangeProposal(params)).rejects.toThrow(/wallet/i);
  });

  it("successfully prepares, signs, and broadcasts a date change proposal", async () => {
    const mockSign = vi.fn(async (tx) => tx);
    global.fetch = vi.fn().mockImplementation(async (url: string, options?: RequestInit) => {
      if (url.includes("/date-change-request")) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: {
              requestId: "dcr_123",
              collectionId: "fix-flip-brandon-117-666",
              status: "PENDING_MULTISIG",
              proposedStartAt: "2026-09-01T00:00:00.000Z",
              proposedEndAt: "2027-09-01T23:59:59.000Z",
              justification: "Ajuste de cronograma",
              createdAt: "2026-08-23T00:00:00.000Z",
              proposalPda: "CNrV6YyCpz4KcczFwGmjQ7NqKujm1CiVpxJS1KdhYvZ4",
              transactionIndex: "4"
            },
            preparedTx: {
              transactionBase64: "AQ=="
            }
          })
        };
      }

      if (url.includes("/vote")) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: {
              txSignature: "5K6xV8mN4pQ1t9Z2yB3wR7uA8sD4fG6hJ1kL3mO5pQ7r",
              solscanUrl: "https://solscan.io/tx/5K6xV8mN4pQ1t9Z2yB3wR7uA8sD4fG6hJ1kL3mO5pQ7r?cluster=devnet"
            }
          })
        };
      }

      return { ok: false, json: async () => ({ ok: false }) };
    });

    const params: SubmitDateProposalParams = {
      collectionId: "fix-flip-brandon-117-666",
      collectionAddress: "9xP2v4M1Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuz",
      proposedStartDate: "2026-09-01",
      proposedEndDate: "2027-09-01",
      justification: "Ajuste de cronograma",
      signerWallet: "3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd",
      signTransaction: mockSign
    };

    const result = await submitDateChangeProposal(params);
    expect(result.proposal.requestId).toBe("dcr_123");
    expect(result.proposal.txSignature).toBe("5K6xV8mN4pQ1t9Z2yB3wR7uA8sD4fG6hJ1kL3mO5pQ7r");
    expect(mockSign).toHaveBeenCalledTimes(1);
  });

  it("handles wallet user rejection during signing gracefully", async () => {
    const mockSign = vi.fn().mockRejectedValue(new Error("User rejected the request."));

    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/date-change-request")) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: { requestId: "dcr_123" },
            preparedTx: { transactionBase64: "AQ==" }
          })
        };
      }
      return { ok: true, json: async () => ({}) };
    });

    const params: SubmitDateProposalParams = {
      collectionId: "fix-flip-brandon-117-666",
      collectionAddress: "9xP2v4M1Bay3rtZ9nhDR6CgpiHKnSdCiksuFUHz7ttuz",
      proposedStartDate: "2026-09-01",
      proposedEndDate: "2027-09-01",
      justification: "Ajuste de cronograma",
      signerWallet: "3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd",
      signTransaction: mockSign
    };

    await expect(submitDateChangeProposal(params)).rejects.toThrow(/wallet|cancel|reject/i);
  });

  it("successfully dispatches unified multisig action for voting", async () => {
    const mockSign = vi.fn(async (tx) => tx);
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/prepare-vote")) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: { transactionBase64: "AQ==" }
          })
        };
      }
      if (url.includes("/vote")) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: {
              txSignature: "sig_vote_123",
              solscanUrl: "https://solscan.io/tx/sig_vote_123",
              executed: false
            }
          })
        };
      }
      return { ok: false };
    });

    const params: DispatchMultisigActionParams = {
      proposalId: "dcr_123",
      transactionIndex: "4",
      signerWallet: "3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd",
      action: "VOTE",
      signTransaction: mockSign
    };

    const result = await dispatchMultisigAction(params);
    expect(result.txSignature).toBe("sig_vote_123");
    expect(result.isExecuted).toBe(false);
  });

  it("successfully dispatches unified multisig action for execution", async () => {
    const mockSign = vi.fn(async (tx) => tx);
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/prepare-vote")) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: { transactionBase64: "AQ==" }
          })
        };
      }
      if (url.includes("/vote")) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: {
              txSignature: "sig_exec_123",
              solscanUrl: "https://solscan.io/tx/sig_exec_123",
              executed: true
            }
          })
        };
      }
      return { ok: false };
    });

    const params: DispatchMultisigActionParams = {
      proposalId: "dcr_123",
      transactionIndex: "4",
      signerWallet: "3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd",
      action: "EXECUTE",
      signTransaction: mockSign
    };

    const result = await dispatchMultisigAction(params);
    expect(result.txSignature).toBe("sig_exec_123");
    expect(result.isExecuted).toBe(true);
  });
});
