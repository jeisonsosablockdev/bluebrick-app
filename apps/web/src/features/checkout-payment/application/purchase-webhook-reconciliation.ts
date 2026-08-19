import { randomUUID } from "node:crypto";

import type { PoolClient } from "pg";

import { withDbClient } from "@/features/shared/infrastructure/db/pool";
import {
  markPurchaseAttemptConfirmed,
  markPurchaseAttemptFailedBySignature
} from "@/features/checkout-payment/infrastructure/purchase-attempts-repository";
import { recordReferralPurchaseSignal } from "@/features/referral-marketing/application/reward-engine";
import { invalidatePurchaseQuoteCache } from "@/features/checkout-payment/application/purchase-service";

export type PurchaseWebhookStatus = "confirmed" | "failed";

export type PurchaseWebhookEventRecord = {
  id: string;
  provider: string;
  eventId: string | null;
  eventFingerprint: string;
  signature: string;
  eventType: string;
  status: PurchaseWebhookStatus;
  slot: number | null;
  errorMessage: string | null;
  payload: unknown;
  receivedAt: string;
  processedAt: string | null;
};

type PurchaseWebhookEventRow = {
  id: string;
  provider: string;
  event_id: string | null;
  event_fingerprint: string;
  signature: string;
  event_type: string;
  status: PurchaseWebhookStatus;
  slot: string | number | null;
  error_message: string | null;
  payload: unknown;
  received_at: string | Date;
  processed_at: string | Date | null;
};

type PurchaseHeliusEventInput = {
  signature: string;
  slot: number | null;
  eventType: string;
  status: PurchaseWebhookStatus;
  errorMessage: string | null;
  payload: unknown;
};

type RecordPurchaseWebhookEventInput = {
  provider: string;
  eventId?: string | null;
  signature: string;
  eventType: string;
  status: PurchaseWebhookStatus;
  slot?: number | null;
  errorMessage?: string | null;
  payload: unknown;
};

export type PurchaseWebhookProcessResult = {
  received: number;
  processed: number;
  duplicates: number;
  reconciled: number;
};

function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function parseSlot(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
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

function mapRow(row: PurchaseWebhookEventRow): PurchaseWebhookEventRecord {
  return {
    id: row.id,
    provider: row.provider,
    eventId: row.event_id,
    eventFingerprint: row.event_fingerprint,
    signature: row.signature,
    eventType: row.event_type,
    status: row.status,
    slot: parseSlot(row.slot),
    errorMessage: row.error_message,
    payload: row.payload,
    receivedAt: toIso(row.received_at) ?? new Date().toISOString(),
    processedAt: toIso(row.processed_at)
  };
}

function toErrorMessage(value: unknown): string | null {
  if (value === null || typeof value === "undefined") {
    return null;
  }

  if (typeof value === "string") {
    return value.trim() || null;
  }

  try {
    const serialized = JSON.stringify(value);
    if (!serialized) {
      return "unknown";
    }

    return serialized.length > 500 ? `${serialized.slice(0, 497)}...` : serialized;
  } catch {
    return "unknown";
  }
}

function normalizeEventType(value: unknown): string {
  if (typeof value !== "string") {
    return "UNKNOWN";
  }

  const trimmed = value.trim();
  return trimmed || "UNKNOWN";
}

function buildFingerprint(input: {
  signature: string;
  slot: number | null;
  eventType: string;
}): string {
  const slotKey = Number.isInteger(input.slot) ? String(input.slot) : "no-slot";
  return `${input.signature}|${slotKey}|${input.eventType}`;
}

function collectMintAddress(set: Set<string>, value: unknown): void {
  if (typeof value !== "string") {
    return;
  }

  const normalized = value.trim();
  if (!normalized) {
    return;
  }

  set.add(normalized);
}

function extractNftMintAddressesFromHeliusPayload(payload: unknown): string[] {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const mintAddresses = new Set<string>();
  const record = payload as {
    events?: {
      nft?: {
        nfts?: Array<{
          mint?: unknown;
        }>;
      };
    };
    tokenTransfers?: Array<{
      mint?: unknown;
      tokenStandard?: unknown;
    }>;
    accountData?: Array<{
      tokenBalanceChanges?: Array<{
        mint?: unknown;
        rawTokenAmount?: {
          decimals?: unknown;
        };
      }>;
    }>;
  };

  for (const nft of record.events?.nft?.nfts ?? []) {
    collectMintAddress(mintAddresses, nft.mint);
  }

  for (const transfer of record.tokenTransfers ?? []) {
    if (transfer.tokenStandard === "NonFungible") {
      collectMintAddress(mintAddresses, transfer.mint);
    }
  }

  for (const account of record.accountData ?? []) {
    for (const change of account.tokenBalanceChanges ?? []) {
      if (change.rawTokenAmount?.decimals === 0) {
        collectMintAddress(mintAddresses, change.mint);
      }
    }
  }

  return Array.from(mintAddresses);
}

function normalizeHeliusEvent(raw: unknown): PurchaseHeliusEventInput | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const event = raw as {
    signature?: unknown;
    slot?: unknown;
    type?: unknown;
    transactionError?: unknown;
  };

  if (typeof event.signature !== "string" || !event.signature.trim()) {
    return null;
  }

  const signature = event.signature.trim();
  const slot = parseSlot(event.slot);
  const eventType = normalizeEventType(event.type);
  const status: PurchaseWebhookStatus = event.transactionError === null ? "confirmed" : "failed";
  const errorMessage = status === "failed" ? toErrorMessage(event.transactionError) : null;

  return {
    signature,
    slot,
    eventType,
    status,
    errorMessage,
    payload: raw
  };
}

