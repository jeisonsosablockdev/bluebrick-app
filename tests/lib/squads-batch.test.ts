import { describe, expect, it } from "vitest";

import {
  MAX_LEGS_PER_BATCH,
  chunkItems,
  deriveAssociatedTokenAddress,
  deriveSquadsPdas,
  SquadsBatchError
} from "@/features/staking-distribution/application/squads-batch";

import {
  DEFAULT_COMPLIANCE_HOLD_TTL_MS,
  isComplianceHoldExpired
} from "@/features/staking-distribution/application/compliance-monitor";

describe("features/staking-distribution/application/squads-batch (SPEC-S04-C)", () => {
  it("exports MAX_LEGS_PER_BATCH = 20 leg capping for Squads proposals", () => {
    expect(MAX_LEGS_PER_BATCH).toBe(20);
  });

  describe("chunkItems", () => {
    it("chunks array into batches of MAX_LEGS_PER_BATCH (20)", () => {
      const items = Array.from({ length: 45 }, (_, i) => ({ id: `claim-${i + 1}` }));
      const chunks = chunkItems(items, MAX_LEGS_PER_BATCH);

      expect(chunks.length).toBe(3);
      expect(chunks[0]!.length).toBe(20);
      expect(chunks[1]!.length).toBe(20);
      expect(chunks[2]!.length).toBe(5);
    });

    it("handles item counts smaller than MAX_LEGS_PER_BATCH", () => {
      const items = Array.from({ length: 12 }, (_, i) => ({ id: `claim-${i + 1}` }));
      const chunks = chunkItems(items, MAX_LEGS_PER_BATCH);

      expect(chunks.length).toBe(1);
      expect(chunks[0]!.length).toBe(12);
    });

    it("handles empty item array", () => {
      const chunks = chunkItems([], MAX_LEGS_PER_BATCH);
      expect(chunks.length).toBe(0);
    });

    it("throws error if maxChunkSize <= 0", () => {
      expect(() => chunkItems([1, 2, 3], 0)).toThrow();
    });
  });

  describe("deriveAssociatedTokenAddress", () => {
    it("derives deterministic ATA for valid Solana wallet and token mint", async () => {
      const wallet = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
      const mint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

      const ata1 = await deriveAssociatedTokenAddress(wallet, mint);
      const ata2 = await deriveAssociatedTokenAddress(wallet, mint);

      expect(typeof ata1).toBe("string");
      expect(ata1).toBe(ata2);
      expect(ata1.length).toBeGreaterThan(30);
    });

    it("falls back gracefully for non-pubkey strings", async () => {
      const ata = await deriveAssociatedTokenAddress("invalid_wallet", "invalid_mint");
      expect(ata).toContain("invalid_wallet_ata_invalid_");
    });
  });

  describe("deriveSquadsPdas", () => {
    it("@spec BRI-12-REQ-3 derives deterministic Squads v4 PDAs using @solana/kit getProgramDerivedAddress", async () => {
      const multisig = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
      const pdas = await deriveSquadsPdas(multisig, 1);

      expect(pdas.squadsMultisigPda).toBeTruthy();
      expect(pdas.squadsVaultPda).toBeTruthy();
      expect(pdas.proposalPda).toBeTruthy();
      expect(pdas.batchPda).toBeTruthy();
    });
  });

  describe("SquadsBatchError", () => {
    it("creates custom error with code and message", () => {
      const error = new SquadsBatchError("BATCH_NOT_FOUND", "Batch not found: 123");
      expect(error.code).toBe("BATCH_NOT_FOUND");
      expect(error.message).toBe("Batch not found: 123");
      expect(error.name).toBe("SquadsBatchError");
    });
  });
});

describe("features/staking-distribution/application/compliance-monitor (SPEC-S04-C)", () => {
  it("exports 12-month DEFAULT_COMPLIANCE_HOLD_TTL_MS (365 days)", () => {
    expect(DEFAULT_COMPLIANCE_HOLD_TTL_MS).toBe(365 * 24 * 3600 * 1000);
  });

  describe("isComplianceHoldExpired", () => {
    const now = new Date("2026-07-20T00:00:00Z");

    it("returns false for compliance holds under 12 months", () => {
      // 6 months ago
      const sixMonthsAgo = new Date("2026-01-20T00:00:00Z");
      expect(isComplianceHoldExpired(sixMonthsAgo, now)).toBe(false);

      // 364 days ago
      const daysAgo364 = new Date(now.getTime() - 364 * 24 * 3600 * 1000);
      expect(isComplianceHoldExpired(daysAgo364, now)).toBe(false);
    });

    it("returns true for compliance holds >= 12 months (365+ days)", () => {
      // Exactly 365 days ago
      const daysAgo365 = new Date(now.getTime() - 365 * 24 * 3600 * 1000);
      expect(isComplianceHoldExpired(daysAgo365, now)).toBe(true);

      // 400 days ago
      const daysAgo400 = new Date(now.getTime() - 400 * 24 * 3600 * 1000);
      expect(isComplianceHoldExpired(daysAgo400, now)).toBe(true);
    });
  });
});
