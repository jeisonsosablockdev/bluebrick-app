import { describe, it, expect, vi } from "vitest";

import {
  requestPayoutOverride,
  approvePayoutOverrideWithMultisig,
  PayoutOverrideServiceError
} from "@/features/staking-distribution/application/payout-override-service";
import * as repo from "@/features/staking-distribution/infrastructure/payout-override-repository";

vi.mock("@/features/staking-distribution/infrastructure/payout-override-repository", () => ({
  createPayoutOverrideRecord: vi.fn(),
  getPayoutOverrideById: vi.fn(),
  listPendingPayoutOverrides: vi.fn(),
  findApprovedOverrideForWallet: vi.fn(),
  updatePayoutOverrideStatus: vi.fn()
}));

describe("payout-override-service unit tests", () => {
  const validOriginal = "3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd";
  const validRequested = "AdNNTBSMy4yndiSNVmgEBTkJJuXLBrb7PKFWCdEf8Kxi";

  describe("requestPayoutOverride", () => {
    it("should successfully request a payout override with normalized case number", async () => {
      const mockCreated = {
        id: "OVR-TEST-1",
        original_wallet: validOriginal,
        requested_wallet: validRequested,
        effective_wallet: validOriginal,
        case_number: "CASE-2026-0891",
        status: "PENDING" as const,
        version: 1,
        reason: "Valid Reason",
        requested_by: "admin-1",
        approved_by: null,
        approval_tx_signature: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      vi.mocked(repo.createPayoutOverrideRecord).mockResolvedValueOnce(mockCreated);

      const result = await requestPayoutOverride({
        originalWallet: validOriginal,
        requestedWallet: validRequested,
        caseNumber: "case-2026-0891",
        reason: "Valid Reason",
        requestedBy: "admin-1"
      });

      expect(result.id).toBe("OVR-TEST-1");
      expect(repo.createPayoutOverrideRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          caseNumber: "CASE-2026-0891",
          originalWallet: validOriginal,
          requestedWallet: validRequested
        })
      );
    });

    it("should reject when caseNumber is missing", async () => {
      await expect(
        requestPayoutOverride({
          originalWallet: validOriginal,
          requestedWallet: validRequested,
          caseNumber: " ",
          reason: "Valid Reason",
          requestedBy: "admin-1"
        })
      ).rejects.toThrowError(PayoutOverrideServiceError);
    });
  });

  describe("approvePayoutOverrideWithMultisig", () => {
    it("should reject approval if run is sealed", async () => {
      await expect(
        approvePayoutOverrideWithMultisig({
          overrideId: "OVR-1",
          expectedVersion: 1,
          approvedBy: "admin-1",
          approvalTxSignature: "sig123",
          isRunSealed: true
        })
      ).rejects.toThrowError("ERR_SEALED_RUN_IMMUTABLE");
    });

    it("should reject approval if version conflict occurs", async () => {
      vi.mocked(repo.getPayoutOverrideById).mockResolvedValueOnce({
        id: "OVR-1",
        original_wallet: validOriginal,
        requested_wallet: validRequested,
        effective_wallet: validOriginal,
        case_number: "CASE-001",
        status: "PENDING",
        version: 1,
        reason: "Reason",
        requested_by: "admin-1",
        approved_by: null,
        approval_tx_signature: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

      vi.mocked(repo.updatePayoutOverrideStatus).mockResolvedValueOnce(null); // Conflict!

      await expect(
        approvePayoutOverrideWithMultisig({
          overrideId: "OVR-1",
          expectedVersion: 1,
          approvedBy: "admin-1",
          approvalTxSignature: "sig123"
        })
      ).rejects.toThrowError("ERR_CONCURRENT_MODIFICATION");
    });
  });
});
