import { randomUUID } from "node:crypto";

import type { PoolClient } from "pg";

import { withDbClient } from "@/lib/db/pool";
import {
  buildWindowEndIso,
  DEFAULT_REFERRAL_ELIGIBILITY_WINDOW_DAYS,
  DEFAULT_REFERRAL_HOLDING_PERIOD_DAYS,
  DEFAULT_REFERRAL_SETTLEMENT_WINDOW_DAYS,
  type ReferralRewardStatus
} from "@/lib/referrals/domain";
import {
  getActiveReferralAttributionByInviteeWallet,
  type ReferralAttributionRecord,
  type ReferralMetadata
} from "@/lib/referrals/repository";

export type ReferralRewardRuleRecord = {
  id: string;
  eligibleCollectionAddress: string;
  rewardAmountUsdc: number;
  settlementWindowDays: number;
  holdingPeriodDays: number;
  eligibilityWindowDays: number;
  activeFrom: string;
  activeTo: string | null;
  metadata: ReferralMetadata;
};

export type ReferralRewardEventRecord = {
  id: string;
  attributionId: string;
  ruleId: string;
  purchaseAttemptId: string;
  purchaseWebhookEventId: string | null;
  nftPurchaseEventId: string | null;
  transactionSignature: string;
  collectionAddress: string;
  nftMintAddress: string;
  rewardAmountUsdc: number;
  qualifiedAt: string;
  settlementEndsAt: string;
  status: ReferralRewardStatus;
  idempotencyKey: string;
  auditPayload: ReferralMetadata;
};

export type SetReferralRewardRuleInput = {
  eligibleCollectionAddress: string;
  rewardAmountUsdc: number;
  settlementWindowDays?: number;
  holdingPeriodDays?: number;
  eligibilityWindowDays?: number;
  activeFrom?: string;
  activeTo?: string | null;
  metadata?: ReferralMetadata;
};

export type RecordReferralPurchaseSignalInput = {
  inviteeWalletPublicKey: string;
  purchaseAttemptId: string;
  purchaseWebhookEventId?: string | null;
  nftPurchaseEventId?: string | null;
  transactionSignature: string;
  collectionAddress: string;
  nftMintAddress: string;
  confirmedAt?: string;
  auditPayload?: ReferralMetadata;
};

export type RecordReferralPurchaseSignalResult =
  | {
      outcome: "created";
      event: ReferralRewardEventRecord;
    }
  | {
      outcome: "duplicate";
      event: ReferralRewardEventRecord;
    }
  | {
      outcome: "ignored_no_active_attribution" | "ignored_no_active_rule" | "ignored_outside_window";
    };

export type RewardSettlementDecision = boolean | "risk_hold";

type RewardRuleRow = {
  id: string;
  eligible_collection_address: string;
  reward_amount_usdc: string | number;
  settlement_window_days: number;
  holding_period_days: number;
  eligibility_window_days: number;
  active_from: string | Date;
  active_to: string | Date | null;
  metadata_json: unknown;
};

type RewardEventRow = {
  id: string;
  attribution_id: string;
  rule_id: string;
  purchase_attempt_id: string;
  purchase_webhook_event_id: string | null;
  nft_purchase_event_id: string | null;
  transaction_signature: string;
  collection_address: string;
  nft_mint_address: string;
  reward_amount_usdc: string | number;
  qualified_at: string | Date;
  settlement_ends_at: string | Date;
  status: ReferralRewardStatus;
  idempotency_key: string;
  audit_payload: unknown;
};

type ReferralAttributionLiteRow = {
  id: string;
  bound_at: string | Date;
  eligibility_window_ends_at: string | Date;
  kyc_approved_at: string | Date | null;
  status: ReferralAttributionRecord["status"];
};

const inMemoryRewardRulesById = new Map<string, ReferralRewardRuleRecord>();
const inMemoryRewardRuleIdsByCollection = new Map<string, string[]>();
const inMemoryRewardEventsById = new Map<string, ReferralRewardEventRecord>();
const inMemoryRewardEventIdByPurchaseMint = new Map<string, string>();

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
    throw new Error("Invalid numeric value.");
  }

  return parsed;
}

function cloneMetadata(value: ReferralMetadata | undefined): ReferralMetadata {
  return value ? { ...value } : {};
}

