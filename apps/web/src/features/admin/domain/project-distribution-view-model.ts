/**
 * =========================================================================================
 * Layer 3: Domain Layer — Project Distribution View Model
 * Module: project-distribution-view-model.ts
 *
 * Description:
 * Pure domain models and mapping functions that merge raw marketplace collection data
 * with on-chain ProjectConfig Notary PDA parameters.
 *
 * Invariants:
 * - Pure functional design (zero database, network, or framework dependencies).
 * - Fallbacks safely to standard calendar boundaries if on-chain notary is uninitialized.
 * - Enforces start_at < end_at temporal validity for distribution eligibility.
 * =========================================================================================
 */

import type { ProjectConfigPdaState } from "@/lib/solana-kit/pda/project-config-reader";

export type NotarySyncStatus = "SYNCHRONIZED" | "UNINITIALIZED" | "RPC_ERROR";

export type RawMarketplaceCollection = {
  entryId: string;
  title: string;
  coverImageUrl?: string | null;
  collectionAddress: string;
  candyMachineAddress?: string | null;
};

export type ProjectDistributionCandidate = {
  id: string;
  title: string;
  coverImageUrl: string;
  collectionAddress: string;
  periodStartAt: string;
  periodEndAt: string;
  periodKey: string;
  notaryVersion: number;
  syncStatus: NotarySyncStatus;
  isReadyForDistribution: boolean;
};

const DEFAULT_PROPERTY_PLACEHOLDER_IMAGE = "/images/placeholder-property.jpg";

/**
 * Calculates a default period key (YYYY-MM) and start/end dates for current month.
 *
 * What: Generates ISO boundary timestamps for the current calendar month.
 * How: Constructs Date objects for day 1 00:00:00.000Z and end-of-month 23:59:59.000Z.
 */
export function getDefaultMonthlyPeriod(now = new Date()): {
  periodKey: string;
  periodStartAt: string;
  periodEndAt: string;
} {
  // Step 1: Extract year and month with 2-digit zero padding
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const periodKey = `${year}-${month}`;

  // Step 2: Calculate ISO start and end bounds
  const start = new Date(Date.UTC(year, now.getUTCMonth(), 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, now.getUTCMonth() + 1, 0, 23, 59, 59, 0));

  return {
    periodKey,
    periodStartAt: start.toISOString(),
    periodEndAt: end.toISOString()
  };
}

/**
 * Formats a Unix timestamp (seconds) into ISO 8601 string.
 *
 * What: Converts BigInt unix seconds to ISO 8601 timestamp string.
 * How: Multiplies by 1000 and parses with Date.toISOString().
 */
export function formatUnixSecondsToIso(unixSeconds: bigint): string {
  const ms = Number(unixSeconds) * 1000;
  return new Date(ms).toISOString();
}

/**
 * Derives a period key (YYYY-MM) from an ISO timestamp string.
 *
 * What: Extracts the year and month prefix from an ISO date.
 * How: Slices the first 7 characters (YYYY-MM).
 */
export function derivePeriodKeyFromIso(isoString: string): string {
  if (isoString.length >= 7) {
    return isoString.slice(0, 7);
  }
  return getDefaultMonthlyPeriod().periodKey;
}

/**
 * Maps raw marketplace collection and on-chain Notary PDA state into a unified candidate model.
 *
 * What: Combines catalog metadata with on-chain cryptographic dates.
 * How: Verifies syncStatus, formats timestamps, and evaluates isReadyForDistribution.
 */
export function mapToProjectDistributionViewModel(
  collection: RawMarketplaceCollection,
  notaryState: ProjectConfigPdaState | null,
  syncStatus: NotarySyncStatus
): ProjectDistributionCandidate {
  // Step 1: Resolve cover image URL with safe placeholder fallback
  const coverImageUrl =
    collection.coverImageUrl && collection.coverImageUrl.trim().length > 0
      ? collection.coverImageUrl.trim()
      : DEFAULT_PROPERTY_PLACEHOLDER_IMAGE;

  // Step 2: If on-chain notary is synchronized, use notarized dates
  if (syncStatus === "SYNCHRONIZED" && notaryState) {
    const periodStartAt = formatUnixSecondsToIso(notaryState.startAtUnixSeconds);
    const periodEndAt = formatUnixSecondsToIso(notaryState.endAtUnixSeconds);
    const periodKey = derivePeriodKeyFromIso(periodStartAt);
    const isReadyForDistribution = notaryState.startAtUnixSeconds < notaryState.endAtUnixSeconds;

    return {
      id: collection.entryId,
      title: collection.title,
      coverImageUrl,
      collectionAddress: collection.collectionAddress,
      periodStartAt,
      periodEndAt,
      periodKey,
      notaryVersion: notaryState.version,
      syncStatus: "SYNCHRONIZED",
      isReadyForDistribution
    };
  }

  // Step 3: Fallback to default monthly calendar dates for uninitialized or degraded states
  const defaultPeriod = getDefaultMonthlyPeriod();

  return {
    id: collection.entryId,
    title: collection.title,
    coverImageUrl,
    collectionAddress: collection.collectionAddress,
    periodStartAt: defaultPeriod.periodStartAt,
    periodEndAt: defaultPeriod.periodEndAt,
    periodKey: defaultPeriod.periodKey,
    notaryVersion: 0,
    syncStatus,
    isReadyForDistribution: false
  };
}