const inMemoryEventsByFingerprint = new Map<string, PurchaseWebhookEventRecord>();
const inMemoryEventsByProviderEventId = new Map<string, PurchaseWebhookEventRecord>();

function inMemoryProviderEventKey(provider: string, eventId: string): string {
  return `${provider}:${eventId}`;
}

function inMemoryFingerprintKey(provider: string, fingerprint: string): string {
  return `${provider}:${fingerprint}`;
}

async function selectExistingWebhookEvent(
  client: PoolClient,
  input: { provider: string; eventId: string | null; eventFingerprint: string }
): Promise<PurchaseWebhookEventRecord | null> {
  if (input.eventId) {
    const byEventId = await client.query<PurchaseWebhookEventRow>(
      `SELECT *
       FROM purchase_webhook_events
       WHERE provider = $1
         AND event_id = $2
       LIMIT 1`,
      [input.provider, input.eventId]
    );

    if ((byEventId.rowCount ?? 0) > 0) {
      return mapRow(byEventId.rows[0] as PurchaseWebhookEventRow);
    }
  }

  const byFingerprint = await client.query<PurchaseWebhookEventRow>(
    `SELECT *
     FROM purchase_webhook_events
     WHERE provider = $1
       AND event_fingerprint = $2
     LIMIT 1`,
    [input.provider, input.eventFingerprint]
  );

  if ((byFingerprint.rowCount ?? 0) === 0) {
    return null;
  }

  return mapRow(byFingerprint.rows[0] as PurchaseWebhookEventRow);
}

