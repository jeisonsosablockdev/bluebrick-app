/**
 * SPEC-S03-B (EPIC-014): Hamilton Largest-Remainder Integer Math Allocation
 *
 * Computes deterministic integer yield allocations across qualified wallets
 * using 64-bit integer math (BigInt) and the 2-pass Hamilton largest-remainder method.
 *
 * Invariants:
 * - All intermediate products use BigInt (prevents 2^53 JavaScript Number overflow)
 * - Zero-pool guard: poolTimeWeight == 0n -> BLOCKED (no division by zero)
 * - Sum invariant: Σ wallet.grossAmountMinor == distributionPoolAmountMinor
 * - 3-level tie-breaking: 1) remainder DESC, 2) firstFreezeAt ASC (FIFO), 3) wallet ASC
 */

export type WalletTimeWeightInput = {
  walletPublicKey: string;
  walletTimeWeightSeconds: bigint;
  firstFreezeAt: string; // ISO timestamp for FIFO tie-breaking
};

export type HamiltonAllocationResult =
  | {
      status: "blocked";
      blockedReason: "no_eligible_participation";
    }
  | {
      status: "ready";
      poolTimeWeightSeconds: bigint;
      distributionPoolAmountMinor: bigint;
      allocations: Array<{
        walletPublicKey: string;
        walletTimeWeightSeconds: bigint;
        grossAmountMinor: bigint;
        exactRemainder: bigint;
        remainderRank: number | null;
        receivedRemainderUnit: boolean;
      }>;
      totalAllocatedMinor: bigint;
    };

export function calculateHamiltonAllocation(input: {
  distributionPoolAmountMinor: bigint;
  wallets: WalletTimeWeightInput[];
}): HamiltonAllocationResult {
  const { distributionPoolAmountMinor, wallets } = input;

  const poolTimeWeightSeconds = wallets.reduce(
    (acc, w) => acc + w.walletTimeWeightSeconds,
    0n
  );

  // Zero-pool guard
  if (poolTimeWeightSeconds === 0n || wallets.length === 0) {
    return {
      status: "blocked",
      blockedReason: "no_eligible_participation"
    };
  }

  // Pass 1: Floor allocation with BigInt math
  const intermediate = wallets.map((w) => {
    const product = distributionPoolAmountMinor * w.walletTimeWeightSeconds;
    const grossFloor = product / poolTimeWeightSeconds;
    const exactRemainder = product % poolTimeWeightSeconds;

    return {
      walletPublicKey: w.walletPublicKey,
      walletTimeWeightSeconds: w.walletTimeWeightSeconds,
      firstFreezeAt: w.firstFreezeAt,
      grossAmountMinor: grossFloor,
      exactRemainder,
      remainderRank: null as number | null,
      receivedRemainderUnit: false
    };
  });

  const sumGrossFloor = intermediate.reduce((acc, w) => acc + w.grossAmountMinor, 0n);
  const remainderToDistribute = Number(distributionPoolAmountMinor - sumGrossFloor);

  // Pass 2: Sort for Hamilton largest-remainder distribution
  // 1. exactRemainder DESC
  // 2. firstFreezeAt ASC (earliest freeze gets priority)
  // 3. walletPublicKey ASC (lexicographical fallback)
  const sorted = [...intermediate].sort((a, b) => {
    if (b.exactRemainder !== a.exactRemainder) {
      return b.exactRemainder > a.exactRemainder ? 1 : -1;
    }

    const timeA = new Date(a.firstFreezeAt).getTime();
    const timeB = new Date(b.firstFreezeAt).getTime();
    if (timeA !== timeB) {
      return timeA - timeB;
    }

    return a.walletPublicKey.localeCompare(b.walletPublicKey, "en");
  });

  // Distribute 1 minor unit to top `remainderToDistribute` wallets
  for (let i = 0; i < remainderToDistribute; i++) {
    if (sorted[i]) {
      sorted[i]!.grossAmountMinor += 1n;
      sorted[i]!.receivedRemainderUnit = true;
      sorted[i]!.remainderRank = i + 1;
    }
  }

  // Verify invariant: total allocated == pool amount
  const totalAllocatedMinor = sorted.reduce((acc, w) => acc + w.grossAmountMinor, 0n);
  if (totalAllocatedMinor !== distributionPoolAmountMinor) {
    throw new Error(
      `Hamilton math invariant violation: total allocated (${totalAllocatedMinor}) != pool amount (${distributionPoolAmountMinor})`
    );
  }

  return {
    status: "ready",
    poolTimeWeightSeconds,
    distributionPoolAmountMinor,
    allocations: intermediate,
    totalAllocatedMinor
  };
}