function sanitizeMetadata(value: unknown): ReferralMetadata {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return { ...(value as Record<string, unknown>) };
}

function rewardEventLookupKey(purchaseAttemptId: string, nftMintAddress: string): string {
  return `${purchaseAttemptId}:${nftMintAddress}`;
}

function normalizeCollectionAddress(input: string): string {
  return input.trim();
}

function normalizeNftMintAddress(input: string): string {
  return input.trim();
}

function normalizeTransactionSignature(input: string): string {
  return input.trim();
}

function parsePositiveDays(value: number | undefined, fallback: number): number {
  if (!Number.isInteger(value) || Number(value) < 0) {
    return fallback;
  }

  return Number(value);
}

function mapRewardRuleRow(row: RewardRuleRow): ReferralRewardRuleRecord {
  return {
    id: row.id,
    eligibleCollectionAddress: row.eligible_collection_address,
    rewardAmountUsdc: toNumber(row.reward_amount_usdc),
    settlementWindowDays: Number(row.settlement_window_days),
    holdingPeriodDays: Number(row.holding_period_days),
    eligibilityWindowDays: Number(row.eligibility_window_days),
    activeFrom: toIso(row.active_from) ?? nowIso(),
    activeTo: toIso(row.active_to),
    metadata: sanitizeMetadata(row.metadata_json)
  };
}

function mapRewardEventRow(row: RewardEventRow): ReferralRewardEventRecord {
  return {
    id: row.id,
    attributionId: row.attribution_id,
    ruleId: row.rule_id,
    purchaseAttemptId: row.purchase_attempt_id,
    purchaseWebhookEventId: row.purchase_webhook_event_id,
    nftPurchaseEventId: row.nft_purchase_event_id,
    transactionSignature: row.transaction_signature,
    collectionAddress: row.collection_address,
    nftMintAddress: row.nft_mint_address,
    rewardAmountUsdc: toNumber(row.reward_amount_usdc),
    qualifiedAt: toIso(row.qualified_at) ?? nowIso(),
    settlementEndsAt: toIso(row.settlement_ends_at) ?? nowIso(),
    status: row.status,
    idempotencyKey: row.idempotency_key,
    auditPayload: sanitizeMetadata(row.audit_payload)
  };
}

function setInMemoryRewardRule(record: ReferralRewardRuleRecord): void {
  inMemoryRewardRulesById.set(record.id, {
    ...record,
    metadata: { ...record.metadata }
  });

  const currentIds = inMemoryRewardRuleIdsByCollection.get(record.eligibleCollectionAddress) ?? [];
  if (!currentIds.includes(record.id)) {
    inMemoryRewardRuleIdsByCollection.set(record.eligibleCollectionAddress, [...currentIds, record.id]);
  }
}

function setInMemoryRewardEvent(record: ReferralRewardEventRecord): void {
  inMemoryRewardEventsById.set(record.id, {
    ...record,
    auditPayload: { ...record.auditPayload }
  });
  inMemoryRewardEventIdByPurchaseMint.set(
    rewardEventLookupKey(record.purchaseAttemptId, record.nftMintAddress),
    record.id
  );
}

function getInMemoryRewardEventById(id: string): ReferralRewardEventRecord | null {
  const found = inMemoryRewardEventsById.get(id);

  if (!found) {
    return null;
  }

  return {
    ...found,
    auditPayload: { ...found.auditPayload }
  };
}

function getInMemoryActiveRuleForCollection(
  collectionAddress: string,
  effectiveAt: string
): ReferralRewardRuleRecord | null {
  const ruleIds = inMemoryRewardRuleIdsByCollection.get(collectionAddress) ?? [];
  const effectiveAtMs = new Date(effectiveAt).getTime();

  const candidates = ruleIds
    .map((id) => inMemoryRewardRulesById.get(id))
    .filter((item): item is ReferralRewardRuleRecord => Boolean(item))
    .filter((rule) => {
      const activeFromMs = new Date(rule.activeFrom).getTime();
      const activeToMs = rule.activeTo ? new Date(rule.activeTo).getTime() : Number.POSITIVE_INFINITY;

      return activeFromMs <= effectiveAtMs && activeToMs >= effectiveAtMs;
    })
    .sort((left, right) => right.activeFrom.localeCompare(left.activeFrom));

  if (!candidates[0]) {
    return null;
  }

  return {
    ...candidates[0],
    metadata: { ...candidates[0].metadata }
  };
}

