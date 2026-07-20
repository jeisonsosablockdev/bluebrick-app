import { describe, expect, it } from "vitest";

import {
  calculateClaimFee,
  type ClaimFeePolicyRecord
} from "@/lib/claims/fee-policy";

describe("lib/claims/fee-policy", () => {
  const basePolicy: ClaimFeePolicyRecord = {
    id: "policy-test-1",
    scopeType: "global",
    scopeAddress: "global",
    tokenMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    feeMode: "flat",
    flatFeeMinor: 2000000n, // 2 USDC
    percentageBps: 0,
    minFeeMinor: 0n,
    maxFeeMinor: null,
    effectiveFrom: "2026-01-01T00:00:00Z",
    effectiveTo: null,
    version: 1,
    isActive: true,
    createdBy: "admin",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z"
  };

  it("calculates flat fee correctly", () => {
    const res = calculateClaimFee(100000000n, basePolicy); // 100 USDC gross
    expect(res.feeAmountMinor).toBe(2000000n); // 2 USDC fee
    expect(res.netAmountMinor).toBe(98000000n); // 98 USDC net
  });

  it("calculates percentage fee correctly (2.5% = 250 bps)", () => {
    const percentagePolicy: ClaimFeePolicyRecord = {
      ...basePolicy,
      feeMode: "percentage",
      percentageBps: 250 // 2.5%
    };

    const res = calculateClaimFee(100000000n, percentagePolicy); // 100 USDC gross
    expect(res.feeAmountMinor).toBe(2500000n); // 2.5 USDC fee
    expect(res.netAmountMinor).toBe(97500000n); // 97.5 USDC net
  });

  it("enforces fee cannot exceed gross entitlement", () => {
    const res = calculateClaimFee(1000000n, basePolicy); // 1 USDC gross (less than 2 USDC flat fee)
    expect(res.feeAmountMinor).toBe(1000000n); // capped at gross
    expect(res.netAmountMinor).toBe(0n);
  });

  it("applies minFeeMinor and maxFeeMinor caps", () => {
    const cappedPolicy: ClaimFeePolicyRecord = {
      ...basePolicy,
      feeMode: "percentage",
      percentageBps: 100, // 1%
      minFeeMinor: 5000000n, // Min 5 USDC
      maxFeeMinor: 10000000n // Max 10 USDC
    };

    // Below min cap (1% of 100 USDC = 1 USDC -> bumped to 5 USDC min)
    const res1 = calculateClaimFee(100000000n, cappedPolicy);
    expect(res1.feeAmountMinor).toBe(5000000n);

    // Above max cap (1% of 2000 USDC = 20 USDC -> capped at 10 USDC max)
    const res2 = calculateClaimFee(2000000000n, cappedPolicy);
    expect(res2.feeAmountMinor).toBe(10000000n);
  });
});
