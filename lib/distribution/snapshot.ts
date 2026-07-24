/**
 * SPEC-S03-A (EPIC-014): Distribution Snapshot & Asset Resolution
 *
 * Configures the snapshot parameters for a project distribution run and
 * resolves the set of eligible assets from verified mint provenance data.
 *
 * Business Rules:
 * - Candy Machine is sole financial scope (collection is never financial scope)
 * - Only assets with provenanceStatus = 'validated' are eligible
 * - Assets with status 'needs_review' or 'rejected' are excluded
 * - distributionPoolAmountMinor must not exceed availableTreasuryEarningsMinor
 * - investmentModel is stored as metadata for audit/reporting (does not affect math in v1)
 */

import { withDbClient } from "@/lib/db/pool";
import { generateUuidV7 } from "@/lib/uuid-v7";
import {
  getProjectCandyMachineSource,
  listValidatedOriginsByProject,
  type AssetProjectOriginRecord
} from "@/lib/provenance/provenance-repository";

export type InvestmentModel = "fix_flip" | "fix_hold" | "real_estate_dev";
export type ScopeType = "candy_machine";
export type PoolCompositionBasis = "equal_eligible_nft_count";
export type UnsoldInventoryPolicy = "exclude_unsold" | "include_unsold";

export type CreateSnapshotInput = {
  projectId: string;
  eligibilityStartAt: string;
  eligibilityEndAt: string;
  snapshotAt?: string;
  availableTreasuryEarningsMinor: bigint;
  distributionPoolAmountMinor: bigint;
  tokenMint: string;
  treasuryVault: string;
  investmentModel?: InvestmentModel;
  createdByActorId: string;
};

export type DistributionRunSnapshotRecord = {
  id: string;
  projectId: string;
  scopeType: ScopeType;
  scopeAddress: string;
  candyMachineAddress: string;
  collectionAddress: string | null;
  eligibilityStartAt: string;
  eligibilityEndAt: string;
  snapshotAt: string;
  availableTreasuryEarningsMinor: bigint;
  distributionPoolAmountMinor: bigint;
  poolCompositionBasis: PoolCompositionBasis;
  unsoldInventoryPolicy: UnsoldInventoryPolicy;
  investmentModel: InvestmentModel | null;
  tokenMint: string;
  treasuryVault: string;
  status: "draft";
  createdByActorId: string;
  createdAt: string;
  eligibleAssetsCount: number;
};

export class SnapshotValidationError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "SnapshotValidationError";
    this.code = code;
  }
}

export function validateSnapshotInput(input: CreateSnapshotInput): void {
  if (!input.projectId?.trim()) {
    throw new SnapshotValidationError("MISSING_PROJECT_ID", "projectId is required.");
  }

  const startMs = new Date(input.eligibilityStartAt).getTime();
  const endMs = new Date(input.eligibilityEndAt).getTime();

  if (Number.isNaN(startMs)) {
    throw new SnapshotValidationError("INVALID_START_DATE", "eligibilityStartAt is invalid.");
  }

  if (Number.isNaN(endMs)) {
    throw new SnapshotValidationError("INVALID_END_DATE", "eligibilityEndAt is invalid.");
  }

  if (endMs <= startMs) {
    throw new SnapshotValidationError(
      "INVALID_WINDOW",
      "eligibilityEndAt must be strictly after eligibilityStartAt."
    );
  }

  if (input.availableTreasuryEarningsMinor < 0n) {
    throw new SnapshotValidationError(
      "NEGATIVE_TREASURY",
      "availableTreasuryEarningsMinor cannot be negative."
    );
  }

  if (input.distributionPoolAmountMinor <= 0n) {
    throw new SnapshotValidationError(
      "INVALID_POOL_AMOUNT",
      "distributionPoolAmountMinor must be greater than zero."
    );
  }

  if (input.distributionPoolAmountMinor > input.availableTreasuryEarningsMinor) {
    throw new SnapshotValidationError(
      "POOL_EXCEEDS_TREASURY",
      `distributionPoolAmountMinor (${input.distributionPoolAmountMinor}) cannot exceed availableTreasuryEarningsMinor (${input.availableTreasuryEarningsMinor}).`
    );
  }

  if (!input.tokenMint?.trim()) {
    throw new SnapshotValidationError("MISSING_TOKEN_MINT", "tokenMint is required.");
  }

  if (!input.treasuryVault?.trim()) {
    throw new SnapshotValidationError("MISSING_TREASURY_VAULT", "treasuryVault is required.");
  }

  if (!input.createdByActorId?.trim()) {
    throw new SnapshotValidationError("MISSING_CREATED_BY", "createdByActorId is required.");
  }

  if (input.snapshotAt && Number.isNaN(new Date(input.snapshotAt).getTime())) {
    throw new SnapshotValidationError("INVALID_SNAPSHOT_DATE", "snapshotAt is invalid.");
  }
}