async function getActiveRewardRuleForCollectionWithClient(
  client: PoolClient,
  input: {
    collectionAddress: string;
    effectiveAt: string;
  }
): Promise<ReferralRewardRuleRecord | null> {
  const result = await client.query<RewardRuleRow>(
    `SELECT
       id,
       eligible_collection_address,
       reward_amount_usdc,
       settlement_window_days,
       holding_period_days,
       eligibility_window_days,
       active_from,
       active_to,
       metadata_json
     FROM referral_reward_rules
     WHERE eligible_collection_address = $1
       AND active_from <= $2
       AND (active_to IS NULL OR active_to >= $2)
     ORDER BY active_from DESC
     LIMIT 1`,
    [input.collectionAddress, input.effectiveAt]
  );

  if ((result.rowCount ?? 0) === 0) {
    return null;
  }

  return mapRewardRuleRow(result.rows[0] as RewardRuleRow);
}

async function getReferralAttributionLiteByInviteeWalletWithClient(
  client: PoolClient,
  inviteeWalletPublicKey: string
): Promise<ReferralAttributionLiteRow | null> {
  const result = await client.query<ReferralAttributionLiteRow>(
    `SELECT
       id,
       bound_at,
       eligibility_window_ends_at,
       kyc_approved_at,
       status
     FROM referral_attributions
     WHERE invitee_wallet_public_key = $1
       AND status IN ('bound_pending_kyc', 'kyc_verified')
     ORDER BY bound_at DESC
     LIMIT 1`,
    [inviteeWalletPublicKey]
  );

  if ((result.rowCount ?? 0) === 0) {
    return null;
  }

  return result.rows[0] as ReferralAttributionLiteRow;
}

async function getRewardEventByPurchaseMintWithClient(
  client: PoolClient,
  input: {
    purchaseAttemptId: string;
    nftMintAddress: string;
  }
): Promise<ReferralRewardEventRecord | null> {
  const result = await client.query<RewardEventRow>(
    `SELECT
       id,
       attribution_id,
       rule_id,
       purchase_attempt_id,
       purchase_webhook_event_id,
       nft_purchase_event_id,
       transaction_signature,
       collection_address,
       nft_mint_address,
       reward_amount_usdc,
       qualified_at,
       settlement_ends_at,
       status,
       idempotency_key,
       audit_payload
     FROM referral_reward_events
     WHERE purchase_attempt_id = $1
       AND nft_mint_address = $2
     LIMIT 1`,
    [input.purchaseAttemptId, input.nftMintAddress]
  );

  if ((result.rowCount ?? 0) === 0) {
    return null;
  }

  return mapRewardEventRow(result.rows[0] as RewardEventRow);
}

