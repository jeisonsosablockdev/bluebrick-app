import { randomUUID } from "node:crypto";

import { withDbClient } from "@/features/shared/infrastructure/db/pool";
import {
  createLegacyConnection,
  getLegacyTransactionBySignature,
  getLegacyTransactionPayerFromResponse
} from "@/lib/solana-kit/compat/web3-transactions";
import {
  getStakeActionAttemptBySignature,
  markStakeActionAttemptFailed,
  markStakeActionAttemptReconcilePending,
  markStakeActionAttemptValidated,
  type StakeActionAttemptRecord
} from "@/lib/stake-attempts-repository";
import { upsertStakeProfileEvent } from "@/features/staking-distribution/infrastructure/stake-profile-events-repository";
import { getSolanaRpcUrl } from "@/lib/infrastructure/solana";
import { createArchivalRpcClient } from "@/lib/archival/archival-rpc-client";

export type StakeWebhookProcessResult = {
  received: number;
  processed: number;
  duplicates: number;
  reconciled: number;
};

export type StakeCanonicalReconciliationResult = {
  status: "missing_attempt" | "pending" | "reconcile_pending" | "validated" | "failed";
  attemptId: string | null;
  errorMessage: string | null;
};

type NormalizedStakeHeliusEvent = {
  signature: string;
  slot: number | null;
  eventType: string;
  status: "confirmed" | "failed";
  errorMessage: string | null;
  payload: unknown;
};

type RawWebhookEventRow = {
  id: string;
  provider: string;
  event_id: string | null;
  event_fingerprint: string;
  signature: string | null;
  event_type: string | null;
  slot: string | number | null;
  payload: unknown;
  processing_status: "received" | "processed" | "failed";
  error_message: string | null;
  received_at: string | Date;
  processed_at: string | Date | null;
};

type CanonicalStakeTransaction = NonNullable<Awaited<ReturnType<typeof getLegacyTransactionBySignature>>>;

function parseSlot(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function normalizeString(value: unknown, fallback: string): string {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim();
  return normalized || fallback;
}

function toErrorMessage(value: unknown): string | null {
  if (value === null || typeof value === "undefined") {
    return null;
  }

  if (typeof value === "string") {
    return value.trim() || null;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return "unknown";
  }
}

function normalizeHeliusEvent(raw: unknown): NormalizedStakeHeliusEvent | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const input = raw as {
    signature?: unknown;
    slot?: unknown;
    type?: unknown;
    transactionError?: unknown;
  };

  if (typeof input.signature !== "string" || !input.signature.trim()) {
    return null;
  }

  const status = input.transactionError === null ? "confirmed" : "failed";

  return {
    signature: input.signature.trim(),
    slot: parseSlot(input.slot),
    eventType: normalizeString(input.type, "UNKNOWN"),
    status,
    errorMessage: status === "failed" ? toErrorMessage(input.transactionError) : null,
    payload: raw
  };
}

function buildWebhookFingerprint(event: NormalizedStakeHeliusEvent): string {
  const slotKey = event.slot === null ? "no-slot" : String(event.slot);
  return `stake:${event.signature}:${slotKey}:${event.eventType}`;
}

function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

const inMemoryRawStakeWebhookEvents = new Map<string, RawWebhookEventRow>();

async function recordStakeRawWebhookEvent(event: NormalizedStakeHeliusEvent): Promise<{
  event: RawWebhookEventRow;
  duplicate: boolean;
}> {
  const eventFingerprint = buildWebhookFingerprint(event);

  if (!isDatabaseConfigured()) {
    const existing = inMemoryRawStakeWebhookEvents.get(eventFingerprint);
    if (existing) {
      return { event: existing, duplicate: true };
    }

    const now = new Date().toISOString();
    const created: RawWebhookEventRow = {
      id: randomUUID(),
      provider: "helius",
      event_id: null,
      event_fingerprint: eventFingerprint,
      signature: event.signature,
      event_type: event.eventType,
      slot: event.slot,
      payload: event.payload,
      processing_status: "received",
      error_message: null,
      received_at: now,
      processed_at: null
    };
    inMemoryRawStakeWebhookEvents.set(eventFingerprint, created);
    return { event: created, duplicate: false };
  }

  return withDbClient(async (client) => {
    try {
      const inserted = await client.query<RawWebhookEventRow>(
        `INSERT INTO webhook_events (
           id,
           provider,
           event_fingerprint,
           signature,
           event_type,
           slot,
           payload
         ) VALUES ($1, 'helius', $2, $3, $4, $5, $6::jsonb)
         RETURNING *`,
        [randomUUID(), eventFingerprint, event.signature, event.eventType, event.slot, JSON.stringify(event.payload)]
      );

      return { event: inserted.rows[0] as RawWebhookEventRow, duplicate: false };
    } catch (error) {
      const pgError = error as { code?: string };
      if (pgError.code !== "23505") {
        throw error;
      }

      const existing = await client.query<RawWebhookEventRow>(
        `SELECT *
         FROM webhook_events
         WHERE provider = 'helius'
           AND event_fingerprint = $1
         LIMIT 1`,
        [eventFingerprint]
      );

      return {
        event: existing.rows[0] as RawWebhookEventRow,
        duplicate: true
      };
    }
  });
}

function reconciliationResult(
  status: StakeCanonicalReconciliationResult["status"],
  attemptId: string | null,
  errorMessage: string | null
): StakeCanonicalReconciliationResult {
  return {
    status,
    attemptId,
    errorMessage
  };
}

