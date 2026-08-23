import { randomUUID } from "node:crypto";

import type { PoolClient } from "pg";

import { withDbClient } from "@/features/shared/infrastructure/db/pool";

export type DistributionRunStatus = "draft" | "blocked" | "finalized" | "failed";

export type DistributionRunRecord = {
  id: string;
  periodKey: string;
  collectionAddress: string;
  propertyId: string;
  periodStartAt: string;
  periodEndAt: string;
  periodTimezone: string;
  policyVersion: string;
  tokenMint: string;
  totalAmountMinor: bigint;
  status: DistributionRunStatus;
  blockedReason: string | null;
  outputChecksum: string | null;
  itemCount: number;
  totalWallets: number;
  createdByActorId: string;
  finalizedByActorId: string | null;
  finalizedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DistributionItemRecord = {
  id: string;
  runId: string;
  walletPublicKey: string;
  assetAddress: string | null;
  frozenSeconds: bigint;
  amountMinor: bigint;
  roundingRemainderRank: number | null;
  exclusionReason: string | null;
  itemPayload: Record<string, unknown>;
  createdAt: string;
};

export type DistributionItemWithRunRecord = DistributionItemRecord & {
  run: DistributionRunRecord;
};

export type DistributionAuditEventRecord = {
  id: string;
  runId: string;
  eventName: string;
  actorType: string;
  actorId: string;
  eventPayload: Record<string, unknown>;
  createdAt: string;
};

export type CreateDistributionDraftInput = {
  periodKey: string;
  collectionAddress: string;
  propertyId: string;
  periodStartAt: string;
  periodEndAt: string;
  policyVersion: string;
  tokenMint: string;
  totalAmountMinor: bigint;
  createdByActorId: string;
};

export type ReplaceDistributionItemsInput = {
  runId: string;
  outputChecksum?: string | null;
  items: Array<{
    walletPublicKey: string;
    assetAddress?: string | null;
    frozenSeconds: bigint;
    amountMinor: bigint;
    roundingRemainderRank?: number | null;
    exclusionReason?: string | null;
    itemPayload?: Record<string, unknown>;
  }>;
};

export type FinalizeDistributionRunInput = {
  runId: string;
  outputChecksum: string;
  finalizedByActorId: string;
};

export type AppendDistributionAuditEventInput = {
  runId: string;
  eventName: string;
  actorType: string;
  actorId: string;
  eventPayload?: Record<string, unknown>;
};

export type BlockDistributionRunInput = {
  runId: string;
  blockedReason: string;
};

type DistributionRunRow = {
  id: string;
  period_key: string;
  collection_address: string;
  property_id: string;
  period_start_at: string | Date;
  period_end_at: string | Date;
  period_timezone: string;
  policy_version: string;
  token_mint: string;
  total_amount_minor: string | number | bigint;
  status: DistributionRunStatus;
  blocked_reason: string | null;
  output_checksum: string | null;
  item_count: number;
  total_wallets: number;
  created_by_actor_id: string;
  finalized_by_actor_id: string | null;
  finalized_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type DistributionItemRow = {
  id: string;
  run_id: string;
  wallet_public_key: string;
  asset_address: string | null;
  frozen_seconds: string | number | bigint;
  amount_minor: string | number | bigint;
  rounding_remainder_rank: number | null;
  exclusion_reason: string | null;
  item_payload: unknown;
  created_at: string | Date;
};

type DistributionAuditEventRow = {
  id: string;
  run_id: string;
  event_name: string;
  actor_type: string;
  actor_id: string;
  event_payload: unknown;
  created_at: string | Date;
};

type DistributionItemWithRunRow = {
  item_id: string;
  item_run_id: string;
  item_wallet_public_key: string;
  item_asset_address: string | null;
  item_frozen_seconds: string | number | bigint;
  item_amount_minor: string | number | bigint;
  item_rounding_remainder_rank: number | null;
  item_exclusion_reason: string | null;
  item_payload: unknown;
  item_created_at: string | Date;
  run_id: string;
  run_period_key: string;
  run_collection_address: string;
  run_property_id: string;
  run_period_start_at: string | Date;
  run_period_end_at: string | Date;
  run_period_timezone: string;
  run_policy_version: string;
  run_token_mint: string;
  run_total_amount_minor: string | number | bigint;
  run_status: DistributionRunStatus;
  run_blocked_reason: string | null;
  run_output_checksum: string | null;
  run_item_count: number;
  run_total_wallets: number;
  run_created_by_actor_id: string;
  run_finalized_by_actor_id: string | null;
  run_finalized_at: string | Date | null;
  run_created_at: string | Date;
  run_updated_at: string | Date;
};

const runColumns = `
  id,
  period_key,
  collection_address,
  property_id,
  period_start_at,
  period_end_at,
  period_timezone,
  policy_version,
  token_mint,
  total_amount_minor,
  status,
  blocked_reason,
  output_checksum,
  item_count,
  total_wallets,
  created_by_actor_id,
  finalized_by_actor_id,
  finalized_at,
  created_at,
  updated_at
`;

const itemColumns = `
  id,
  run_id,
  wallet_public_key,
  asset_address,
  frozen_seconds,
  amount_minor,
  rounding_remainder_rank,
  exclusion_reason,
  item_payload,
  created_at
`;

const auditColumns = `
  id,
  run_id,
  event_name,
  actor_type,
  actor_id,
  event_payload,
  created_at
`;

const inMemoryRunsById = new Map<string, DistributionRunRecord>();
const inMemoryRunIdByScope = new Map<string, string>();
const inMemoryItemsByRunId = new Map<string, DistributionItemRecord[]>();
const inMemoryAuditEventsByRunId = new Map<string, DistributionAuditEventRecord[]>();

export function __resetDistributionRepositoryStateForTests(): void {
  inMemoryRunsById.clear();
  inMemoryRunIdByScope.clear();
  inMemoryItemsByRunId.clear();
  inMemoryAuditEventsByRunId.clear();
}

function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function assertNonEmpty(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
}

function assertNonNegativeBigInt(value: bigint, label: string): bigint {
  if (value < 0n) {
    throw new Error(`${label} must be non-negative.`);
  }

  return value;
}

function assertValidPeriod(startIso: string, endIso: string): void {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();

  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) {
    throw new Error("Distribution period is invalid.");
  }
}

function toIso(value: string | Date | null): string | null {
  if (value === null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function toBigInt(value: string | number | bigint): bigint {
  return BigInt(value);
}

function readJsonObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  return {};
}

function buildScopeKey(input: {
  periodKey: string;
  policyVersion: string;
  collectionAddress: string;
  propertyId: string;
}): string {
  return [
    input.periodKey,
    input.policyVersion,
    input.collectionAddress,
    input.propertyId
  ].join(":");
}

function mapRunRow(row: DistributionRunRow): DistributionRunRecord {
  return {
    id: row.id,
    periodKey: row.period_key,
    collectionAddress: row.collection_address,
    propertyId: row.property_id,
    periodStartAt: toIso(row.period_start_at) ?? new Date().toISOString(),
    periodEndAt: toIso(row.period_end_at) ?? new Date().toISOString(),
    periodTimezone: row.period_timezone,
    policyVersion: row.policy_version,
    tokenMint: row.token_mint,
    totalAmountMinor: toBigInt(row.total_amount_minor),
    status: row.status,
    blockedReason: row.blocked_reason,
    outputChecksum: row.output_checksum,
    itemCount: Number(row.item_count),
    totalWallets: Number(row.total_wallets),
    createdByActorId: row.created_by_actor_id,
    finalizedByActorId: row.finalized_by_actor_id,
    finalizedAt: toIso(row.finalized_at),
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString()
  };
}

function mapItemRow(row: DistributionItemRow): DistributionItemRecord {
  return {
    id: row.id,
    runId: row.run_id,
    walletPublicKey: row.wallet_public_key,
    assetAddress: row.asset_address,
    frozenSeconds: toBigInt(row.frozen_seconds),
    amountMinor: toBigInt(row.amount_minor),
    roundingRemainderRank: row.rounding_remainder_rank,
    exclusionReason: row.exclusion_reason,
    itemPayload: readJsonObject(row.item_payload),
    createdAt: toIso(row.created_at) ?? new Date().toISOString()
  };
}

function mapAuditRow(row: DistributionAuditEventRow): DistributionAuditEventRecord {
  return {
    id: row.id,
    runId: row.run_id,
    eventName: row.event_name,
    actorType: row.actor_type,
    actorId: row.actor_id,
    eventPayload: readJsonObject(row.event_payload),
    createdAt: toIso(row.created_at) ?? new Date().toISOString()
  };
}

function mapItemWithRunRow(row: DistributionItemWithRunRow): DistributionItemWithRunRecord {
  return {
    ...mapItemRow({
      id: row.item_id,
      run_id: row.item_run_id,
      wallet_public_key: row.item_wallet_public_key,
      asset_address: row.item_asset_address,
      frozen_seconds: row.item_frozen_seconds,
      amount_minor: row.item_amount_minor,
      rounding_remainder_rank: row.item_rounding_remainder_rank,
      exclusion_reason: row.item_exclusion_reason,
      item_payload: row.item_payload,
      created_at: row.item_created_at
    }),
    run: mapRunRow({
      id: row.run_id,
      period_key: row.run_period_key,
      collection_address: row.run_collection_address,
      property_id: row.run_property_id,
      period_start_at: row.run_period_start_at,
      period_end_at: row.run_period_end_at,
      period_timezone: row.run_period_timezone,
      policy_version: row.run_policy_version,
      token_mint: row.run_token_mint,
      total_amount_minor: row.run_total_amount_minor,
      status: row.run_status,
      blocked_reason: row.run_blocked_reason,
      output_checksum: row.run_output_checksum,
      item_count: row.run_item_count,
      total_wallets: row.run_total_wallets,
      created_by_actor_id: row.run_created_by_actor_id,
      finalized_by_actor_id: row.run_finalized_by_actor_id,
      finalized_at: row.run_finalized_at,
      created_at: row.run_created_at,
      updated_at: row.run_updated_at
    })
  };
}

function normalizeDraftInput(input: CreateDistributionDraftInput): CreateDistributionDraftInput {
  const normalized = {
    periodKey: assertNonEmpty(input.periodKey, "periodKey"),
    collectionAddress: assertNonEmpty(input.collectionAddress, "collectionAddress"),
    propertyId: assertNonEmpty(input.propertyId, "propertyId"),
    periodStartAt: assertNonEmpty(input.periodStartAt, "periodStartAt"),
    periodEndAt: assertNonEmpty(input.periodEndAt, "periodEndAt"),
    policyVersion: assertNonEmpty(input.policyVersion, "policyVersion"),
    tokenMint: assertNonEmpty(input.tokenMint, "tokenMint"),
    totalAmountMinor: assertNonNegativeBigInt(input.totalAmountMinor, "totalAmountMinor"),
    createdByActorId: assertNonEmpty(input.createdByActorId, "createdByActorId")
  };

  assertValidPeriod(normalized.periodStartAt, normalized.periodEndAt);
  return normalized;
}

function requireRun(runId: string): DistributionRunRecord {
  const run = inMemoryRunsById.get(runId);
  if (!run) {
    throw new Error("Distribution run not found.");
  }

  return run;
}

export async function createDistributionDraft(input: CreateDistributionDraftInput): Promise<DistributionRunRecord> {
  const draft = normalizeDraftInput(input);

  if (!isDatabaseConfigured()) {
    const scopeKey = buildScopeKey(draft);
    const existingId = inMemoryRunIdByScope.get(scopeKey);
    if (existingId) {
      return requireRun(existingId);
    }

    const now = new Date().toISOString();
    const run: DistributionRunRecord = {
      id: randomUUID(),
      periodKey: draft.periodKey,
      collectionAddress: draft.collectionAddress,
      propertyId: draft.propertyId,
      periodStartAt: draft.periodStartAt,
      periodEndAt: draft.periodEndAt,
      periodTimezone: "America/Bogota",
      policyVersion: draft.policyVersion,
      tokenMint: draft.tokenMint,
      totalAmountMinor: draft.totalAmountMinor,
      status: "draft",
      blockedReason: null,
      outputChecksum: null,
      itemCount: 0,
      totalWallets: 0,
      createdByActorId: draft.createdByActorId,
      finalizedByActorId: null,
      finalizedAt: null,
      createdAt: now,
      updatedAt: now
    };

    inMemoryRunsById.set(run.id, run);
    inMemoryRunIdByScope.set(scopeKey, run.id);
    return run;
  }

  return withDbClient(async (client) => {
    const result = await client.query<DistributionRunRow>(
      `INSERT INTO distribution_runs (
         id,
         period_key,
         collection_address,
         property_id,
         period_start_at,
         period_end_at,
         period_timezone,
         policy_version,
         token_mint,
         total_amount_minor,
         status,
         created_by_actor_id
       ) VALUES ($1, $2, $3, $4, $5, $6, 'America/Bogota', $7, $8, $9, 'draft', $10)
       ON CONFLICT (period_key, policy_version, collection_address, property_id) DO UPDATE
       SET updated_at = distribution_runs.updated_at
       RETURNING ${runColumns}`,
      [
        randomUUID(),
        draft.periodKey,
        draft.collectionAddress,
        draft.propertyId,
        draft.periodStartAt,
        draft.periodEndAt,
        draft.policyVersion,
        draft.tokenMint,
        draft.totalAmountMinor.toString(),
        draft.createdByActorId
      ]
    );

    return mapRunRow(result.rows[0] as DistributionRunRow);
  });
}

export async function getDistributionRunById(runId: string): Promise<DistributionRunRecord | null> {
  const id = assertNonEmpty(runId, "runId");

  if (!isDatabaseConfigured()) {
    return inMemoryRunsById.get(id) ?? null;
  }

  return withDbClient(async (client) => {
    const result = await client.query<DistributionRunRow>(
      `SELECT ${runColumns}
       FROM distribution_runs
       WHERE id = $1`,
      [id]
    );

    return result.rows[0] ? mapRunRow(result.rows[0]) : null;
  });
}

export async function listDistributionRuns(): Promise<DistributionRunRecord[]> {
  if (!isDatabaseConfigured()) {
    return Array.from(inMemoryRunsById.values()).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  return withDbClient(async (client) => {
    const result = await client.query<DistributionRunRow>(
      `SELECT ${runColumns}
       FROM distribution_runs
       ORDER BY created_at DESC, id DESC
       LIMIT 100`
    );

    return result.rows.map((row) => mapRunRow(row));
  });
}

export async function replaceDistributionItems(input: ReplaceDistributionItemsInput): Promise<DistributionItemRecord[]> {
  const runId = assertNonEmpty(input.runId, "runId");
  const outputChecksum = input.outputChecksum ? assertNonEmpty(input.outputChecksum, "outputChecksum") : null;
  const items = input.items.map((item) => ({
    walletPublicKey: assertNonEmpty(item.walletPublicKey, "walletPublicKey"),
    assetAddress: item.assetAddress ? assertNonEmpty(item.assetAddress, "assetAddress") : null,
    frozenSeconds: assertNonNegativeBigInt(item.frozenSeconds, "frozenSeconds"),
    amountMinor: assertNonNegativeBigInt(item.amountMinor, "amountMinor"),
    roundingRemainderRank: item.roundingRemainderRank ?? null,
    exclusionReason: item.exclusionReason ?? null,
    itemPayload: item.itemPayload ?? {}
  }));

  if (!isDatabaseConfigured()) {
    const run = requireRun(runId);
    if (run.status === "finalized") {
      throw new Error("Finalized distribution runs are immutable.");
    }

    const now = new Date().toISOString();
    const records = items.map<DistributionItemRecord>((item) => ({
      id: randomUUID(),
      runId,
      walletPublicKey: item.walletPublicKey,
      assetAddress: item.assetAddress,
      frozenSeconds: item.frozenSeconds,
      amountMinor: item.amountMinor,
      roundingRemainderRank: item.roundingRemainderRank,
      exclusionReason: item.exclusionReason,
      itemPayload: item.itemPayload,
      createdAt: now
    }));
    const uniqueWallets = new Set(records.map((item) => item.walletPublicKey));

    inMemoryItemsByRunId.set(runId, records);
    inMemoryRunsById.set(runId, {
      ...run,
      outputChecksum,
      itemCount: records.length,
      totalWallets: uniqueWallets.size,
      updatedAt: now
    });
    return records;
  }

  return withDbClient(async (client) => {
    await client.query("BEGIN");

    try {
      await client.query("DELETE FROM distribution_items WHERE run_id = $1", [runId]);

      const records: DistributionItemRecord[] = [];
      for (const item of items) {
        const result = await client.query<DistributionItemRow>(
          `INSERT INTO distribution_items (
             id,
             run_id,
             wallet_public_key,
             asset_address,
             frozen_seconds,
             amount_minor,
             rounding_remainder_rank,
             exclusion_reason,
             item_payload
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
           RETURNING ${itemColumns}`,
          [
            randomUUID(),
            runId,
            item.walletPublicKey,
            item.assetAddress,
            item.frozenSeconds.toString(),
            item.amountMinor.toString(),
            item.roundingRemainderRank,
            item.exclusionReason,
            JSON.stringify(item.itemPayload)
          ]
        );
        records.push(mapItemRow(result.rows[0] as DistributionItemRow));
      }

      const uniqueWallets = new Set(records.map((item) => item.walletPublicKey));
      await client.query(
        `UPDATE distribution_runs
         SET item_count = $2,
             total_wallets = $3,
             output_checksum = $4
         WHERE id = $1`,
        [runId, records.length, uniqueWallets.size, outputChecksum]
      );
      await client.query("COMMIT");
      return records;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function listDistributionItemsByWallet(walletPublicKey: string): Promise<DistributionItemWithRunRecord[]> {
  const wallet = assertNonEmpty(walletPublicKey, "walletPublicKey");

  if (!isDatabaseConfigured()) {
    const records: DistributionItemWithRunRecord[] = [];

    for (const [runId, items] of inMemoryItemsByRunId.entries()) {
      const run = inMemoryRunsById.get(runId);
      if (!run) {
        continue;
      }

      for (const item of items) {
        if (item.walletPublicKey === wallet) {
          records.push({ ...item, run: { ...run } });
        }
      }
    }

    return records.sort((left, right) => (
      right.run.periodEndAt.localeCompare(left.run.periodEndAt)
      || right.createdAt.localeCompare(left.createdAt)
      || right.id.localeCompare(left.id)
    ));
  }

  return withDbClient(async (client) => {
    const result = await client.query<DistributionItemWithRunRow>(
      `SELECT
         i.id AS item_id,
         i.run_id AS item_run_id,
         i.wallet_public_key AS item_wallet_public_key,
         i.asset_address AS item_asset_address,
         i.frozen_seconds AS item_frozen_seconds,
         i.amount_minor AS item_amount_minor,
         i.rounding_remainder_rank AS item_rounding_remainder_rank,
         i.exclusion_reason AS item_exclusion_reason,
         i.item_payload,
         i.created_at AS item_created_at,
         r.id AS run_id,
         r.period_key AS run_period_key,
         r.collection_address AS run_collection_address,
         r.property_id AS run_property_id,
         r.period_start_at AS run_period_start_at,
         r.period_end_at AS run_period_end_at,
         r.period_timezone AS run_period_timezone,
         r.policy_version AS run_policy_version,
         r.token_mint AS run_token_mint,
         r.total_amount_minor AS run_total_amount_minor,
         r.status AS run_status,
         r.blocked_reason AS run_blocked_reason,
         r.output_checksum AS run_output_checksum,
         r.item_count AS run_item_count,
         r.total_wallets AS run_total_wallets,
         r.created_by_actor_id AS run_created_by_actor_id,
         r.finalized_by_actor_id AS run_finalized_by_actor_id,
         r.finalized_at AS run_finalized_at,
         r.created_at AS run_created_at,
         r.updated_at AS run_updated_at
       FROM distribution_items i
       INNER JOIN distribution_runs r ON r.id = i.run_id
       WHERE i.wallet_public_key = $1
       ORDER BY r.period_end_at DESC, i.created_at DESC, i.id DESC
       LIMIT 100`,
      [wallet]
    );

    return result.rows.map((row) => mapItemWithRunRow(row));
  });
}

/**
 * Lists all distribution item records associated with a specific distribution run ID.
 *
 * @param runId - The distribution run identifier
 * @returns Array of distribution item records
 */
export async function listDistributionItemsByRunId(runId: string): Promise<DistributionItemRecord[]> {
  const id = assertNonEmpty(runId, "runId");

  if (!isDatabaseConfigured()) {
    return inMemoryItemsByRunId.get(id) ?? [];
  }

  return withDbClient(async (client) => {
    const result = await client.query<DistributionItemRow>(
      `SELECT ${itemColumns}
       FROM distribution_items
       WHERE run_id = $1
       ORDER BY amount_minor DESC, id ASC`,
      [id]
    );

    return result.rows.map((row) => mapItemRow(row));
  });
}

export async function blockDistributionRun(input: BlockDistributionRunInput): Promise<DistributionRunRecord> {
  const runId = assertNonEmpty(input.runId, "runId");
  const blockedReason = assertNonEmpty(input.blockedReason, "blockedReason");

  if (!isDatabaseConfigured()) {
    const run = requireRun(runId);
    if (run.status === "finalized") {
      throw new Error("Finalized distribution runs are immutable.");
    }

    const blocked = {
      ...run,
      status: "blocked" as const,
      blockedReason,
      updatedAt: new Date().toISOString()
    };
    inMemoryRunsById.set(runId, blocked);
    return blocked;
  }

  return withDbClient(async (client) => {
    const result = await client.query<DistributionRunRow>(
      `UPDATE distribution_runs
       SET status = 'blocked',
           blocked_reason = $2
       WHERE id = $1
       RETURNING ${runColumns}`,
      [runId, blockedReason]
    );

    if (!result.rows[0]) {
      throw new Error("Distribution run not found.");
    }

    return mapRunRow(result.rows[0]);
  });
}

export async function finalizeDistributionRun(input: FinalizeDistributionRunInput): Promise<DistributionRunRecord> {
  const runId = assertNonEmpty(input.runId, "runId");
  const outputChecksum = assertNonEmpty(input.outputChecksum, "outputChecksum");
  const finalizedByActorId = assertNonEmpty(input.finalizedByActorId, "finalizedByActorId");

  if (!isDatabaseConfigured()) {
    const run = requireRun(runId);
    if (run.itemCount <= 0) {
      throw new Error("Distribution run has no prepared items.");
    }
    if (run.outputChecksum && run.outputChecksum !== outputChecksum) {
      throw new Error("Distribution run checksum does not match prepared output.");
    }

    const now = new Date().toISOString();
    const finalized: DistributionRunRecord = {
      ...run,
      status: "finalized",
      outputChecksum,
      finalizedByActorId,
      finalizedAt: now,
      updatedAt: now
    };
    inMemoryRunsById.set(runId, finalized);
    return finalized;
  }

  return withDbClient(async (client) => finalizeDistributionRunWithClient(client, {
    runId,
    outputChecksum,
    finalizedByActorId
  }));
}

async function finalizeDistributionRunWithClient(
  client: PoolClient,
  input: FinalizeDistributionRunInput
): Promise<DistributionRunRecord> {
  const current = await client.query<DistributionRunRow>(
    `SELECT ${runColumns}
     FROM distribution_runs
     WHERE id = $1
     FOR UPDATE`,
    [input.runId]
  );
  const run = current.rows[0] ? mapRunRow(current.rows[0]) : null;

  if (!run) {
    throw new Error("Distribution run not found.");
  }

  if (run.itemCount <= 0) {
    throw new Error("Distribution run has no prepared items.");
  }
  if (run.outputChecksum && run.outputChecksum !== input.outputChecksum) {
    throw new Error("Distribution run checksum does not match prepared output.");
  }

  const result = await client.query<DistributionRunRow>(
    `UPDATE distribution_runs
     SET status = 'finalized',
         output_checksum = $2,
         finalized_by_actor_id = $3,
         finalized_at = NOW()
     WHERE id = $1
     RETURNING ${runColumns}`,
    [input.runId, input.outputChecksum, input.finalizedByActorId]
  );

  return mapRunRow(result.rows[0] as DistributionRunRow);
}

export async function appendDistributionAuditEvent(
  input: AppendDistributionAuditEventInput
): Promise<DistributionAuditEventRecord> {
  const event = {
    runId: assertNonEmpty(input.runId, "runId"),
    eventName: assertNonEmpty(input.eventName, "eventName"),
    actorType: assertNonEmpty(input.actorType, "actorType"),
    actorId: assertNonEmpty(input.actorId, "actorId"),
    eventPayload: input.eventPayload ?? {}
  };

  if (!isDatabaseConfigured()) {
    requireRun(event.runId);
    const record: DistributionAuditEventRecord = {
      id: randomUUID(),
      runId: event.runId,
      eventName: event.eventName,
      actorType: event.actorType,
      actorId: event.actorId,
      eventPayload: event.eventPayload,
      createdAt: new Date().toISOString()
    };
    const events = inMemoryAuditEventsByRunId.get(event.runId) ?? [];
    inMemoryAuditEventsByRunId.set(event.runId, [...events, record]);
    return record;
  }

  return withDbClient(async (client) => {
    const result = await client.query<DistributionAuditEventRow>(
      `INSERT INTO distribution_audit_events (
         id,
         run_id,
         event_name,
         actor_type,
         actor_id,
         event_payload
       ) VALUES ($1, $2, $3, $4, $5, $6::jsonb)
       RETURNING ${auditColumns}`,
      [
        randomUUID(),
        event.runId,
        event.eventName,
        event.actorType,
        event.actorId,
        JSON.stringify(event.eventPayload)
      ]
    );

    return mapAuditRow(result.rows[0] as DistributionAuditEventRow);
  });
}

export async function listDistributionAuditEvents(runId: string): Promise<DistributionAuditEventRecord[]> {
  const id = assertNonEmpty(runId, "runId");

  if (!isDatabaseConfigured()) {
    return [...(inMemoryAuditEventsByRunId.get(id) ?? [])];
  }

  return withDbClient(async (client) => {
    const result = await client.query<DistributionAuditEventRow>(
      `SELECT ${auditColumns}
       FROM distribution_audit_events
       WHERE run_id = $1
       ORDER BY created_at ASC, id ASC`,
      [id]
    );

    return result.rows.map((row) => mapAuditRow(row));
  });
}
