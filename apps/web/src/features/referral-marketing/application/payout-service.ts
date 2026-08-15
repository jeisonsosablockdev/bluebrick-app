import { randomUUID } from "node:crypto";

import type { PoolClient } from "pg";

import { withDbClient } from "@/lib/db/pool";
import type { ReferralRewardStatus } from "@/lib/referrals/domain";
import { listReferralAttributionsForReferrer, type ReferralMetadata } from "@/lib/referrals/repository";
import {
  listReferralRewardEventsByAttributionIds,
  transitionReferralRewardEventStatuses,
  type ReferralRewardEventRecord
} from "@/lib/referrals/reward-engine";

export type ReferralPayoutStatus = "draft" | "approved" | "executed" | "failed" | "canceled";

export type ReferralPayoutRecord = {
  id: string;
  referrerWalletPublicKey: string;
  totalAmountUsdc: number;
  status: ReferralPayoutStatus;
  approvedByActorId: string | null;
  approvedAt: string | null;
  executedByActorId: string | null;
  executedAt: string | null;
  payoutTxSignature: string | null;
  notes: string | null;
  createdAt: string;
};

export type ReferralPayoutItemRecord = {
  id: string;
  payoutId: string;
  rewardEventId: string;
  amountUsdc: number;
  createdAt: string;
};

export type CreateReferralPayoutBatchInput = {
  referrerWalletPublicKey: string;
  approvedByActorId: string;
  notes?: string;
};

export type CreateReferralPayoutBatchResult = {
  payout: ReferralPayoutRecord;
  items: ReferralPayoutItemRecord[];
  itemCount: number;
};

type ReferralPayoutRow = {
  id: string;
  referrer_wallet_public_key: string;
  total_amount_usdc: string | number;
  status: ReferralPayoutStatus;
  approved_by_actor_id: string | null;
  approved_at: string | Date | null;
  executed_by_actor_id: string | null;
  executed_at: string | Date | null;
  payout_tx_signature: string | null;
  notes: string | null;
  created_at: string | Date;
};

type ReferralPayoutItemRow = {
  id: string;
  payout_id: string;
  reward_event_id: string;
  amount_usdc: string | number;
  created_at: string | Date;
};

const inMemoryPayoutsById = new Map<string, ReferralPayoutRecord>();
const inMemoryPayoutItemsById = new Map<string, ReferralPayoutItemRecord>();
const inMemoryPayoutItemIdsByPayout = new Map<string, string[]>();

function isReferralDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function nowIso(): string {
  return new Date().toISOString();
}

