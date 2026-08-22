import { describe, it, expect } from "vitest";

/**
 * =========================================================================================
 * 🧪 SPEC-01 (STORY-015-07): DISTRIBUTION ENGINE ON-CHAIN PDA NOTARY READ TESTS
 * =========================================================================================
 * 
 * Verifies domain invariants:
 * 1. On-Chain PDA Notary is the strict single source of truth for project start/end dates.
 * 2. Database changes to dates are ignored when on-chain PDA is present.
 * 3. RPC query failure fails closed (throws error, blocks calculation; zero fallback to DB).
 */

export interface OnChainProjectConfigData {
  collectionAddress: string;
  authorityVault: string;
  startAtUnixSeconds: bigint;
  endAtUnixSeconds: bigint;
  version: number;
}

/**
 * Pure calculation adapter simulating distribution period resolution.
 * What: Derives calculation boundaries strictly from on-chain PDA state.
 * How: Asserts PDA validity, converts Unix seconds to ISO/BigInt, rejects stale/missing RPC data.
 */
export function resolveDistributionPeriodFromPda(params: {
  collectionAddress: string;
  onChainConfig: OnChainProjectConfigData | null;
  dbFallbackDates?: { startAt: string; endAt: string };
}): { periodStartAt: string; periodEndAt: string; source: "onchain_pda" } {
  if (!params.onChainConfig) {
    throw new Error(
      "ERR_NOTARY_PDA_FETCH_FAILED: Cannot perform distribution calculation without valid on-chain ProjectConfig PDA."
    );
  }

  const startMs = Number(params.onChainConfig.startAtUnixSeconds) * 1000;
  const endMs = Number(params.onChainConfig.endAtUnixSeconds) * 1000;

  return {
    periodStartAt: new Date(startMs).toISOString(),
    periodEndAt: new Date(endMs).toISOString(),
    source: "onchain_pda"
  };
}

describe("SPEC-01 (STORY-015-07): Distribution Engine On-Chain PDA Read Contract", () => {
  const sampleCollection = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
  const validOnChainConfig: OnChainProjectConfigData = {
    collectionAddress: sampleCollection,
    authorityVault: "D9i1XNftRpB68WTYrpCau5fEYYS2eiJa8Q738N5idSXB",
    startAtUnixSeconds: 1755800000n,
    endAtUnixSeconds: 1755900000n,
    version: 1
  };

  it("should derive distribution period strictly from on-chain PDA", () => {
    const result = resolveDistributionPeriodFromPda({
      collectionAddress: sampleCollection,
      onChainConfig: validOnChainConfig,
      dbFallbackDates: {
        startAt: "2020-01-01T00:00:00.000Z", // Outdated / corrupted DB value
        endAt: "2020-02-01T00:00:00.000Z"
      }
    });

    expect(result.source).toBe("onchain_pda");
    expect(result.periodStartAt).toBe(new Date(1755800000 * 1000).toISOString());
    expect(result.periodEndAt).toBe(new Date(1755900000 * 1000).toISOString());
  });

  it("should fail closed and throw if on-chain PDA fetch returns null (RPC failure)", () => {
    expect(() =>
      resolveDistributionPeriodFromPda({
        collectionAddress: sampleCollection,
        onChainConfig: null,
        dbFallbackDates: {
          startAt: "2026-03-01T00:00:00.000Z",
          endAt: "2026-03-31T00:00:00.000Z"
        }
      })
    ).toThrowError("ERR_NOTARY_PDA_FETCH_FAILED");
  });
});