/**
 * Creates a DistributionRun in DRAFT status after resolving verified mint provenance.
 */
export async function createDistributionSnapshot(
  input: CreateSnapshotInput
): Promise<{ run: DistributionRunSnapshotRecord; eligibleAssets: AssetProjectOriginRecord[] }> {
  validateSnapshotInput(input);

  const pcmSource = await getProjectCandyMachineSource(input.projectId);
  if (!pcmSource) {
    throw new SnapshotValidationError(
      "PCM_SOURCE_NOT_FOUND",
      `No approved Candy Machine source registered for project: ${input.projectId}`
    );
  }

  const eligibleAssets = await listValidatedOriginsByProject(input.projectId);

  const snapshotAt = input.snapshotAt ?? new Date().toISOString();
  const runId = generateUuidV7();

  const record: DistributionRunSnapshotRecord = {
    id: runId,
    projectId: input.projectId,
    scopeType: "candy_machine",
    scopeAddress: pcmSource.candyMachineAddress,
    candyMachineAddress: pcmSource.candyMachineAddress,
    collectionAddress: pcmSource.collectionAddress,
    eligibilityStartAt: new Date(input.eligibilityStartAt).toISOString(),
    eligibilityEndAt: new Date(input.eligibilityEndAt).toISOString(),
    snapshotAt: new Date(snapshotAt).toISOString(),
    availableTreasuryEarningsMinor: input.availableTreasuryEarningsMinor,
    distributionPoolAmountMinor: input.distributionPoolAmountMinor,
    poolCompositionBasis: "equal_eligible_nft_count",
    unsoldInventoryPolicy: pcmSource.unsoldInventoryPolicy,
    investmentModel: input.investmentModel ?? null,
    tokenMint: input.tokenMint,
    treasuryVault: input.treasuryVault,
    status: "draft",
    createdByActorId: input.createdByActorId,
    createdAt: new Date().toISOString(),
    eligibleAssetsCount: eligibleAssets.length
  };

  await withDbClient(async (client) => {
    await client.query(
      `INSERT INTO distribution_runs (
         id, period_key, collection_address, property_id,
         period_start_at, period_end_at, policy_version,
         token_mint, total_amount_minor, status,
         created_by_actor_id, scope_type, scope_address,
         candy_machine_address, eligibility_start_at, eligibility_end_at,
         snapshot_at, available_treasury_earnings_minor,
         distribution_pool_amount_minor, pool_composition_basis,
         unsold_inventory_policy, investment_model, treasury_vault
       ) VALUES (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft',
         $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22
       )`,
      [
        runId,
        `run_${input.projectId}_${Date.now()}`,
        pcmSource.collectionAddress ?? pcmSource.candyMachineAddress,
        input.projectId,
        record.eligibilityStartAt,
        record.eligibilityEndAt,
        "EPIC-014-v1",
        input.tokenMint,
        input.distributionPoolAmountMinor.toString(),
        input.createdByActorId,
        record.scopeType,
        record.scopeAddress,
        record.candyMachineAddress,
        record.eligibilityStartAt,
        record.eligibilityEndAt,
        record.snapshotAt,
        record.availableTreasuryEarningsMinor.toString(),
        record.distributionPoolAmountMinor.toString(),
        record.poolCompositionBasis,
        record.unsoldInventoryPolicy,
        record.investmentModel,
        record.treasuryVault
      ]
    );

    // Record audit event
    await client.query(
      `INSERT INTO distribution_audit_events (id, run_id, event_name, actor_type, actor_id, event_payload)
       VALUES ($1, $2, 'SNAPSHOT_CREATED', 'admin', $3, $4)`,
      [
        generateUuidV7(),
        runId,
        input.createdByActorId,
        JSON.stringify({
          projectId: input.projectId,
          eligibleAssetsCount: eligibleAssets.length,
          distributionPoolAmountMinor: input.distributionPoolAmountMinor.toString(),
          availableTreasuryEarningsMinor: input.availableTreasuryEarningsMinor.toString(),
          scopeAddress: pcmSource.candyMachineAddress
        })
      ]
    );
  });

  return { run: record, eligibleAssets };
}