export async function recordPurchaseWebhookEvent(input: RecordPurchaseWebhookEventInput): Promise<{
  event: PurchaseWebhookEventRecord;
  duplicate: boolean;
}> {
  const provider = input.provider.trim() || "helius";
  const signature = input.signature.trim();
  const eventType = input.eventType.trim() || "UNKNOWN";
  const status = input.status;
  const slot = parseSlot(input.slot);
  const eventId = typeof input.eventId === "string" && input.eventId.trim() ? input.eventId.trim() : null;
  const eventFingerprint = buildFingerprint({ signature, slot, eventType });
  const errorMessage = typeof input.errorMessage === "string" ? input.errorMessage : null;

  if (!signature) {
    throw new Error("signature is required.");
  }

  if (!isDatabaseConfigured()) {
    if (eventId) {
      const existingById = inMemoryEventsByProviderEventId.get(inMemoryProviderEventKey(provider, eventId));
      if (existingById) {
        return { event: { ...existingById }, duplicate: true };
      }
    }

    const fingerprintKey = inMemoryFingerprintKey(provider, eventFingerprint);
    const existingByFingerprint = inMemoryEventsByFingerprint.get(fingerprintKey);
    if (existingByFingerprint) {
      return { event: { ...existingByFingerprint }, duplicate: true };
    }

    const now = new Date().toISOString();
    const record: PurchaseWebhookEventRecord = {
      id: randomUUID(),
      provider,
      eventId,
      eventFingerprint,
      signature,
      eventType,
      status,
      slot,
      errorMessage,
      payload: input.payload,
      receivedAt: now,
      processedAt: now
    };

    inMemoryEventsByFingerprint.set(fingerprintKey, record);
    if (eventId) {
      inMemoryEventsByProviderEventId.set(inMemoryProviderEventKey(provider, eventId), record);
    }

    return { event: { ...record }, duplicate: false };
  }

  return withDbClient(async (client) => {
    try {
      const insert = await client.query<PurchaseWebhookEventRow>(
        `INSERT INTO purchase_webhook_events (
           id,
           provider,
           event_id,
           event_fingerprint,
           signature,
           event_type,
           status,
           slot,
           error_message,
           payload,
           processed_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, NOW())
         RETURNING *`,
        [
          randomUUID(),
          provider,
          eventId,
          eventFingerprint,
          signature,
          eventType,
          status,
          slot,
          errorMessage,
          JSON.stringify(input.payload)
        ]
      );

      return {
        event: mapRow(insert.rows[0] as PurchaseWebhookEventRow),
        duplicate: false
      };
    } catch (error) {
      const pgError = error as { code?: string };
      if (pgError.code !== "23505") {
        throw error;
      }

      const existing = await selectExistingWebhookEvent(client, {
        provider,
        eventId,
        eventFingerprint
      });

      if (!existing) {
        throw error;
      }

      return {
        event: existing,
        duplicate: true
      };
    }
  });
}

export async function listPurchaseWebhookEvents(input?: {
  signature?: string;
  status?: PurchaseWebhookStatus;
  eventType?: string;
  limit?: number;
  page?: number;
}): Promise<PurchaseWebhookEventRecord[]> {
  const signature = typeof input?.signature === "string" ? input.signature.trim() : "";
  const status = input?.status;
  const eventType = typeof input?.eventType === "string" ? input.eventType.trim() : "";
  const limit = Number.isInteger(input?.limit) && Number(input?.limit) > 0 ? Number(input?.limit) : 50;
  const page = Number.isInteger(input?.page) && Number(input?.page) > 0 ? Number(input?.page) : 1;
  const offset = (page - 1) * limit;

  if (!isDatabaseConfigured()) {
    let rows = Array.from(inMemoryEventsByFingerprint.values()).map((row) => ({ ...row }));

    if (signature) {
      rows = rows.filter((row) => row.signature === signature);
    }

    if (status) {
      rows = rows.filter((row) => row.status === status);
    }

    if (eventType) {
      rows = rows.filter((row) => row.eventType === eventType);
    }

    rows.sort((left, right) => right.receivedAt.localeCompare(left.receivedAt));
    return rows.slice(offset, offset + limit);
  }

  return withDbClient(async (client) => {
    const whereClauses: string[] = [];
    const values: unknown[] = [];

    if (signature) {
      values.push(signature);
      whereClauses.push(`signature = $${values.length}`);
    }

    if (status) {
      values.push(status);
      whereClauses.push(`status = $${values.length}`);
    }

    if (eventType) {
      values.push(eventType);
      whereClauses.push(`event_type = $${values.length}`);
    }

    values.push(limit);
    const limitIndex = values.length;
    values.push(offset);
    const offsetIndex = values.length;

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const result = await client.query<PurchaseWebhookEventRow>(
      `SELECT *
       FROM purchase_webhook_events
       ${whereSql}
       ORDER BY received_at DESC
       LIMIT $${limitIndex}
       OFFSET $${offsetIndex}`,
      values
    );

    return result.rows.map((row) => mapRow(row));
  });
}

