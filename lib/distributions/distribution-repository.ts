import { randomUUID } from "node:crypto";

import type { PoolClient } from "pg";

import { withDbClient } from "@/lib/db/pool";

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

export async function replaceDistributionItems(input: ReplaceDistributionItemsInput): Promise<DistributionItemRecord[]> {
  const runId = assertNonEmpty(input.runId, "runId");
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
             total_wallets = $3
         WHERE id = $1`,
        [runId, records.length, uniqueWallets.size]
      );
      await client.query("COMMIT");
      return records;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
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
