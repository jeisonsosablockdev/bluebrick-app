import { createHash } from "node:crypto";

export type DistributionComplianceStatus =
  | "pending_kyc"
  | "pending_aml"
  | "pending_review"
  | "fully_verified"
  | "restricted_aml"
  | "suspended";

export type DistributionStakeEventStatus = "pending" | "validated" | "reconcile_pending" | "rejected";

export type DistributionStakeEvent = {
  ownerWallet: string;
  assetAddress: string;
  collectionAddress: string;
  propertyId: string;
  productAction: "stake" | "unstake";
  validationStatus: DistributionStakeEventStatus;
  blockTime: string | null;
  observedAt: string;
  slot: number | null;
  instructionIndex: number;
  txSignature: string;
};

export type DistributionWalletEligibility = {
  walletPublicKey: string;
  complianceStatus: DistributionComplianceStatus;
};

export type DistributionCalculationInput = {
  scope: {
    collectionAddress: string;
    propertyId: string;
  };
  periodStartAt: string;
  periodEndAt: string;
  totalAmountMinor: bigint;
  policyVersion: string;
  stakeEvents: DistributionStakeEvent[];
  walletEligibility: DistributionWalletEligibility[];
};

export type DistributionAssetInterval = {
  assetAddress: string;
  ownerWallet: string;
  intervalStartAt: string;
  intervalEndAt: string;
  frozenSeconds: bigint;
};

export type DistributionWalletAllocation = {
  walletPublicKey: string;
  frozenSeconds: bigint;
  amountMinor: bigint;
  roundingRemainderRank: number;
};

export type DistributionExclusion = {
  walletPublicKey: string;
  reason: "wallet_not_fully_verified";
};

export type DistributionCalculationResult = {
  status: "ready" | "blocked";
  blockedReasons: string[];
  assetIntervals: DistributionAssetInterval[];
  walletAllocations: DistributionWalletAllocation[];
  exclusions: DistributionExclusion[];
  outputChecksum: string;
};

type ParsedStakeEvent = DistributionStakeEvent & {
  eventTimeMs: number;
};

type AssetState = {
  assetAddress: string;
  ownerWallet: string;
  frozen: boolean;
  frozenStartedAtMs: number | null;
};

type AllocationDraft = {
  walletPublicKey: string;
  frozenSeconds: bigint;
  amountMinor: bigint;
  remainder: bigint;
};

export function calculateDistributionPreparation(input: DistributionCalculationInput): DistributionCalculationResult {
  const periodStartMs = parseRequiredTime(input.periodStartAt, "periodStartAt");
  const periodEndMs = parseRequiredTime(input.periodEndAt, "periodEndAt");

  if (periodEndMs <= periodStartMs) {
    throw new Error("Distribution period is invalid.");
  }

  if (input.totalAmountMinor < 0n) {
    throw new Error("totalAmountMinor must be non-negative.");
  }

  const scopedEvents = input.stakeEvents.filter((event) => matchesScope(event, input.scope));
  const blockedReasons = collectBlockingReasons(scopedEvents, periodStartMs, periodEndMs);

  if (blockedReasons.length > 0) {
    return buildBlockedResult(blockedReasons);
  }

  const validatedEvents = scopedEvents
    .filter((event) => event.validationStatus === "validated" && event.blockTime)
    .map(parseStakeEvent)
    .sort(compareStakeEvents);
  const assetIntervals = buildAssetIntervals(validatedEvents, periodStartMs, periodEndMs);
  const eligibilityByWallet = new Map(input.walletEligibility.map((wallet) => [wallet.walletPublicKey, wallet.complianceStatus]));
  const { eligibleIntervals, exclusions } = applyWalletEligibility(assetIntervals, eligibilityByWallet);
  const walletAllocations = allocateByWallet({
    intervals: eligibleIntervals,
    totalAmountMinor: input.totalAmountMinor
  });

  return {
    status: "ready",
    blockedReasons: [],
    assetIntervals: eligibleIntervals,
    walletAllocations,
    exclusions,
    outputChecksum: checksumFor({
      scope: input.scope,
      periodStartAt: input.periodStartAt,
      periodEndAt: input.periodEndAt,
      policyVersion: input.policyVersion,
      totalAmountMinor: input.totalAmountMinor,
      walletAllocations,
      exclusions
    })
  };
}

