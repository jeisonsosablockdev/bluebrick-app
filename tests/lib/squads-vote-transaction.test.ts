import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  prepareSquadsVoteTransaction,
  broadcastSignedTransaction
} from "@/lib/solana-kit/compat/squads-vote-transaction";

describe("Layer 4: Squads Vote Transaction Builder (SPEC-09)", () => {
  const CANONICAL_SIGNER = "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1";
  const CANONICAL_PROPOSAL = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("Step 1: Successfully prepares unsigned VersionedTransaction with Devnet blockhash", async () => {
    // Arrange: Mock Devnet RPC getLatestBlockhash
    global.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      const body = JSON.parse((init?.body as string) || "{}");
      if (body.method === "getLatestBlockhash") {
        return {
          ok: true,
          json: async () => ({
            jsonrpc: "2.0",
            result: {
              value: {
                blockhash: "EkSnNWgrAwhHfF5Q81eZ4A8Yn16yvBQp4qWq7Z4q6XyZ",
                lastValidBlockHeight: 300000000
              }
            }
          })
        };
      }
      return { ok: true, json: async () => ({}) };
    });

    // Act
    const result = await prepareSquadsVoteTransaction(CANONICAL_SIGNER, CANONICAL_PROPOSAL);

    // Assert
    expect(result.attemptId).toBeDefined();
    expect(result.blockhash).toBe("EkSnNWgrAwhHfF5Q81eZ4A8Yn16yvBQp4qWq7Z4q6XyZ");
    expect(result.signerWallet).toBe(CANONICAL_SIGNER);
    expect(result.proposalId).toBe(CANONICAL_PROPOSAL);
    expect(typeof result.transactionBase64).toBe("string");
    expect(result.transactionBase64.length).toBeGreaterThan(50);
  });

  it("Step 2: Throws typed error when Devnet blockhash fetch fails", async () => {
    // Arrange: Mock failed blockhash RPC
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        jsonrpc: "2.0",
        result: { value: null }
      })
    });

    // Act & Assert
    await expect(
      prepareSquadsVoteTransaction(CANONICAL_SIGNER, CANONICAL_PROPOSAL)
    ).rejects.toThrowError(/ERR_RPC_BLOCKHASH_FETCH_FAILED/);
  });

  it("Step 3: Successfully broadcasts signed transaction and returns confirmed Solscan Devnet receipt", async () => {
    const mockTxSignature = "5K6xV8mN4pQ1t9Z2yB3wR7uA8sD4fG6hJ1kL3mO5pQ7r";
    const mockSlot = 315482910;

    // Arrange: Mock sendTransaction and getSignatureStatuses RPC calls
    global.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      const body = JSON.parse((init?.body as string) || "{}");
      if (body.method === "sendTransaction") {
        return {
          ok: true,
          json: async () => ({
            jsonrpc: "2.0",
            result: mockTxSignature
          })
        };
      }
      if (body.method === "getSignatureStatuses") {
        return {
          ok: true,
          json: async () => ({
            jsonrpc: "2.0",
            result: {
              value: [
                {
                  slot: mockSlot,
                  confirmationStatus: "confirmed",
                  err: null
                }
              ]
            }
          })
        };
      }
      return { ok: true, json: async () => ({}) };
    });

    // Act
    const result = await broadcastSignedTransaction(Buffer.from("signed-bytes").toString("base64"));

    // Assert
    expect(result.txSignature).toBe(mockTxSignature);
    expect(result.slot).toBe(mockSlot);
    expect(result.confirmed).toBe(true);
    expect(result.solscanUrl).toContain("solscan.io/tx/");
    expect(result.solscanUrl).toContain("cluster=devnet");
  });
});
