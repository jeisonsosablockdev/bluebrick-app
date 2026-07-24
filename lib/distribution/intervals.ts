/**
 * SPEC-S03-B (EPIC-014): Historical Freeze Interval Reconstruction
 *
 * Reconstructs continuous/disjoint freeze intervals for eligible NFTs
 * from Archival RPC transaction logs during the project eligibility window.
 *
 * Business Rules:
 * - Interval start = max(eligibilityStartAt, freezeConfirmedAt)
 * - Interval end = min(eligibilityEndAt, unfreezeConfirmedAt ?? eligibilityEndAt)
 * - Earning follows owned-and-frozen time only (gaps accrue to no one)
 * - Disjoint intervals across re-freeze events are summed per asset
 */

import { createArchivalRpcClient } from "@/lib/archival/archival-rpc-client";
import { METAPLEX_CORE_PROGRAM_ID } from "@/lib/infrastructure/solana";

export type ReconstructedInterval = {
  assetAddress: string;
  wallet: string;
  frozenAt: number; // Unix timestamp seconds
  thawedAt: number | null; // Unix timestamp seconds (null if still frozen)
  slot: number | null;
  txSignature: string;
};

export type ValidatedEarningInterval = {
  assetAddress: string;
  wallet: string;
  earningStartAt: string;
  earningEndAt: string;
  earningSeconds: bigint;
  txSignature: string;
};

type ParsedFreezeInstruction = {
  assetAddress: string;
  wallet: string;
  actionType: "freeze" | "thaw";
};

/**
 * Parses Metaplex Core freeze/thaw instructions from raw RPC transaction meta.
 */
export function parseFreezeThawInstruction(tx: unknown): ParsedFreezeInstruction | null {
  if (!tx || typeof tx !== "object") return null;

  const raw = tx as {
    transaction?: { message?: { accountKeys?: unknown[]; instructions?: unknown[] } };
    meta?: { logMessages?: string[] };
  };

  const logs = raw.meta?.logMessages ?? [];
  const programCall = logs.some((l) => l.includes(METAPLEX_CORE_PROGRAM_ID));

  if (!programCall) return null;

  const isFreeze = logs.some((l) => l.toLowerCase().includes("freeze"));
  const isThaw = logs.some((l) => l.toLowerCase().includes("thaw") || l.toLowerCase().includes("unfreeze"));

  if (!isFreeze && !isThaw) return null;

  const keys = (raw.transaction?.message?.accountKeys ?? []) as Array<string | { pubkey?: string }>;
  const getPubkey = (item: unknown): string => {
    if (typeof item === "string") return item;
    if (item && typeof item === "object" && "pubkey" in item) return String(item.pubkey);
    return "";
  };

  const signerWallet = getPubkey(keys[0]);
  const assetAddress = getPubkey(keys[1]);

  if (!signerWallet || !assetAddress) return null;

  return {
    assetAddress,
    wallet: signerWallet,
    actionType: isFreeze ? "freeze" : "thaw"
  };
}

/**
 * Reconstructs raw freeze intervals for an asset using Archival RPC transaction history.
 */
export async function reconstructAssetFreezeIntervals(
  assetAddress: string,
  eligibilityStartSlot?: number
): Promise<ReconstructedInterval[]> {
  const archivalRpc = createArchivalRpcClient();
  const signatures = await archivalRpc.getSignaturesForAddress(assetAddress, {
    limit: 1000,
    requiredSlot: eligibilityStartSlot
  });

  const intervals: ReconstructedInterval[] = [];
  let currentOpenInterval: Partial<ReconstructedInterval> | null = null;

  // Process signatures from oldest to newest
  const sortedSigs = [...signatures].sort((a, b) => (a.slot ?? 0) - (b.slot ?? 0));

  for (const sig of sortedSigs) {
    if (sig.err) continue;

    try {
      const txResult = await archivalRpc.getTransaction(sig.signature, sig.slot ?? undefined);
      const parsed = parseFreezeThawInstruction(txResult.tx);

      if (!parsed || parsed.assetAddress !== assetAddress) continue;

      const blockTime = sig.blockTime ?? Math.floor(Date.now() / 1000);

      if (parsed.actionType === "freeze") {
        if (currentOpenInterval) {
          // Close pre-existing if re-frozen without explicit thaw
          intervals.push({
            assetAddress,
            wallet: currentOpenInterval.wallet ?? parsed.wallet,
            frozenAt: currentOpenInterval.frozenAt ?? blockTime,
            thawedAt: blockTime,
            slot: currentOpenInterval.slot ?? sig.slot,
            txSignature: currentOpenInterval.txSignature ?? sig.signature
          });
        }

        currentOpenInterval = {
          assetAddress,
          wallet: parsed.wallet,
          frozenAt: blockTime,
          thawedAt: null,
          slot: sig.slot,
          txSignature: sig.signature
        };
      } else if (parsed.actionType === "thaw" && currentOpenInterval) {
        intervals.push({
          assetAddress,
          wallet: currentOpenInterval.wallet ?? parsed.wallet,
          frozenAt: currentOpenInterval.frozenAt ?? blockTime,
          thawedAt: blockTime,
          slot: currentOpenInterval.slot ?? sig.slot,
          txSignature: currentOpenInterval.txSignature ?? sig.signature
        });
        currentOpenInterval = null;
      }
    } catch {
      // Transaction parse skip
    }
  }

  if (currentOpenInterval && currentOpenInterval.frozenAt) {
    intervals.push({
      assetAddress,
      wallet: currentOpenInterval.wallet!,
      frozenAt: currentOpenInterval.frozenAt,
      thawedAt: null,
      slot: currentOpenInterval.slot ?? null,
      txSignature: currentOpenInterval.txSignature ?? ""
    });
  }

  return intervals;
}

/**
 * Clips raw intervals against the project eligibility window and calculates counted seconds.
 */
export function clipIntervalsToWindow(
  intervals: ReconstructedInterval[],
  windowStartAt: string,
  windowEndAt: string
): ValidatedEarningInterval[] {
  const startSec = Math.floor(new Date(windowStartAt).getTime() / 1000);
  const endSec = Math.floor(new Date(windowEndAt).getTime() / 1000);

  const clipped: ValidatedEarningInterval[] = [];

  for (const interval of intervals) {
    const frozenAt = interval.frozenAt;
    const thawedAt = interval.thawedAt ?? endSec;

    const earningStartSec = Math.max(startSec, frozenAt);
    const earningEndSec = Math.min(endSec, thawedAt);

    if (earningStartSec < earningEndSec) {
      const seconds = BigInt(earningEndSec - earningStartSec);
      clipped.push({
        assetAddress: interval.assetAddress,
        wallet: interval.wallet,
        earningStartAt: new Date(earningStartSec * 1000).toISOString(),
        earningEndAt: new Date(earningEndSec * 1000).toISOString(),
        earningSeconds: seconds,
        txSignature: interval.txSignature
      });
    }
  }

  return clipped;
}
