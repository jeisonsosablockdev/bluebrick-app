import { z } from "zod";

import { listWalletComplianceStatuses } from "@/features/profile/infrastructure/profile-repository";
import {
  calculateDistributionPreparation,
  type DistributionCalculationInput,
  type DistributionStakeEvent,
  type DistributionWalletEligibility
} from "@/features/staking-distribution/application/distribution-engine";
import {
  appendDistributionAuditEvent,
  blockDistributionRun,
  createDistributionDraft as createDistributionDraftRecord,
  finalizeDistributionRun,
  getDistributionRunById,
  listDistributionRuns,
  replaceDistributionItems,
  type DistributionRunRecord
} from "@/features/staking-distribution/infrastructure/distribution-repository";
import {
  listStakeProfileEventsForDistribution,
  type StakeProfileEventRecord
} from "@/features/staking-distribution/infrastructure/stake-profile-events-repository";

export type CreateDistributionRunDraftInput = {
  periodKey: string;
  collectionAddress: string;
  propertyId: string;
  periodStartAt: string;
  periodEndAt: string;
  policyVersion: string;
  tokenMint: string;
  totalAmountMinor: string;
  actorId: string;
};

export type FinalizePreparedDistributionRunInput = {
  runId: string;
  outputChecksum: string;
  actorId: string;
};

export type DistributionRunDraftResult = {
  status: "ready" | "blocked";
  run: DistributionRunRecord;
  calculation: ReturnType<typeof calculateDistributionPreparation>;
};

type DistributionServiceDependencies = {
  createDistributionDraft: typeof createDistributionDraftRecord;
  listStakeEventsForDistribution: typeof listStakeProfileEventsForDistribution;
  listWalletComplianceForDistribution: typeof listWalletComplianceStatuses;
  calculateDistributionPreparation: typeof calculateDistributionPreparation;
  replaceDistributionItems: typeof replaceDistributionItems;
  blockDistributionRun: typeof blockDistributionRun;
  finalizeDistributionRun: typeof finalizeDistributionRun;
  appendDistributionAuditEvent: typeof appendDistributionAuditEvent;
};

const defaultDependencies: DistributionServiceDependencies = {
  createDistributionDraft: createDistributionDraftRecord,
  listStakeEventsForDistribution: listStakeProfileEventsForDistribution,
  listWalletComplianceForDistribution: listWalletComplianceStatuses,
  calculateDistributionPreparation,
  replaceDistributionItems,
  blockDistributionRun,
  finalizeDistributionRun,
  appendDistributionAuditEvent
};

const createDraftSchema = z.object({
  periodKey: z.string().trim().min(1),
  collectionAddress: z.string().trim().min(1),
  propertyId: z.string().trim().min(1),
  periodStartAt: z.string().datetime(),
  periodEndAt: z.string().datetime(),
  policyVersion: z.string().trim().min(1),
  tokenMint: z.string().trim().min(1),
  totalAmountMinor: z.string().regex(/^\d+$/),
  actorId: z.string().trim().min(1)
});

const finalizeSchema = z.object({
  runId: z.string().trim().min(1),
  outputChecksum: z.string().trim().min(1),
  actorId: z.string().trim().min(1)
});

export class DistributionServiceError extends Error {
  code: string;
  status: number;
  details?: Record<string, unknown>;