function toIso(value: string | Date | null): string | null {
  if (value === null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

function toNumber(value: string | number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error("Invalid payout numeric value.");
  }

  return parsed;
}

function clonePayout(record: ReferralPayoutRecord): ReferralPayoutRecord {
  return { ...record };
}

function clonePayoutItem(record: ReferralPayoutItemRecord): ReferralPayoutItemRecord {
  return { ...record };
}

function mapPayoutRow(row: ReferralPayoutRow): ReferralPayoutRecord {
  return {
    id: row.id,
    referrerWalletPublicKey: row.referrer_wallet_public_key,
    totalAmountUsdc: toNumber(row.total_amount_usdc),
    status: row.status,
    approvedByActorId: row.approved_by_actor_id,
    approvedAt: toIso(row.approved_at),
    executedByActorId: row.executed_by_actor_id,
    executedAt: toIso(row.executed_at),
    payoutTxSignature: row.payout_tx_signature,
    notes: row.notes,
    createdAt: toIso(row.created_at) ?? nowIso()
  };
}

function mapPayoutItemRow(row: ReferralPayoutItemRow): ReferralPayoutItemRecord {
  return {
    id: row.id,
    payoutId: row.payout_id,
    rewardEventId: row.reward_event_id,
    amountUsdc: toNumber(row.amount_usdc),
    createdAt: toIso(row.created_at) ?? nowIso()
  };
}

function setInMemoryPayout(record: ReferralPayoutRecord): void {
  inMemoryPayoutsById.set(record.id, clonePayout(record));
}

function appendInMemoryPayoutItem(record: ReferralPayoutItemRecord): void {
  inMemoryPayoutItemsById.set(record.id, clonePayoutItem(record));
  const current = inMemoryPayoutItemIdsByPayout.get(record.payoutId) ?? [];
  inMemoryPayoutItemIdsByPayout.set(record.payoutId, [...current, record.id]);
}

async function withTransaction<T>(client: PoolClient, work: () => Promise<T>): Promise<T> {
  await client.query("BEGIN");

  try {
    const result = await work();
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function getPayoutByIdWithClient(
  client: PoolClient,
  input: {
    payoutId: string;
    forUpdate?: boolean;
  }
): Promise<ReferralPayoutRecord | null> {
  const result = await client.query<ReferralPayoutRow>(
    `SELECT
       id,
       referrer_wallet_public_key,
       total_amount_usdc,
       status,
       approved_by_actor_id,
       approved_at,
       executed_by_actor_id,
       executed_at,
       payout_tx_signature,
       notes,
       created_at
     FROM referral_payouts
     WHERE id = $1
     LIMIT 1
     ${input.forUpdate ? "FOR UPDATE" : ""}`,
    [input.payoutId]
  );

  if ((result.rowCount ?? 0) === 0) {
    return null;
  }

  return mapPayoutRow(result.rows[0] as ReferralPayoutRow);
}

async function listPayoutItemsByPayoutIdWithClient(
  client: PoolClient,
  payoutId: string
): Promise<ReferralPayoutItemRecord[]> {
  const result = await client.query<ReferralPayoutItemRow>(
    `SELECT
       id,
       payout_id,
       reward_event_id,
       amount_usdc,
       created_at
     FROM referral_payout_items
     WHERE payout_id = $1
     ORDER BY created_at ASC`,
    [payoutId]
  );

  return result.rows.map((row) => mapPayoutItemRow(row));
}

async function buildInMemoryAccruedRewardSelection(input: {
  referrerWalletPublicKey: string;
}): Promise<ReferralRewardEventRecord[]> {
  const attributions = await listReferralAttributionsForReferrer({
    referrerWalletPublicKey: input.referrerWalletPublicKey
  });

  return (await listReferralRewardEventsByAttributionIds({
    attributionIds: attributions.map((attribution) => attribution.id)
  }))
    .filter((event) => event.status === "accrued")
    .sort((left, right) => left.qualifiedAt.localeCompare(right.qualifiedAt));
}

export function __resetReferralPayoutServiceStateForTests(): void {
  inMemoryPayoutsById.clear();
  inMemoryPayoutItemsById.clear();
  inMemoryPayoutItemIdsByPayout.clear();
}

export async function createReferralPayoutBatch(
  input: CreateReferralPayoutBatchInput
): Promise<CreateReferralPayoutBatchResult | null> {
  const notes = input.notes?.trim() || null;
  const approvedAt = nowIso();

  if (!isReferralDatabaseConfigured()) {
    const accruedEvents = await buildInMemoryAccruedRewardSelection({
      referrerWalletPublicKey: input.referrerWalletPublicKey
    });

    if (accruedEvents.length === 0) {
      return null;
    }

    const payout: ReferralPayoutRecord = {
      id: randomUUID(),
      referrerWalletPublicKey: input.referrerWalletPublicKey,
      totalAmountUsdc: accruedEvents.reduce((sum, event) => sum + event.rewardAmountUsdc, 0),
      status: "approved",
      approvedByActorId: input.approvedByActorId,
      approvedAt,
      executedByActorId: null,
      executedAt: null,
      payoutTxSignature: null,
      notes,
      createdAt: approvedAt
    };

    setInMemoryPayout(payout);

    const items = accruedEvents.map((event) => {
      const item: ReferralPayoutItemRecord = {
        id: randomUUID(),
        payoutId: payout.id,
        rewardEventId: event.id,
        amountUsdc: event.rewardAmountUsdc,
        createdAt: approvedAt
      };

      appendInMemoryPayoutItem(item);
      return clonePayoutItem(item);
    });

    await transitionReferralRewardEventStatuses({
      eventIds: items.map((item) => item.rewardEventId),
      fromStatuses: ["accrued"],
      toStatus: "pending_admin_distribution"
    });

    return {
      payout: clonePayout(payout),
      items,
      itemCount: items.length
    };
  }

  return withDbClient((client) =>
    withTransaction(client, async () => {
      const eligibleEvents = await client.query<
        Pick<ReferralRewardEventRecord, "id" | "rewardAmountUsdc" | "qualifiedAt">
      >(
        `SELECT
           re.id,
           re.reward_amount_usdc AS "rewardAmountUsdc",
           re.qualified_at AS "qualifiedAt"
         FROM referral_reward_events re
         JOIN referral_attributions ra ON ra.id = re.attribution_id
         WHERE ra.referrer_wallet_public_key = $1
           AND re.status = 'accrued'
           AND NOT EXISTS (
             SELECT 1
             FROM referral_payout_items rpi
             WHERE rpi.reward_event_id = re.id
           )
         ORDER BY re.qualified_at ASC
         FOR UPDATE OF re`,
        [input.referrerWalletPublicKey]
      );

      if ((eligibleEvents.rowCount ?? 0) === 0) {
        return null;
      }

      const totalAmountUsdc = eligibleEvents.rows.reduce(
        (sum, row) => sum + toNumber(row.rewardAmountUsdc),
        0
      );

      const payoutResult = await client.query<ReferralPayoutRow>(
        `INSERT INTO referral_payouts (
           referrer_wallet_public_key,
           total_amount_usdc,
           status,
           approved_by_actor_id,
           approved_at,
           notes
         ) VALUES ($1, $2, 'approved', $3, $4, $5)
         RETURNING
           id,
           referrer_wallet_public_key,
           total_amount_usdc,
           status,
           approved_by_actor_id,
           approved_at,
           executed_by_actor_id,
           executed_at,
           payout_tx_signature,
           notes,
           created_at`,
        [input.referrerWalletPublicKey, totalAmountUsdc, input.approvedByActorId, approvedAt, notes]
      );

      const payout = mapPayoutRow(payoutResult.rows[0] as ReferralPayoutRow);
      const items: ReferralPayoutItemRecord[] = [];

      for (const event of eligibleEvents.rows) {
        const insertedItem = await client.query<ReferralPayoutItemRow>(
          `INSERT INTO referral_payout_items (
             payout_id,
             reward_event_id,
             amount_usdc
           ) VALUES ($1, $2, $3)
           RETURNING
             id,
             payout_id,
             reward_event_id,
             amount_usdc,
             created_at`,
          [payout.id, event.id, toNumber(event.rewardAmountUsdc)]
        );

        items.push(mapPayoutItemRow(insertedItem.rows[0] as ReferralPayoutItemRow));
      }

      await client.query(
        `UPDATE referral_reward_events
         SET status = 'pending_admin_distribution'
         WHERE id = ANY($1::uuid[])
           AND status = 'accrued'`,
        [items.map((item) => item.rewardEventId)]
      );

      return {
        payout,
        items,
        itemCount: items.length
      } satisfies CreateReferralPayoutBatchResult;
    })
  );
}

export async function executeReferralPayout(input: {
  payoutId: string;
  executedByActorId: string;
  payoutTxSignature: string;
}): Promise<ReferralPayoutRecord | null> {
  const executedAt = nowIso();
  const payoutTxSignature = input.payoutTxSignature.trim();

  if (!isReferralDatabaseConfigured()) {
    const current = inMemoryPayoutsById.get(input.payoutId);
    if (!current || current.status !== "approved") {
      return current ? clonePayout(current) : null;
    }

    const next: ReferralPayoutRecord = {
      ...current,
      status: "executed",
      executedByActorId: input.executedByActorId,
      executedAt,
      payoutTxSignature
    };

    setInMemoryPayout(next);

    const rewardEventIds = (inMemoryPayoutItemIdsByPayout.get(input.payoutId) ?? [])
      .map((itemId) => inMemoryPayoutItemsById.get(itemId))
      .filter((item): item is ReferralPayoutItemRecord => Boolean(item))
      .map((item) => item.rewardEventId);

    await transitionReferralRewardEventStatuses({
      eventIds: rewardEventIds,
      fromStatuses: ["pending_admin_distribution"],
      toStatus: "paid"
    });

    return clonePayout(next);
  }

  return withDbClient((client) =>
    withTransaction(client, async () => {
      const current = await getPayoutByIdWithClient(client, {
        payoutId: input.payoutId,
        forUpdate: true
      });

      if (!current || current.status !== "approved") {
        return current;
      }

      const updated = await client.query<ReferralPayoutRow>(
        `UPDATE referral_payouts
         SET status = 'executed',
             executed_by_actor_id = $2,
             executed_at = $3,
             payout_tx_signature = $4
         WHERE id = $1
           AND status = 'approved'
         RETURNING
           id,
           referrer_wallet_public_key,
           total_amount_usdc,
           status,
           approved_by_actor_id,
           approved_at,
           executed_by_actor_id,
           executed_at,
           payout_tx_signature,
           notes,
           created_at`,
        [input.payoutId, input.executedByActorId, executedAt, payoutTxSignature]
      );

      if ((updated.rowCount ?? 0) === 0) {
        return current;
      }

      await client.query(
        `UPDATE referral_reward_events
         SET status = 'paid'
         WHERE id IN (
           SELECT reward_event_id
           FROM referral_payout_items
           WHERE payout_id = $1
         )
           AND status = 'pending_admin_distribution'`,
        [input.payoutId]
      );

      return mapPayoutRow(updated.rows[0] as ReferralPayoutRow);
    })
  );
}

export async function listReferralPayoutsForReferrer(input: {
  referrerWalletPublicKey: string;
}): Promise<ReferralPayoutRecord[]> {
  if (!isReferralDatabaseConfigured()) {
    return Array.from(inMemoryPayoutsById.values())
      .filter((payout) => payout.referrerWalletPublicKey === input.referrerWalletPublicKey)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map((payout) => clonePayout(payout));
  }

  return withDbClient(async (client) => {
    const result = await client.query<ReferralPayoutRow>(
      `SELECT
         id,
         referrer_wallet_public_key,
         total_amount_usdc,
         status,
         approved_by_actor_id,
         approved_at,
         executed_by_actor_id,
         executed_at,
         payout_tx_signature,
         notes,
         created_at
       FROM referral_payouts
       WHERE referrer_wallet_public_key = $1
       ORDER BY created_at DESC`,
      [input.referrerWalletPublicKey]
    );

    return result.rows.map((row) => mapPayoutRow(row));
  });
}

export async function listReferralPayoutItems(input: {
  payoutId: string;
}): Promise<ReferralPayoutItemRecord[]> {
  if (!isReferralDatabaseConfigured()) {
    return (inMemoryPayoutItemIdsByPayout.get(input.payoutId) ?? [])
      .map((itemId) => inMemoryPayoutItemsById.get(itemId))
      .filter((item): item is ReferralPayoutItemRecord => Boolean(item))
      .map((item) => clonePayoutItem(item));
  }

  return withDbClient((client) => listPayoutItemsByPayoutIdWithClient(client, input.payoutId));
}
