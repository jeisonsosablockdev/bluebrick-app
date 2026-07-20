import { describe, expect, it } from "vitest";

import {
  calculateHamiltonAllocation,
  type WalletTimeWeightInput
} from "@/lib/distribution/hamilton";
import {
  clipIntervalsToWindow,
  type ReconstructedInterval
} from "@/lib/distribution/intervals";

describe("lib/distribution/hamilton", () => {
  it("triggers zero-pool guard when no wallet has frozen time", () => {
    const result = calculateHamiltonAllocation({
      distributionPoolAmountMinor: 1000000n,
      wallets: []
    });

    expect(result.status).toBe("blocked");
    if (result.status === "blocked") {
      expect(result.blockedReason).toBe("no_eligible_participation");
    }
  });

  it("allocates exactly proportional gross when time weights divide evenly", () => {
    const wallets: WalletTimeWeightInput[] = [
      { walletPublicKey: "W1", walletTimeWeightSeconds: 100n, firstFreezeAt: "2026-01-01T00:00:00Z" },
      { walletPublicKey: "W2", walletTimeWeightSeconds: 100n, firstFreezeAt: "2026-01-01T00:00:00Z" }
    ];

    const result = calculateHamiltonAllocation({
      distributionPoolAmountMinor: 1000n, // 1000 minor units
      wallets
    });

    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.totalAllocatedMinor).toBe(1000n);
      expect(result.allocations[0]?.grossAmountMinor).toBe(500n);
      expect(result.allocations[1]?.grossAmountMinor).toBe(500n);
    }
  });

  it("distributes remainder to wallet with highest remainder and enforces exact pool sum invariant", () => {
    // 100 minor units split across 3 equal wallets (33.333... each -> remainder 1)
    const wallets: WalletTimeWeightInput[] = [
      { walletPublicKey: "W1", walletTimeWeightSeconds: 100n, firstFreezeAt: "2026-01-01T00:00:00Z" },
      { walletPublicKey: "W2", walletTimeWeightSeconds: 100n, firstFreezeAt: "2026-01-02T00:00:00Z" },
      { walletPublicKey: "W3", walletTimeWeightSeconds: 100n, firstFreezeAt: "2026-01-03T00:00:00Z" }
    ];

    const result = calculateHamiltonAllocation({
      distributionPoolAmountMinor: 100n,
      wallets
    });

    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.totalAllocatedMinor).toBe(100n); // Invariant check
      // Earliest FIFO (W1) breaks remainder tie
      const w1 = result.allocations.find((a) => a.walletPublicKey === "W1");
      expect(w1?.grossAmountMinor).toBe(34n);
    }
  });
});

describe("lib/distribution/intervals", () => {
  it("clips raw intervals to eligibility window correctly", () => {
    const windowStart = "2026-01-01T00:00:00Z";
    const windowEnd = "2026-01-10T00:00:00Z";

    const intervals: ReconstructedInterval[] = [
      {
        assetAddress: "A1",
        wallet: "W1",
        frozenAt: Math.floor(new Date("2025-12-31T00:00:00Z").getTime() / 1000), // before window
        thawedAt: Math.floor(new Date("2026-01-05T00:00:00Z").getTime() / 1000),
        slot: 100,
        txSignature: "sig1"
      }
    ];

    const clipped = clipIntervalsToWindow(intervals, windowStart, windowEnd);
    expect(clipped.length).toBe(1);
    expect(clipped[0]?.earningStartAt).toBe("2026-01-01T00:00:00.000Z");
    expect(clipped[0]?.earningEndAt).toBe("2026-01-05T00:00:00.000Z");
    expect(clipped[0]?.earningSeconds).toBe(BigInt(4 * 24 * 3600)); // 4 days
  });
});