function matchesScope(
  event: DistributionStakeEvent,
  scope: DistributionCalculationInput["scope"]
): boolean {
  return event.collectionAddress === scope.collectionAddress && event.propertyId === scope.propertyId;
}

function collectBlockingReasons(
  events: DistributionStakeEvent[],
  periodStartMs: number,
  periodEndMs: number
): string[] {
  const hasUnresolved = events.some((event) => {
    if (event.validationStatus !== "pending" && event.validationStatus !== "reconcile_pending") {
      return false;
    }

    const observedMs = parseOptionalTime(event.observedAt);
    return observedMs !== null && observedMs >= periodStartMs && observedMs <= periodEndMs;
  });
  const hasMissingBlockTime = events.some((event) => {
    if (event.validationStatus !== "validated" || event.blockTime) {
      return false;
    }

    const observedMs = parseOptionalTime(event.observedAt);
    return observedMs !== null && observedMs >= periodStartMs && observedMs <= periodEndMs;
  });
  const reasons: string[] = [];

  if (hasUnresolved) {
    reasons.push("unresolved_stake_events");
  }

  if (hasMissingBlockTime) {
    reasons.push("missing_block_time");
  }

  return reasons;
}

function buildBlockedResult(blockedReasons: string[]): DistributionCalculationResult {
  return {
    status: "blocked",
    blockedReasons,
    assetIntervals: [],
    walletAllocations: [],
    exclusions: [],
    outputChecksum: checksumFor({ blockedReasons })
  };
}

function parseStakeEvent(event: DistributionStakeEvent): ParsedStakeEvent {
  return {
    ...event,
    eventTimeMs: parseRequiredTime(event.blockTime, "blockTime")
  };
}

function compareStakeEvents(left: ParsedStakeEvent, right: ParsedStakeEvent): number {
  return (
    left.eventTimeMs - right.eventTimeMs ||
    (left.slot ?? 0) - (right.slot ?? 0) ||
    left.instructionIndex - right.instructionIndex ||
    left.txSignature.localeCompare(right.txSignature)
  );
}

function buildAssetIntervals(
  events: ParsedStakeEvent[],
  periodStartMs: number,
  periodEndMs: number
): DistributionAssetInterval[] {
  const eventsByAsset = new Map<string, ParsedStakeEvent[]>();

  for (const event of events) {
    eventsByAsset.set(event.assetAddress, [...(eventsByAsset.get(event.assetAddress) ?? []), event]);
  }

  return Array.from(eventsByAsset.values())
    .flatMap((assetEvents) => buildAssetIntervalsForAsset(assetEvents, periodStartMs, periodEndMs))
    .sort(compareIntervals);
}

function buildAssetIntervalsForAsset(
  assetEvents: ParsedStakeEvent[],
  periodStartMs: number,
  periodEndMs: number
): DistributionAssetInterval[] {
  const state = getInitialAssetState(assetEvents, periodStartMs);
  const intervals: DistributionAssetInterval[] = [];

  for (const event of assetEvents.filter((candidate) => candidate.eventTimeMs >= periodStartMs && candidate.eventTimeMs <= periodEndMs)) {
    if (event.productAction === "stake" && !state.frozen) {
      state.frozen = true;
      state.frozenStartedAtMs = event.eventTimeMs;
      state.ownerWallet = event.ownerWallet;
      continue;
    }

    if (event.productAction === "unstake" && state.frozen && state.frozenStartedAtMs !== null) {
      intervals.push(toInterval(state, event.eventTimeMs));
      state.frozen = false;
      state.frozenStartedAtMs = null;
      state.ownerWallet = event.ownerWallet;
    }
  }

  if (state.frozen && state.frozenStartedAtMs !== null) {
    intervals.push(toInterval(state, periodEndMs));
  }

  return intervals.filter((interval) => interval.frozenSeconds > 0n);
}

function getInitialAssetState(assetEvents: ParsedStakeEvent[], periodStartMs: number): AssetState {
  const firstEvent = assetEvents[0];
  if (!firstEvent) {
    throw new Error("Cannot build asset state without events.");
  }

  const state: AssetState = {
    assetAddress: firstEvent.assetAddress,
    ownerWallet: firstEvent.ownerWallet,
    frozen: false,
    frozenStartedAtMs: null
  };

  for (const event of assetEvents.filter((candidate) => candidate.eventTimeMs < periodStartMs)) {
    state.ownerWallet = event.ownerWallet;
    if (event.productAction === "stake") {
      state.frozen = true;
      state.frozenStartedAtMs = periodStartMs;
    } else {
      state.frozen = false;
      state.frozenStartedAtMs = null;
    }
  }

  return state;
}

