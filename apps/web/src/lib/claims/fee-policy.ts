/**
 * SPEC-S04-A (EPIC-014): Versioned Claim Fee Policy Engine
 *
 * Manages versioned claim fee policies with hierarchical scope resolution:
 * 1. candy_machine (highest priority)
 * 2. project (secondary priority)
 * 3. global (fallback priority)
 *
 * Invariants:
 * - Fee is calculated at claim layer (after gross entitlement is fixed)
 * - Fee cannot exceed gross amount (feeAmountMinor <= grossAmountMinor)
 * - Percentage mode: floor(gross * bps / 10000)
 * - Caps: minFeeMinor and maxFeeMinor applied
 * - Locking: Fee quote locks policy version at claim request time
 */

import { withDbClient } from "@/lib/db/pool";
import { generateUuidV7 } from "@/lib/uuid-v7";

export type FeeScopeType = "global" | "project" | "candy_machine";
export type FeeMode = "flat" | "percentage";

export type ClaimFeePolicyRecord = {
  id: string;
  scopeType: FeeScopeType;
  scopeAddress: string;
  tokenMint: string;
  feeMode: FeeMode;
  flatFeeMinor: bigint;
  percentageBps: number;
  minFeeMinor: bigint;
  maxFeeMinor: bigint | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  version: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ClaimFeeCalculationResult = {
  grossAmountMinor: bigint;
  feeAmountMinor: bigint;
  netAmountMinor: bigint;
  policyId: string;
  policyVersion: number;
};

type ClaimFeePolicyRow = {
  id: string;
  scope_type: FeeScopeType;
  scope_address: string;
  token_mint: string;
  fee_mode: FeeMode;
  flat_fee_minor: string | bigint | null;
  percentage_bps: number | null;
  min_fee_minor: string | bigint | null;
  max_fee_minor: string | bigint | null;
  effective_from: string | Date;
  effective_to: string | Date | null;
  version: number;
  is_active: boolean;
  created_by: string;
  created_at: string | Date;
  updated_at: string | Date;
};

function toIso(value: string | Date | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapPolicyRow(row: ClaimFeePolicyRow): ClaimFeePolicyRecord {
  return {
    id: row.id,
    scopeType: row.scope_type,
    scopeAddress: row.scope_address,
    tokenMint: row.token_mint,
    feeMode: row.fee_mode,
    flatFeeMinor: BigInt(row.flat_fee_minor ?? 0),
    percentageBps: Number(row.percentage_bps ?? 0),
    minFeeMinor: BigInt(row.min_fee_minor ?? 0),
    maxFeeMinor: row.max_fee_minor !== null ? BigInt(row.max_fee_minor) : null,
    effectiveFrom: toIso(row.effective_from) ?? new Date().toISOString(),
    effectiveTo: toIso(row.effective_to),
    version: row.version,
    isActive: row.is_active,
    createdBy: row.created_by,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString()
  };
}

/**
 * Calculates claim fee amount given a gross amount and active policy.
 */
export function calculateClaimFee(
  grossAmountMinor: bigint,
  policy: ClaimFeePolicyRecord
): ClaimFeeCalculationResult {
  if (grossAmountMinor <= 0n) {
    return {
      grossAmountMinor: 0n,
      feeAmountMinor: 0n,
      netAmountMinor: 0n,
      policyId: policy.id,
      policyVersion: policy.version
    };
  }

  let rawFeeMinor = 0n;

  if (policy.feeMode === "flat") {
    rawFeeMinor = policy.flatFeeMinor;
  } else if (policy.feeMode === "percentage") {
    rawFeeMinor = (grossAmountMinor * BigInt(policy.percentageBps)) / 10000n;
  }

  // Apply minimum cap
  if (policy.minFeeMinor > 0n && rawFeeMinor < policy.minFeeMinor) {
    rawFeeMinor = policy.minFeeMinor;
  }

  // Apply maximum cap
  if (policy.maxFeeMinor !== null && rawFeeMinor > policy.maxFeeMinor) {
    rawFeeMinor = policy.maxFeeMinor;
  }

  // Fee cannot exceed gross entitlement
  const feeAmountMinor = rawFeeMinor > grossAmountMinor ? grossAmountMinor : rawFeeMinor;
  const netAmountMinor = grossAmountMinor - feeAmountMinor;

  return {
    grossAmountMinor,
    feeAmountMinor,
    netAmountMinor,
    policyId: policy.id,
    policyVersion: policy.version
  };
}

const DEFAULT_GLOBAL_POLICY: ClaimFeePolicyRecord = {
  id: "policy_global_default",
  scopeType: "global",
  scopeAddress: "global",
  tokenMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  feeMode: "flat",
  flatFeeMinor: 0n,
  percentageBps: 0,
  minFeeMinor: 0n,
  maxFeeMinor: null,
  effectiveFrom: new Date(0).toISOString(),
  effectiveTo: null,
  version: 1,
  isActive: true,
  createdBy: "system",
  createdAt: new Date(0).toISOString(),
  updatedAt: new Date(0).toISOString()
};

/**
 * Resolves active fee policy according to hierarchy: candy_machine > project > global.
 */
export async function resolveActiveFeePolicy(input: {
  projectId: string;
  candyMachineAddress?: string | null;
  tokenMint: string;
  timestamp?: string;
}): Promise<ClaimFeePolicyRecord> {
  const { projectId, candyMachineAddress, tokenMint, timestamp } = input;
  const targetTime = timestamp ? new Date(timestamp) : new Date();

  return withDbClient(async (client) => {
    // 1. Try candy_machine scope
    if (candyMachineAddress) {
      const { rows: cmRows } = await client.query<ClaimFeePolicyRow>(
        `SELECT * FROM claim_fee_policies
         WHERE scope_type = 'candy_machine' AND scope_address = $1 AND token_mint = $2
           AND is_active = true AND effective_from <= $3
           AND (effective_to IS NULL OR effective_to >= $3)
         ORDER BY version DESC, effective_from DESC LIMIT 1`,
        [candyMachineAddress, tokenMint, targetTime]
      );
      if (cmRows[0]) return mapPolicyRow(cmRows[0]);
    }

    // 2. Try project scope
    const { rows: projRows } = await client.query<ClaimFeePolicyRow>(
      `SELECT * FROM claim_fee_policies
       WHERE scope_type = 'project' AND scope_address = $1 AND token_mint = $2
         AND is_active = true AND effective_from <= $3
         AND (effective_to IS NULL OR effective_to >= $3)
       ORDER BY version DESC, effective_from DESC LIMIT 1`,
      [projectId, tokenMint, targetTime]
    );
    if (projRows[0]) return mapPolicyRow(projRows[0]);

    // 3. Try global scope
    const { rows: globalRows } = await client.query<ClaimFeePolicyRow>(
      `SELECT * FROM claim_fee_policies
       WHERE scope_type = 'global' AND is_active = true AND effective_from <= $1
         AND (effective_to IS NULL OR effective_to >= $1)
       ORDER BY version DESC, effective_from DESC LIMIT 1`,
      [targetTime]
    );
    if (globalRows[0]) return mapPolicyRow(globalRows[0]);

    return DEFAULT_GLOBAL_POLICY;
  });
}

/**
 * Create a new fee policy version.
 */
export async function createClaimFeePolicy(input: {
  scopeType: FeeScopeType;
  scopeAddress: string;
  tokenMint: string;
  feeMode: FeeMode;
  flatFeeMinor?: bigint;
  percentageBps?: number;
  minFeeMinor?: bigint;
  maxFeeMinor?: bigint | null;
  createdBy: string;
}): Promise<ClaimFeePolicyRecord> {
  return withDbClient(async (client) => {
    // Determine next version for scope
    const { rows: existing } = await client.query<{ max_version: number }>(
      `SELECT COALESCE(MAX(version), 0) AS max_version
       FROM claim_fee_policies
       WHERE scope_type = $1 AND scope_address = $2 AND token_mint = $3`,
      [input.scopeType, input.scopeAddress, input.tokenMint]
    );

    const nextVersion = (existing[0]?.max_version ?? 0) + 1;
    const id = generateUuidV7();

    const { rows } = await client.query<ClaimFeePolicyRow>(
      `INSERT INTO claim_fee_policies (
         id, scope_type, scope_address, token_mint, fee_mode,
         flat_fee_minor, percentage_bps, min_fee_minor, max_fee_minor,
         version, is_active, created_by
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11)
       RETURNING *`,
      [
        id,
        input.scopeType,
        input.scopeAddress,
        input.tokenMint,
        input.feeMode,
        (input.flatFeeMinor ?? 0n).toString(),
        input.percentageBps ?? 0,
        (input.minFeeMinor ?? 0n).toString(),
        input.maxFeeMinor ? input.maxFeeMinor.toString() : null,
        nextVersion,
        input.createdBy
      ]
    );

    return mapPolicyRow(rows[0]!);
  });
}
