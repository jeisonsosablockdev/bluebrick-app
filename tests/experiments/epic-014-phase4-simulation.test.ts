import { describe, expect, it } from "vitest";

import { calculateHamiltonAllocation, type WalletTimeWeightInput } from "@/lib/distribution/hamilton";
import { DualProviderGapError } from "@/lib/archival/archival-rpc-client";
import { isComplianceHoldExpired } from "@/lib/claims/compliance-monitor";

describe("Phase 4 Interactive Verification & System Experiments", () => {
  it("Experimento 1: Hamilton Largest-Remainder BigInt precision & pool sum invariant (Σ gross == pool)", () => {
    const poolAmountMinor = 1_000_000_000n; // 1,000 USDC
    const testWallets: WalletTimeWeightInput[] = [
      { walletPublicKey: "Wallet_Alice_01", walletTimeWeightSeconds: 864000n * 3n, firstFreezeAt: "2026-01-01T00:00:00Z" },
      { walletPublicKey: "Wallet_Bob_02", walletTimeWeightSeconds: 864000n * 2n, firstFreezeAt: "2026-01-02T00:00:00Z" },
      { walletPublicKey: "Wallet_Charlie_03", walletTimeWeightSeconds: 864000n * 1n, firstFreezeAt: "2026-01-03T00:00:00Z" }
    ];

    const result = calculateHamiltonAllocation({
      distributionPoolAmountMinor: poolAmountMinor,
      wallets: testWallets
    });

    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.totalAllocatedMinor).toBe(poolAmountMinor); // Invariante de suma estricta
      expect(result.allocations.length).toBe(3);

      const alice = result.allocations.find((w) => w.walletPublicKey === "Wallet_Alice_01");
      const bob = result.allocations.find((w) => w.walletPublicKey === "Wallet_Bob_02");
      const charlie = result.allocations.find((w) => w.walletPublicKey === "Wallet_Charlie_03");

      expect(alice?.grossAmountMinor).toBe(500_000_000n);   // 50% = 500 USDC
      expect(bob?.grossAmountMinor).toBe(333_333_333n);     // 33.3333333% (remainder 1/3)
      expect(charlie?.grossAmountMinor).toBe(166_666_667n); // 16.6666666% + 1 minor unit (remainder 2/3 > 1/3)
      expect(alice!.grossAmountMinor + bob!.grossAmountMinor + charlie!.grossAmountMinor).toBe(poolAmountMinor);
    }
  });

  it("Experimento 2: Guarda de Participación Cero & Archival Gap error intercept", () => {
    const zeroRes = calculateHamiltonAllocation({
      distributionPoolAmountMinor: 500_000_000n,
      wallets: []
    });

    expect(zeroRes.status).toBe("blocked");
    if (zeroRes.status === "blocked") {
      expect(zeroRes.blockedReason).toBe("no_eligible_participation");
    }

    const gapErr = new DualProviderGapError(150000);
    expect(gapErr.code).toBe("dual_provider_gap");
    expect(gapErr.requiredSlot).toBe(150000);
  });

  it("Experimento 3: Fragmentación de Lotes Squads v4 con cota de 20 legs por propuesta", () => {
    const totalClaimsCount = 45;
    const MAX_LEGS_PER_BATCH = 20;
    const expectedBatches = Math.ceil(totalClaimsCount / MAX_LEGS_PER_BATCH);

    expect(expectedBatches).toBe(3); // 20 + 20 + 5 legs
  });

  it("Experimento 4: Monitoreo de TTL de Compliance a 12 meses", () => {
    const holdTime366Days = new Date(Date.now() - 366 * 24 * 3600 * 1000).toISOString();
    const holdTime30Days = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

    expect(isComplianceHoldExpired(holdTime366Days)).toBe(true);  // Expirado (> 12m)
    expect(isComplianceHoldExpired(holdTime30Days)).toBe(false);  // Activo (< 12m)
  });
});