export async function processPurchaseHeliusWebhookPayload(payload: unknown): Promise<PurchaseWebhookProcessResult> {
  const entries = Array.isArray(payload) ? payload : [];
  const result: PurchaseWebhookProcessResult = {
    received: 0,
    processed: 0,
    duplicates: 0,
    reconciled: 0
  };

  for (const rawEvent of entries) {
    const event = normalizeHeliusEvent(rawEvent);
    if (!event) {
      continue;
    }

    result.received += 1;

    const recorded = await recordPurchaseWebhookEvent({
      provider: "helius",
      signature: event.signature,
      eventType: event.eventType,
      status: event.status,
      slot: event.slot,
      errorMessage: event.errorMessage,
      payload: event.payload
    });

    if (recorded.duplicate) {
      result.duplicates += 1;
      continue;
    }

    result.processed += 1;

    if (event.status === "confirmed") {
      const updated = await markPurchaseAttemptConfirmed({ signature: event.signature });
      if (updated) {
        result.reconciled += 1;
        invalidatePurchaseQuoteCache(updated.candyMachineAddress);

        const nftMintAddresses = extractNftMintAddressesFromHeliusPayload(event.payload);
        for (const nftMintAddress of nftMintAddresses) {
          await recordReferralPurchaseSignal({
            inviteeWalletPublicKey: updated.walletPublicKey,
            purchaseAttemptId: updated.id,
            purchaseWebhookEventId: recorded.event.id,
            transactionSignature: event.signature,
            collectionAddress: updated.collectionAddress,
            nftMintAddress,
            confirmedAt: updated.confirmedAt ?? recorded.event.processedAt ?? recorded.event.receivedAt,
            auditPayload: {
              heliusEventType: event.eventType,
              slot: event.slot,
              purchaseWebhookEventId: recorded.event.id
            }
          });
        }
      }
      continue;
    }

    const updated = await markPurchaseAttemptFailedBySignature({
      signature: event.signature,
      errorCode: "ONCHAIN_FAILED",
      errorMessage: event.errorMessage ?? "Helius reported on-chain failure."
    });

    if (updated) {
      result.reconciled += 1;
      invalidatePurchaseQuoteCache(updated.candyMachineAddress);
    }
  }

  return result;
}

export async function reprocessPurchaseWebhookEventById(input: {
  eventId: string;
}): Promise<{
  eventId: string;
  signature: string;
  eventType: string;
  status: PurchaseWebhookStatus;
  reconciled: boolean;
}> {
  const eventId = input.eventId.trim();
  if (!eventId) {
    throw new Error("eventId is required.");
  }

  const event = await (async () => {
    if (!isDatabaseConfigured()) {
      return Array.from(inMemoryEventsByFingerprint.values()).find((item) => item.id === eventId) ?? null;
    }

    return withDbClient(async (client) => {
      const result = await client.query<PurchaseWebhookEventRow>(
        `SELECT *
         FROM purchase_webhook_events
         WHERE id = $1
         LIMIT 1`,
        [eventId]
      );

      if ((result.rowCount ?? 0) === 0) {
        return null;
      }

      return mapRow(result.rows[0] as PurchaseWebhookEventRow);
    });
  })();

  if (!event) {
    throw new Error("Webhook event not found.");
  }

  if (event.status === "confirmed") {
    const updated = await markPurchaseAttemptConfirmed({ signature: event.signature });
    if (updated) {
      invalidatePurchaseQuoteCache(updated.candyMachineAddress);
    }

    return {
      eventId: event.id,
      signature: event.signature,
      eventType: event.eventType,
      status: event.status,
      reconciled: Boolean(updated)
    };
  }

  const updated = await markPurchaseAttemptFailedBySignature({
    signature: event.signature,
    errorCode: "ONCHAIN_FAILED",
    errorMessage: event.errorMessage ?? "Helius reported on-chain failure."
  });
  if (updated) {
    invalidatePurchaseQuoteCache(updated.candyMachineAddress);
  }

  return {
    eventId: event.id,
    signature: event.signature,
    eventType: event.eventType,
    status: event.status,
    reconciled: Boolean(updated)
  };
}