async function fetchCanonicalStakeTransaction(signature: string): Promise<CanonicalStakeTransaction | null> {
  if (process.env.HELIUS_API_KEY && process.env.ALCHEMY_API_KEY) {
    try {
      const archival = createArchivalRpcClient();
      const result = await archival.getTransaction(signature);
      return result.tx as CanonicalStakeTransaction;
    } catch {
      // Fallback to legacy connection if archival fails or isn't reachable
    }
  }

  const connection = createLegacyConnection(getSolanaRpcUrl(), "finalized");
  return getLegacyTransactionBySignature(connection, signature, "finalized");
}

async function markCanonicalReconciliationPending(
  attempt: StakeActionAttemptRecord,
  errorMessage: string
): Promise<StakeCanonicalReconciliationResult> {
  await markStakeActionAttemptReconcilePending({
    attemptId: attempt.id,
    errorMessage
  });

  return reconciliationResult("pending", attempt.id, errorMessage);
}

async function markCanonicalReconciliationFailed(
  attempt: StakeActionAttemptRecord,
  errorMessage: string
): Promise<StakeCanonicalReconciliationResult> {
  await markStakeActionAttemptFailed({
    attemptId: attempt.id,
    errorMessage
  });

  return reconciliationResult("failed", attempt.id, errorMessage);
}

function getCanonicalBlockTime(transaction: CanonicalStakeTransaction): string | null {
  return typeof transaction.blockTime === "number"
    ? new Date(transaction.blockTime * 1000).toISOString()
    : null;
}

async function upsertCanonicalStakeProfileEvent(input: {
  attempt: StakeActionAttemptRecord;
  signature: string;
  transaction: CanonicalStakeTransaction;
  webhookEventId?: string | null;
  eventSlot?: number | null;
  observedAt?: string;
}): Promise<"validated" | "reconcile_pending"> {
  const blockTime = getCanonicalBlockTime(input.transaction);
  const validationStatus = blockTime ? "validated" : "reconcile_pending";

  await upsertStakeProfileEvent({
    webhookEventId: input.webhookEventId ?? null,
    assetAddress: input.attempt.assetAddress,
    ownerWallet: input.attempt.walletPublicKey,
    collectionAddress: input.attempt.collectionAddress,
    candyMachineAddress: input.attempt.candyMachineAddress,
    propertyId: input.attempt.propertyId,
    propertyTitle: input.attempt.propertyTitle,
    productAction: input.attempt.productAction,
    txSignature: input.attempt.txSignature ?? input.signature,
    instructionIndex: 0,
    slot: input.transaction.slot ?? input.eventSlot ?? null,
    blockTime,
    observedAt: input.observedAt ?? new Date().toISOString(),
    validationStatus,
    validationError: blockTime ? null : "block_time is null; canonical time remains pending."
  });

  return validationStatus;
}

export async function reconcileSubmittedStakeActionBySignature(input: {
  signature: string;
  webhookEventId?: string | null;
  eventSlot?: number | null;
  observedAt?: string;
}): Promise<StakeCanonicalReconciliationResult> {
  const signature = input.signature.trim();
  if (!signature) {
    return reconciliationResult("missing_attempt", null, "Signature is required.");
  }

  const attempt = await getStakeActionAttemptBySignature(signature);
  if (!attempt) {
    return reconciliationResult("missing_attempt", null, "No stake attempt was found for the signature.");
  }

  const transaction = await fetchCanonicalStakeTransaction(signature);

  if (!transaction) {
    return markCanonicalReconciliationPending(attempt, "Canonical transaction validation is still pending.");
  }

  if (transaction.meta?.err) {
    return markCanonicalReconciliationFailed(attempt, "Canonical transaction failed on-chain.");
  }

  const payer = getLegacyTransactionPayerFromResponse(transaction);
  if (payer !== attempt.walletPublicKey) {
    return markCanonicalReconciliationFailed(attempt, "Canonical validation detected a payer mismatch.");
  }

  const validationStatus = await upsertCanonicalStakeProfileEvent({
    attempt,
    signature,
    transaction,
    webhookEventId: input.webhookEventId,
    eventSlot: input.eventSlot,
    observedAt: input.observedAt
  });

  if (validationStatus === "validated") {
    await markStakeActionAttemptValidated({ attemptId: attempt.id });
    return reconciliationResult("validated", attempt.id, null);
  }

  await markStakeActionAttemptReconcilePending({
    attemptId: attempt.id,
    errorMessage: "Canonical transaction has no block_time yet."
  });

  return reconciliationResult("reconcile_pending", attempt.id, "Canonical transaction has no block_time yet.");
}

export async function processStakeHeliusWebhookPayload(payload: unknown): Promise<StakeWebhookProcessResult> {
  const events = Array.isArray(payload) ? payload : [];
  const result: StakeWebhookProcessResult = {
    received: 0,
    processed: 0,
    duplicates: 0,
    reconciled: 0
  };

  for (const rawEvent of events) {
    const event = normalizeHeliusEvent(rawEvent);
    if (!event) {
      continue;
    }

    result.received += 1;

    const recorded = await recordStakeRawWebhookEvent(event);

    if (recorded.duplicate) {
      result.duplicates += 1;
      continue;
    }

    result.processed += 1;

    const attempt = await getStakeActionAttemptBySignature(event.signature);
    if (!attempt) {
      continue;
    }

    if (event.status === "failed") {
      await markStakeActionAttemptFailed({
        attemptId: attempt.id,
        errorMessage: event.errorMessage ?? "Helius reported on-chain failure."
      });
      result.reconciled += 1;
      continue;
    }

    const reconciled = await reconcileSubmittedStakeActionBySignature({
      signature: event.signature,
      webhookEventId: recorded.event.id,
      eventSlot: event.slot,
      observedAt: new Date().toISOString()
    });
    if (reconciled.status === "validated" || reconciled.status === "failed") {
      result.reconciled += 1;
    }
  }

  return result;
}
