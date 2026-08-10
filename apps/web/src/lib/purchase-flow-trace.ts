import { randomUUID } from "node:crypto";

import { withDbClient } from "@/lib/db/pool";

type PurchaseTraceEndpoint = "quote" | "challenge" | "prepare" | "submit";
type PurchaseTracePhase = "request" | "success" | "error";

export type PurchaseFlowEvent = {
  id: string;
  flowId: string;
  endpoint: PurchaseTraceEndpoint;
  phase: PurchaseTracePhase;
  walletPublicKey: string | null;
  propertyId: string | null;
  attemptId: string | null;
  idempotencyKey: string | null;
  statusCode: number | null;
  errorCode: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

type PurchaseFlowEventInput = {
  flowId: string;
  endpoint: PurchaseTraceEndpoint;
  phase: PurchaseTracePhase;
  walletPublicKey?: string | null;
  propertyId?: string | null;
  attemptId?: string | null;
  idempotencyKey?: string | null;
  statusCode?: number | null;
  errorCode?: string | null;
  metadata?: Record<string, unknown>;
};

type PurchaseFlowEventRow = {
  id: string;
  flow_id: string;
  endpoint: PurchaseTraceEndpoint;
  phase: PurchaseTracePhase;
  wallet_public_key: string | null;
  property_id: string | null;
  attempt_id: string | null;
  idempotency_key: string | null;
  status_code: number | null;
  error_code: string | null;
  metadata: unknown;
  created_at: string | Date;
};

const MAX_FLOW_ID_LENGTH = 120;
const MAX_TEXT_LENGTH = 256;
const MAX_METADATA_LENGTH = 3_500;

const inMemoryEvents: PurchaseFlowEvent[] = [];

function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function parseBooleanEnv(rawValue: string | undefined, defaultValue: boolean): boolean {
  if (typeof rawValue !== "string") {
    return defaultValue;
  }

  const normalized = rawValue.trim().toLowerCase();
  if (!normalized) {
    return defaultValue;
  }

  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

export function isPurchaseTraceEnabled(): boolean {
  return parseBooleanEnv(process.env.PURCHASE_TRACE_ENABLED, true);
}

export function isPurchaseTraceErrorsOnly(): boolean {
  return parseBooleanEnv(process.env.PURCHASE_TRACE_ERRORS_ONLY, false);
}

function sanitizeText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = value.trim();
  if (!cleaned) {
    return null;
  }

  return cleaned.slice(0, MAX_TEXT_LENGTH);
}

function sanitizeFlowId(value: string | null | undefined): string {
  const cleaned = typeof value === "string" ? value.trim() : "";
  if (!cleaned) {
    return randomUUID();
  }

  return cleaned.slice(0, MAX_FLOW_ID_LENGTH);
}

function normalizeMetadata(metadata: Record<string, unknown> | undefined): Record<string, unknown> {
  if (!metadata) {
    return {};
  }

  try {
    const serialized = JSON.stringify(metadata);
    if (!serialized) {
      return {};
    }

    if (serialized.length <= MAX_METADATA_LENGTH) {
      return JSON.parse(serialized) as Record<string, unknown>;
    }

    const trimmed = `${serialized.slice(0, MAX_METADATA_LENGTH - 3)}...`;
    return { truncated: true, raw: trimmed };
  } catch {
    return { invalidMetadata: true };
  }
}

function mapRow(row: PurchaseFlowEventRow): PurchaseFlowEvent {
  const createdAt = row.created_at instanceof Date ? row.created_at.toISOString() : new Date(row.created_at).toISOString();
  return {
    id: row.id,
    flowId: row.flow_id,
    endpoint: row.endpoint,
    phase: row.phase,
    walletPublicKey: row.wallet_public_key,
    propertyId: row.property_id,
    attemptId: row.attempt_id,
    idempotencyKey: row.idempotency_key,
    statusCode: row.status_code,
    errorCode: row.error_code,
    metadata: (row.metadata && typeof row.metadata === "object") ? (row.metadata as Record<string, unknown>) : {},
    createdAt
  };
}

export function getFlowId(headerValue: string | null): string {
  if (!isPurchaseTraceEnabled()) {
    return "";
  }

  return sanitizeFlowId(headerValue);
}

export function withFlowIdHeader<T extends Response>(response: T, flowId: string): T {
  if (!isPurchaseTraceEnabled()) {
    return response;
  }

  response.headers.set("x-flow-id", sanitizeFlowId(flowId));
  return response;
}

export async function recordPurchaseFlowEvent(input: PurchaseFlowEventInput): Promise<void> {
  if (!isPurchaseTraceEnabled()) {
    return;
  }

  if (isPurchaseTraceErrorsOnly() && input.phase !== "error") {
    return;
  }

  const flowId = sanitizeFlowId(input.flowId);
  const event: PurchaseFlowEvent = {
    id: randomUUID(),
    flowId,
    endpoint: input.endpoint,
    phase: input.phase,
    walletPublicKey: sanitizeText(input.walletPublicKey),
    propertyId: sanitizeText(input.propertyId),
    attemptId: sanitizeText(input.attemptId),
    idempotencyKey: sanitizeText(input.idempotencyKey),
    statusCode: Number.isInteger(input.statusCode) ? (input.statusCode as number) : null,
    errorCode: sanitizeText(input.errorCode),
    metadata: normalizeMetadata(input.metadata),
    createdAt: new Date().toISOString()
  };

  if (!isDatabaseConfigured()) {
    inMemoryEvents.push(event);
    return;
  }

  try {
    await withDbClient(async (client) => {
      await client.query(
        `INSERT INTO purchase_flow_events (
          id,
          flow_id,
          endpoint,
          phase,
          wallet_public_key,
          property_id,
          attempt_id,
          idempotency_key,
          status_code,
          error_code,
          metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)`,
        [
          event.id,
          event.flowId,
          event.endpoint,
          event.phase,
          event.walletPublicKey,
          event.propertyId,
          event.attemptId,
          event.idempotencyKey,
          event.statusCode,
          event.errorCode,
          JSON.stringify(event.metadata)
        ]
      );
    });
  } catch {
    // Best effort tracing; purchase flow must not fail due to trace persistence errors.
  }
}

export async function listPurchaseFlowEvents(flowId: string): Promise<PurchaseFlowEvent[]> {
  const normalizedFlowId = sanitizeFlowId(flowId);

  if (!isDatabaseConfigured()) {
    return inMemoryEvents
      .filter((event) => event.flowId === normalizedFlowId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  return withDbClient(async (client) => {
    const result = await client.query<PurchaseFlowEventRow>(
      `SELECT
         id,
         flow_id,
         endpoint,
         phase,
         wallet_public_key,
         property_id,
         attempt_id,
         idempotency_key,
         status_code,
         error_code,
         metadata,
         created_at
       FROM purchase_flow_events
       WHERE flow_id = $1
       ORDER BY created_at ASC`,
      [normalizedFlowId]
    );

    return result.rows.map((row) => mapRow(row));
  });
}