async function getRewardEventByIdWithClient(client: PoolClient, id: string): Promise<ReferralRewardEventRecord | null> {
  const result = await client.query<RewardEventRow>(
    `SELECT
       id,
       attribution_id,
       rule_id,
       purchase_attempt_id,
       purchase_webhook_event_id,
       nft_purchase_event_id,
       transaction_signature,
       collection_address,
       nft_mint_address,
       reward_amount_usdc,
       qualified_at,
       settlement_ends_at,
       status,
       idempotency_key,
       audit_payload
     FROM referral_reward_events
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  if ((result.rowCount ?? 0) === 0) {
    return null;
  }

  return mapRewardEventRow(result.rows[0] as RewardEventRow);
}

export function __resetReferralRewardEngineStateForTests(): void {
  inMemoryRewardRulesById.clear();
  inMemoryRewardRuleIdsByCollection.clear();
  inMemoryRewardEventsById.clear();
  inMemoryRewardEventIdByPurchaseMint.clear();
}

export async function listReferralRewardEventsForInvitee(input: {
  inviteeWalletPublicKey: string;
}): Promise<ReferralRewardEventRecord[]> {
  const activeAttribution = await getActiveReferralAttributionByInviteeWallet({
    inviteeWalletPublicKey: input.inviteeWalletPublicKey
  });

  if (!activeAttribution) {
    return [];
  }

  if (!isReferralDatabaseConfigured()) {
    return Array.from(inMemoryRewardEventsById.values())
      .filter((event) => event.attributionId === activeAttribution.id)
      .sort((left, right) => left.qualifiedAt.localeCompare(right.qualifiedAt))
      .map((event) => ({
        ...event,
        auditPayload: { ...event.auditPayload }
      }));
  }

  return withDbClient(async (client) => {
    const result = await client.query<RewardEventRow>(
      `SELECT
         id,
         attribution_id,
         rule_id,
         purchase_attempt_id,
         purchase_webhook_event_id,
         nft_purchase_event_id,
         transaction_signature,
         collection_address,
         nft_mint_address,
         reward_amount_usdc,
         qualified_at,
         settlement_ends_at,
         status,
         idempotency_key,
         audit_payload
       FROM referral_reward_events
       WHERE attribution_id = $1
       ORDER BY qualified_at ASC`,
      [activeAttribution.id]
    );

    return result.rows.map((row) => mapRewardEventRow(row));
  });
}

export async function listReferralRewardEventsByAttributionIds(input: {
  attributionIds: string[];
}): Promise<ReferralRewardEventRecord[]> {
  const attributionIds = [...new Set(input.attributionIds.filter(Boolean))];
  if (attributionIds.length === 0) {
    return [];
  }

  if (!isReferralDatabaseConfigured()) {
    return Array.from(inMemoryRewardEventsById.values())
      .filter((event) => attributionIds.includes(event.attributionId))
      .sort((left, right) => left.qualifiedAt.localeCompare(right.qualifiedAt))
      .map((event) => ({
        ...event,
        auditPayload: { ...event.auditPayload }
      }));
  }

  return withDbClient(async (client) => {
    const result = await client.query<RewardEventRow>(
      `SELECT
         id,
         attribution_id,
         rule_id,
         purchase_attempt_id,
         purchase_webhook_event_id,
         nft_purchase_event_id,
         transaction_signature,
         collection_address,
         nft_mint_address,
         reward_amount_usdc,
         qualified_at,
         settlement_ends_at,
         status,
         idempotency_key,
         audit_payload
       FROM referral_reward_events
       WHERE attribution_id = ANY($1::uuid[])
       ORDER BY qualified_at ASC`,
      [attributionIds]
    );

    return result.rows.map((row) => mapRewardEventRow(row));
  });
}

export async function transitionReferralRewardEventStatuses(input: {
  eventIds: string[];
  fromStatuses?: ReferralRewardStatus[];
  toStatus: ReferralRewardStatus;
}): Promise<ReferralRewardEventRecord[]> {
  const eventIds = [...new Set(input.eventIds.filter(Boolean))];
  if (eventIds.length === 0) {
    return [];
  }

  const allowedStatuses = [...new Set(input.fromStatuses ?? [])];

  if (!isReferralDatabaseConfigured()) {
    const updated: ReferralRewardEventRecord[] = [];

    for (const eventId of eventIds) {
      const current = getInMemoryRewardEventById(eventId);
      if (!current) {
        continue;
      }

      if (allowedStatuses.length > 0 && !allowedStatuses.includes(current.status)) {
        continue;
      }

      const next: ReferralRewardEventRecord = {
        ...current,
        status: input.toStatus
      };

      setInMemoryRewardEvent(next);
      updated.push({
        ...next,
        auditPayload: { ...next.auditPayload }
      });
    }

    updated.sort((left, right) => left.qualifiedAt.localeCompare(right.qualifiedAt));
    return updated;
  }

  return withDbClient(async (client) => {
    const params: Array<string[] | ReferralRewardStatus> = [eventIds, input.toStatus];
    const statusFilterSql =
      allowedStatuses.length > 0
        ? `AND status = ANY($${params.push(allowedStatuses)}::text[])`
        : "";

    const result = await client.query<RewardEventRow>(
      `UPDATE referral_reward_events
       SET status = $2
       WHERE id = ANY($1::uuid[])
       ${statusFilterSql}
       RETURNING
         id,
         attribution_id,
         rule_id,
         purchase_attempt_id,
         purchase_webhook_event_id,
         nft_purchase_event_id,
         transaction_signature,
         collection_address,
         nft_mint_address,
         reward_amount_usdc,
         qualified_at,
         settlement_ends_at,
         status,
         idempotency_key,
         audit_payload`,
      params
    );

    return result.rows
      .map((row) => mapRewardEventRow(row))
      .sort((left, right) => left.qualifiedAt.localeCompare(right.qualifiedAt));
  });
}

export async function setReferralRewardRule(input: SetReferralRewardRuleInput): Promise<ReferralRewardRuleRecord> {
  const eligibleCollectionAddress = normalizeCollectionAddress(input.eligibleCollectionAddress);
  const activeFrom = input.activeFrom ? new Date(input.activeFrom).toISOString() : nowIso();
  const activeTo = input.activeTo ? new Date(input.activeTo).toISOString() : null;
  const metadata = cloneMetadata(input.metadata);
  const settlementWindowDays = parsePositiveDays(
    input.settlementWindowDays,
    DEFAULT_REFERRAL_SETTLEMENT_WINDOW_DAYS
  );
  const holdingPeriodDays = parsePositiveDays(
    input.holdingPeriodDays,
    DEFAULT_REFERRAL_HOLDING_PERIOD_DAYS
  );
  const eligibilityWindowDays = parsePositiveDays(
    input.eligibilityWindowDays,
    DEFAULT_REFERRAL_ELIGIBILITY_WINDOW_DAYS
  );

  if (!isReferralDatabaseConfigured()) {
    const record: ReferralRewardRuleRecord = {
      id: randomUUID(),
      eligibleCollectionAddress,
      rewardAmountUsdc: Number(input.rewardAmountUsdc),
      settlementWindowDays,
      holdingPeriodDays,
      eligibilityWindowDays,
      activeFrom,
      activeTo,
      metadata
    };

    setInMemoryRewardRule(record);
    return {
      ...record,
      metadata: { ...record.metadata }
    };
  }

  return withDbClient(async (client) => {
    const inserted = await client.query<RewardRuleRow>(
      `INSERT INTO referral_reward_rules (
         eligible_collection_address,
         reward_amount_usdc,
         settlement_window_days,
         holding_period_days,
         eligibility_window_days,
         active_from,
         active_to,
         metadata_json
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
       RETURNING
         id,
         eligible_collection_address,
         reward_amount_usdc,
         settlement_window_days,
         holding_period_days,
         eligibility_window_days,
         active_from,
         active_to,
         metadata_json`,
      [
        eligibleCollectionAddress,
        input.rewardAmountUsdc,
        settlementWindowDays,
        holdingPeriodDays,
        eligibilityWindowDays,
        activeFrom,
        activeTo,
        JSON.stringify(metadata)
      ]
    );

    return mapRewardRuleRow(inserted.rows[0] as RewardRuleRow);
  });
}

export async function recordReferralPurchaseSignal(
  input: RecordReferralPurchaseSignalInput
): Promise<RecordReferralPurchaseSignalResult> {
  const confirmedAt = input.confirmedAt ? new Date(input.confirmedAt).toISOString() : nowIso();
  const collectionAddress = normalizeCollectionAddress(input.collectionAddress);
  const nftMintAddress = normalizeNftMintAddress(input.nftMintAddress);
  const transactionSignature = normalizeTransactionSignature(input.transactionSignature);
  const auditPayload = cloneMetadata(input.auditPayload);
  const idempotencyKey = `referral_reward:${input.purchaseAttemptId}:${nftMintAddress}`;
  const nftPurchaseEventId = input.nftPurchaseEventId?.trim() || idempotencyKey;

  const activeAttribution = await getActiveReferralAttributionByInviteeWallet({
    inviteeWalletPublicKey: input.inviteeWalletPublicKey
  });

  if (!activeAttribution) {
    return { outcome: "ignored_no_active_attribution" };
  }

  const attributionWindowEndsAt = activeAttribution.eligibilityWindowEndsAt;
  if (confirmedAt > attributionWindowEndsAt) {
    return { outcome: "ignored_outside_window" };
  }

  const rewardRule = !isReferralDatabaseConfigured()
    ? getInMemoryActiveRuleForCollection(collectionAddress, confirmedAt)
    : await withDbClient((client) =>
        getActiveRewardRuleForCollectionWithClient(client, {
          collectionAddress,
          effectiveAt: confirmedAt
        })
      );

  if (!rewardRule) {
    return { outcome: "ignored_no_active_rule" };
  }

  const ruleWindowEndsAt = buildWindowEndIso(activeAttribution.boundAt, rewardRule.eligibilityWindowDays);
  if (confirmedAt > ruleWindowEndsAt) {
    return { outcome: "ignored_outside_window" };
  }

  const settlementEndsAt = buildWindowEndIso(
    confirmedAt,
    Math.max(rewardRule.settlementWindowDays, rewardRule.holdingPeriodDays)
  );
  const initialStatus: ReferralRewardStatus = activeAttribution.kycApprovedAt ? "pending_settlement" : "pending_qualification";

  if (!isReferralDatabaseConfigured()) {
    const existingId = inMemoryRewardEventIdByPurchaseMint.get(
      rewardEventLookupKey(input.purchaseAttemptId, nftMintAddress)
    );
    if (existingId) {
      const existing = getInMemoryRewardEventById(existingId);
      if (!existing) {
        throw new Error("In-memory reward event lookup is corrupt.");
      }

      return {
        outcome: "duplicate",
        event: existing
      };
    }

    const event: ReferralRewardEventRecord = {
      id: randomUUID(),
      attributionId: activeAttribution.id,
      ruleId: rewardRule.id,
      purchaseAttemptId: input.purchaseAttemptId,
      purchaseWebhookEventId: input.purchaseWebhookEventId?.trim() || null,
      nftPurchaseEventId,
      transactionSignature,
      collectionAddress,
      nftMintAddress,
      rewardAmountUsdc: rewardRule.rewardAmountUsdc,
      qualifiedAt: confirmedAt,
      settlementEndsAt,
      status: initialStatus,
      idempotencyKey,
      auditPayload
    };

    setInMemoryRewardEvent(event);

    return {
      outcome: "created",
      event: {
        ...event,
        auditPayload: { ...event.auditPayload }
      }
    };
  }

  return withDbClient(async (client) => {
    const activeAttributionLite = await getReferralAttributionLiteByInviteeWalletWithClient(
      client,
      input.inviteeWalletPublicKey
    );

    if (!activeAttributionLite) {
      return { outcome: "ignored_no_active_attribution" } satisfies RecordReferralPurchaseSignalResult;
    }

    const existing = await getRewardEventByPurchaseMintWithClient(client, {
      purchaseAttemptId: input.purchaseAttemptId,
      nftMintAddress
    });

    if (existing) {
      return {
        outcome: "duplicate",
        event: existing
      } satisfies RecordReferralPurchaseSignalResult;
    }

    try {
      const inserted = await client.query<{ id: string }>(
        `INSERT INTO referral_reward_events (
           attribution_id,
           rule_id,
           purchase_attempt_id,
           purchase_webhook_event_id,
           nft_purchase_event_id,
           transaction_signature,
           collection_address,
           nft_mint_address,
           reward_amount_usdc,
           qualified_at,
           settlement_ends_at,
           status,
           idempotency_key,
           audit_payload
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb)
         RETURNING id`,
        [
          activeAttributionLite.id,
          rewardRule.id,
          input.purchaseAttemptId,
          input.purchaseWebhookEventId?.trim() || null,
          nftPurchaseEventId,
          transactionSignature,
          collectionAddress,
          nftMintAddress,
          rewardRule.rewardAmountUsdc,
          confirmedAt,
          settlementEndsAt,
          initialStatus,
          idempotencyKey,
          JSON.stringify(auditPayload)
        ]
      );

      const created = await getRewardEventByIdWithClient(client, inserted.rows[0]?.id ?? "");
      if (!created) {
        throw new Error("Could not read inserted referral reward event.");
      }

      return {
        outcome: "created",
        event: created
      } satisfies RecordReferralPurchaseSignalResult;
    } catch (error) {
      const pgError = error as { code?: string };
      if (pgError.code !== "23505") {
        throw error;
      }

      const duplicate = await getRewardEventByPurchaseMintWithClient(client, {
        purchaseAttemptId: input.purchaseAttemptId,
        nftMintAddress
      });

      if (!duplicate) {
        throw error;
      }

      return {
        outcome: "duplicate",
        event: duplicate
      } satisfies RecordReferralPurchaseSignalResult;
    }
  });
}

export async function promotePendingQualificationRewardsForInvitee(input: {
  inviteeWalletPublicKey: string;
}): Promise<ReferralRewardEventRecord[]> {
  const activeAttribution = await getActiveReferralAttributionByInviteeWallet({
    inviteeWalletPublicKey: input.inviteeWalletPublicKey
  });

  if (!activeAttribution?.kycApprovedAt || activeAttribution.kycApprovedAt > activeAttribution.eligibilityWindowEndsAt) {
    return [];
  }

  if (!isReferralDatabaseConfigured()) {
    const promoted: ReferralRewardEventRecord[] = [];

    for (const event of inMemoryRewardEventsById.values()) {
      if (event.attributionId !== activeAttribution.id || event.status !== "pending_qualification") {
        continue;
      }

      const next: ReferralRewardEventRecord = {
        ...event,
        status: "pending_settlement"
      };

      setInMemoryRewardEvent(next);
      promoted.push({
        ...next,
        auditPayload: { ...next.auditPayload }
      });
    }

    promoted.sort((left, right) => left.qualifiedAt.localeCompare(right.qualifiedAt));
    return promoted;
  }

  return withDbClient(async (client) => {
    const result = await client.query<RewardEventRow>(
      `UPDATE referral_reward_events
       SET status = 'pending_settlement'
       WHERE attribution_id = $1
         AND status = 'pending_qualification'
       RETURNING
         id,
         attribution_id,
         rule_id,
         purchase_attempt_id,
         purchase_webhook_event_id,
         nft_purchase_event_id,
         transaction_signature,
         collection_address,
         nft_mint_address,
         reward_amount_usdc,
         qualified_at,
         settlement_ends_at,
         status,
         idempotency_key,
         audit_payload`,
      [activeAttribution.id]
    );

    return result.rows.map((row) => mapRewardEventRow(row));
  });
}

export async function settleMatureReferralRewardEvents(input: {
  now?: string;
  confirmHolding: (event: ReferralRewardEventRecord) => Promise<RewardSettlementDecision> | RewardSettlementDecision;
}): Promise<ReferralRewardEventRecord[]> {
  const now = input.now ? new Date(input.now).toISOString() : nowIso();

  if (!isReferralDatabaseConfigured()) {
    const settled: ReferralRewardEventRecord[] = [];

    for (const event of inMemoryRewardEventsById.values()) {
      if (event.status !== "pending_settlement" || event.settlementEndsAt > now) {
        continue;
      }

      const decision = await input.confirmHolding({
        ...event,
        auditPayload: { ...event.auditPayload }
      });

      const status: ReferralRewardStatus =
        decision === true ? "accrued" : decision === "risk_hold" ? "risk_hold" : "rejected";

      const next: ReferralRewardEventRecord = {
        ...event,
        status
      };

      setInMemoryRewardEvent(next);
      settled.push({
        ...next,
        auditPayload: { ...next.auditPayload }
      });
    }

    settled.sort((left, right) => left.qualifiedAt.localeCompare(right.qualifiedAt));
    return settled;
  }

  return withDbClient(async (client) => {
    const candidates = await client.query<RewardEventRow>(
      `SELECT
         id,
         attribution_id,
         rule_id,
         purchase_attempt_id,
         purchase_webhook_event_id,
         nft_purchase_event_id,
         transaction_signature,
         collection_address,
         nft_mint_address,
         reward_amount_usdc,
         qualified_at,
         settlement_ends_at,
         status,
         idempotency_key,
         audit_payload
       FROM referral_reward_events
       WHERE status = 'pending_settlement'
         AND settlement_ends_at <= $1
       ORDER BY qualified_at ASC`,
      [now]
    );

    const settled: ReferralRewardEventRecord[] = [];

    for (const row of candidates.rows) {
      const current = mapRewardEventRow(row);
      const decision = await input.confirmHolding(current);
      const nextStatus: ReferralRewardStatus =
        decision === true ? "accrued" : decision === "risk_hold" ? "risk_hold" : "rejected";

      const updated = await client.query<RewardEventRow>(
        `UPDATE referral_reward_events
         SET status = $2
         WHERE id = $1
         RETURNING
           id,
           attribution_id,
           rule_id,
           purchase_attempt_id,
           purchase_webhook_event_id,
           nft_purchase_event_id,
           transaction_signature,
           collection_address,
           nft_mint_address,
           reward_amount_usdc,
           qualified_at,
           settlement_ends_at,
           status,
           idempotency_key,
           audit_payload`,
        [current.id, nextStatus]
      );

      settled.push(mapRewardEventRow(updated.rows[0] as RewardEventRow));
    }

    return settled;
  });
}