function toInterval(state: AssetState, intervalEndMs: number): DistributionAssetInterval {
  const intervalStartMs = state.frozenStartedAtMs;

  if (intervalStartMs === null) {
    throw new Error("Frozen interval cannot be closed without a start time.");
  }

  return {
    assetAddress: state.assetAddress,
    ownerWallet: state.ownerWallet,
    intervalStartAt: new Date(intervalStartMs).toISOString(),
    intervalEndAt: new Date(intervalEndMs).toISOString(),
    frozenSeconds: BigInt(Math.floor((intervalEndMs - intervalStartMs) / 1_000))
  };
}

function compareIntervals(left: DistributionAssetInterval, right: DistributionAssetInterval): number {
  return (
    left.intervalStartAt.localeCompare(right.intervalStartAt) ||
    left.assetAddress.localeCompare(right.assetAddress) ||
    left.ownerWallet.localeCompare(right.ownerWallet)
  );
}

function applyWalletEligibility(
  intervals: DistributionAssetInterval[],
  eligibilityByWallet: Map<string, DistributionComplianceStatus>
): {
  eligibleIntervals: DistributionAssetInterval[];
  exclusions: DistributionExclusion[];
} {
  const excludedWallets = new Set<string>();
  const eligibleIntervals: DistributionAssetInterval[] = [];

  for (const interval of intervals) {
    if (eligibilityByWallet.get(interval.ownerWallet) === "fully_verified") {
      eligibleIntervals.push(interval);
    } else {
      excludedWallets.add(interval.ownerWallet);
    }
  }

  return {
    eligibleIntervals,
    exclusions: Array.from(excludedWallets)
      .sort()
      .map((walletPublicKey) => ({
        walletPublicKey,
        reason: "wallet_not_fully_verified"
      }))
  };
}

function allocateByWallet(input: {
  intervals: DistributionAssetInterval[];
  totalAmountMinor: bigint;
}): DistributionWalletAllocation[] {
  const secondsByWallet = new Map<string, bigint>();

  for (const interval of input.intervals) {
    secondsByWallet.set(
      interval.ownerWallet,
      (secondsByWallet.get(interval.ownerWallet) ?? 0n) + interval.frozenSeconds
    );
  }

  const totalSeconds = Array.from(secondsByWallet.values()).reduce((sum, seconds) => sum + seconds, 0n);
  if (totalSeconds === 0n) {
    return [];
  }

  const drafts = Array.from(secondsByWallet.entries()).map<AllocationDraft>(([walletPublicKey, frozenSeconds]) => {
    const weightedAmount = input.totalAmountMinor * frozenSeconds;

    return {
      walletPublicKey,
      frozenSeconds,
      amountMinor: weightedAmount / totalSeconds,
      remainder: weightedAmount % totalSeconds
    };
  });
  const remainderRankByWallet = new Map(
    [...drafts]
      .sort(compareRemainders)
      .map((draft, index) => [draft.walletPublicKey, index])
  );

  return drafts
    .sort((left, right) => left.walletPublicKey.localeCompare(right.walletPublicKey))
    .map((draft) => ({
      walletPublicKey: draft.walletPublicKey,
      frozenSeconds: draft.frozenSeconds,
      amountMinor: draft.amountMinor,
      roundingRemainderRank: remainderRankByWallet.get(draft.walletPublicKey) ?? 0
    }));
}

function compareRemainders(left: AllocationDraft, right: AllocationDraft): number {
  if (left.remainder !== right.remainder) {
    return left.remainder > right.remainder ? -1 : 1;
  }

  return left.walletPublicKey.localeCompare(right.walletPublicKey);
}

function parseRequiredTime(value: string | null, label: string): number {
  const parsed = parseOptionalTime(value);
  if (parsed === null) {
    throw new Error(`${label} is invalid.`);
  }

  return parsed;
}

function parseOptionalTime(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

function checksumFor(value: unknown): string {
  const payload = JSON.stringify(value, (_key, nestedValue: unknown) => {
    if (typeof nestedValue === "bigint") {
      return nestedValue.toString();
    }

    return nestedValue;
  });

  return `sha256:${createHash("sha256").update(payload).digest("hex")}`;
}