  constructor(code: string, message: string, status: number, details?: Record<string, unknown>) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function listDistributionRunsForAdmin(): Promise<DistributionRunRecord[]> {
  return listDistributionRuns();
}

export async function getDistributionRunDetailForAdmin(runId: string): Promise<DistributionRunRecord | null> {
  return getDistributionRunById(runId);
}

export async function createDistributionRunDraft(
  input: CreateDistributionRunDraftInput,
  dependencies: DistributionServiceDependencies = defaultDependencies
): Promise<DistributionRunDraftResult> {
  const parsed = parseCreateDraftInput(input);
  const run = await dependencies.createDistributionDraft({
    periodKey: parsed.periodKey,
    collectionAddress: parsed.collectionAddress,
    propertyId: parsed.propertyId,
    periodStartAt: parsed.periodStartAt,
    periodEndAt: parsed.periodEndAt,
    policyVersion: parsed.policyVersion,
    tokenMint: parsed.tokenMint,
    totalAmountMinor: parsed.totalAmountMinor,
    createdByActorId: parsed.actorId
  });
  const stakeEvents = await dependencies.listStakeEventsForDistribution({
    collectionAddress: parsed.collectionAddress,
    propertyId: parsed.propertyId,
    periodEndAt: parsed.periodEndAt
  });
  const walletEligibility = await dependencies.listWalletComplianceForDistribution(uniqueOwnerWallets(stakeEvents));
  const calculation = dependencies.calculateDistributionPreparation({
    scope: {
      collectionAddress: parsed.collectionAddress,
      propertyId: parsed.propertyId
    },
    periodStartAt: parsed.periodStartAt,
    periodEndAt: parsed.periodEndAt,
    totalAmountMinor: parsed.totalAmountMinor,
    policyVersion: parsed.policyVersion,
    stakeEvents: stakeEvents.map(toCalculationStakeEvent),
    walletEligibility: walletEligibility.map(toCalculationEligibility)
  });

  if (calculation.status === "blocked") {
    const blockedReason = calculation.blockedReasons.join(",");
    const blockedRun = await dependencies.blockDistributionRun({
      runId: run.id,
      blockedReason
    });
    await dependencies.appendDistributionAuditEvent({
      runId: run.id,
      eventName: "distribution_blocked",
      actorType: "admin",
      actorId: parsed.actorId,
      eventPayload: {
        blockedReasons: calculation.blockedReasons,
        outputChecksum: calculation.outputChecksum
      }
    });

    return {
      status: "blocked",
      run: blockedRun,
      calculation
    };
  }

  await dependencies.replaceDistributionItems({
    runId: run.id,
    outputChecksum: calculation.outputChecksum,
    items: calculation.walletAllocations.map((allocation) => ({
      walletPublicKey: allocation.walletPublicKey,
      assetAddress: null,
      frozenSeconds: allocation.frozenSeconds,
      amountMinor: allocation.amountMinor,
      roundingRemainderRank: allocation.roundingRemainderRank,
      itemPayload: {
        policyVersion: parsed.policyVersion
      }
    }))
  });
  await dependencies.appendDistributionAuditEvent({
    runId: run.id,
    eventName: "distribution_draft_prepared",
    actorType: "admin",
    actorId: parsed.actorId,
    eventPayload: {
      outputChecksum: calculation.outputChecksum,
      walletCount: calculation.walletAllocations.length,
      exclusionCount: calculation.exclusions.length
    }
  });

  return {
    status: "ready",
    run: {
      ...run,
      outputChecksum: calculation.outputChecksum,
      itemCount: calculation.walletAllocations.length,
      totalWallets: calculation.walletAllocations.length
    },
    calculation
  };
}

export async function finalizePreparedDistributionRun(
  input: FinalizePreparedDistributionRunInput,
  dependencies: Pick<DistributionServiceDependencies, "finalizeDistributionRun" | "appendDistributionAuditEvent"> = defaultDependencies
): Promise<DistributionRunRecord> {
  const parsed = parseFinalizeInput(input);
  const run = await dependencies.finalizeDistributionRun({
    runId: parsed.runId,
    outputChecksum: parsed.outputChecksum,
    finalizedByActorId: parsed.actorId
  });

  await dependencies.appendDistributionAuditEvent({
    runId: parsed.runId,
    eventName: "distribution_finalized",
    actorType: "admin",
    actorId: parsed.actorId,
    eventPayload: {
      outputChecksum: parsed.outputChecksum
    }
  });

  return run;
}

function parseCreateDraftInput(input: CreateDistributionRunDraftInput): Omit<CreateDistributionRunDraftInput, "totalAmountMinor"> & {
  totalAmountMinor: bigint;
} {
  const parsed = createDraftSchema.safeParse(input);
  if (!parsed.success) {
    throw new DistributionServiceError("INVALID_DISTRIBUTION_INPUT", "Distribution draft input is invalid.", 400, {
      issues: parsed.error.flatten().fieldErrors
    });
  }

  return {
    ...parsed.data,
    totalAmountMinor: BigInt(parsed.data.totalAmountMinor)
  };
}

function parseFinalizeInput(input: FinalizePreparedDistributionRunInput): FinalizePreparedDistributionRunInput {
  const parsed = finalizeSchema.safeParse(input);
  if (!parsed.success) {
    throw new DistributionServiceError("INVALID_DISTRIBUTION_FINALIZE_INPUT", "Distribution finalize input is invalid.", 400, {
      issues: parsed.error.flatten().fieldErrors
    });
  }

  return parsed.data;
}

function uniqueOwnerWallets(events: Array<Pick<StakeProfileEventRecord, "ownerWallet">>): string[] {
  return Array.from(new Set(events.map((event) => event.ownerWallet))).sort();
}

function toCalculationStakeEvent(event: StakeProfileEventRecord): DistributionStakeEvent {
  return {
    ownerWallet: event.ownerWallet,
    assetAddress: event.assetAddress,
    collectionAddress: event.collectionAddress,
    propertyId: event.propertyId,
    productAction: event.productAction,
    validationStatus: event.validationStatus,
    blockTime: event.blockTime,
    observedAt: event.observedAt,
    slot: event.slot,
    instructionIndex: event.instructionIndex,
    txSignature: event.txSignature
  };
}

function toCalculationEligibility(status: {
  walletPublicKey: string;
  complianceStatus: DistributionWalletEligibility["complianceStatus"];
}): DistributionWalletEligibility {
  return {
    walletPublicKey: status.walletPublicKey,
    complianceStatus: status.complianceStatus
  };
}
