import { createHash, timingSafeEqual } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import {
  calculateMintJobProgress,
  getMintJob,
  isMintOrchestratorError,
  recordMintWebhookEvent,
  reconcileMintJobSignatures
} from "@/lib/mint-orchestrator-store";

type SignatureResolution = {
  signature: string;
  confirmed: boolean;
  failed: boolean;
  errorMessage: string | null;
};

type NormalizedHeliusEvent = {
  eventId: string | null;
  eventFingerprint: string;
  signature: string | null;
  eventType: string | null;
  slot: number | null;
  failed: boolean;
  errorMessage: string | null;
};

const HELIUS_PROVIDER = "helius";
const WEBHOOK_SECRET_ENV = "HELIUS_WEBHOOK_SECRET";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNonNegativeInteger(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    return null;
  }

  return value;
}

function firstStringFromArray(value: unknown): string | null {
  if (!Array.isArray(value)) {
    return null;
  }

  for (const entry of value) {
    const candidate = asString(entry);

    if (candidate) {
      return candidate;
    }
  }

  return null;
}

function normalizeEventList(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const events: Record<string, unknown>[] = [];

  for (const entry of value) {
    const event = asRecord(entry);

    if (event) {
      events.push(event);
    }
  }

  return events;
}

function extractEvents(payload: unknown): Record<string, unknown>[] {
  const directEvents = normalizeEventList(payload);

  if (directEvents.length > 0) {
    return directEvents;
  }

  const payloadRecord = asRecord(payload);

  if (!payloadRecord) {
    throw new Error("Invalid webhook payload: expected object or array.");
  }

  const nestedEvents = normalizeEventList(payloadRecord.events);

  if (nestedEvents.length > 0) {
    return nestedEvents;
  }

  const nestedTransactions = normalizeEventList(payloadRecord.transactions);

  if (nestedTransactions.length > 0) {
    return nestedTransactions;
  }

  return [payloadRecord];
}

function extractEventId(event: Record<string, unknown>): string | null {
  return asString(event.eventId) || asString(event.id) || asString(event.webhookEventId);
}

function extractSignature(event: Record<string, unknown>): string | null {
  const transaction = asRecord(event.transaction);

  return (
    asString(event.signature)
    || asString(event.txSignature)
    || firstStringFromArray(event.signatures)
    || (transaction ? asString(transaction.signature) : null)
    || (transaction ? firstStringFromArray(transaction.signatures) : null)
  );
}

function extractEventType(event: Record<string, unknown>): string | null {
  return asString(event.type) || asString(event.transactionType) || asString(event.status);
}

function extractSlot(event: Record<string, unknown>): number | null {
  const transaction = asRecord(event.transaction);

  return asNonNegativeInteger(event.slot) || (transaction ? asNonNegativeInteger(transaction.slot) : null);
}

function stringifyError(error: unknown): string | null {
  if (error === null || error === undefined) {
    return null;
  }

  if (typeof error === "string") {
    return error.trim().length > 0 ? error.trim() : null;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function hasFailedStatus(event: Record<string, unknown>): { failed: boolean; errorMessage: string | null } {
  const transaction = asRecord(event.transaction);
  const metadata = asRecord(event.meta);
  const status = (asString(event.status) || "").toLowerCase();
  const directError = stringifyError(event.error || event.err || event.transactionError);
  const metaError = metadata ? stringifyError(metadata.err || metadata.error) : null;
  const transactionError = transaction ? stringifyError(transaction.error || transaction.err) : null;
  const failedByStatus = status.includes("fail") || status.includes("error");

  const errorMessage = directError || metaError || transactionError;

  return {
    failed: failedByStatus || errorMessage !== null,
    errorMessage
  };
}

function fingerprintEvent(event: Record<string, unknown>): string {
  const rawPayload = JSON.stringify(event);
  return createHash("sha256").update(rawPayload).digest("hex");
}

function normalizeEvent(event: Record<string, unknown>): NormalizedHeliusEvent {
  const status = hasFailedStatus(event);

  return {
    eventId: extractEventId(event),
    eventFingerprint: fingerprintEvent(event),
    signature: extractSignature(event),
    eventType: extractEventType(event),
    slot: extractSlot(event),
    failed: status.failed,
    errorMessage: status.errorMessage
  };
}

function parseAuthorizationHeader(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.toLowerCase().startsWith("bearer ")) {
    return trimmed.slice(7).trim() || null;
  }

  return trimmed;
}

function safeSecretMatch(expected: string, received: string | null): boolean {
  if (!received) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}

function isAuthorizedWebhookRequest(request: NextRequest): boolean {
  const expectedSecret = process.env[WEBHOOK_SECRET_ENV]?.trim();

  if (!expectedSecret) {
    return true;
  }

  const providedSecret = asString(request.headers.get("x-helius-webhook-secret"))
    || parseAuthorizationHeader(request.headers.get("authorization"));

  return safeSecretMatch(expectedSecret, providedSecret);
}

function resolveWebhookJobId(request: NextRequest, payload: unknown): string | null {
  const fromQuery = asString(request.nextUrl.searchParams.get("jobId"));

  if (fromQuery) {
    return fromQuery;
  }

  const payloadRecord = asRecord(payload);
  const metadata = payloadRecord ? asRecord(payloadRecord.metadata) : null;

  return (payloadRecord ? asString(payloadRecord.jobId) : null) || (metadata ? asString(metadata.jobId) : null);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorizedWebhookRequest(request)) {
    return NextResponse.json({ error: "Unauthorized webhook request." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as unknown;
  const jobId = resolveWebhookJobId(request, payload);

  if (!jobId) {
    return NextResponse.json({ error: "jobId is required (query param or payload field)." }, { status: 400 });
  }

  let events: Record<string, unknown>[];

  try {
    events = extractEvents(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid webhook payload." },
      { status: 400 }
    );
  }

  try {
    const resolutionsBySignature = new Map<string, SignatureResolution>();
    let duplicateEvents = 0;
    let acceptedEvents = 0;

    for (const event of events) {
      const normalized = normalizeEvent(event);
      const dedupeResult = recordMintWebhookEvent({
        provider: HELIUS_PROVIDER,
        eventId: normalized.eventId,
        eventFingerprint: normalized.eventFingerprint,
        signature: normalized.signature,
        eventType: normalized.eventType,
        slot: normalized.slot
      });

      if (dedupeResult.duplicate) {
        duplicateEvents += 1;
        continue;
      }

      acceptedEvents += 1;

      if (!normalized.signature) {
        continue;
      }

      const previous = resolutionsBySignature.get(normalized.signature);
      const failed = Boolean(previous?.failed) || normalized.failed;
      const confirmed = !failed && (Boolean(previous?.confirmed) || !normalized.failed);
      const errorMessage = previous?.errorMessage || normalized.errorMessage;

      resolutionsBySignature.set(normalized.signature, {
        signature: normalized.signature,
        confirmed,
        failed,
        errorMessage
      });
    }

    const resolutions = Array.from(resolutionsBySignature.values());
    const reconcileResult = resolutions.length > 0
      ? reconcileMintJobSignatures({
          jobId,
          resolutions
        })
      : {
          job: getMintJob(jobId),
          updatedItems: []
        };
    const { job, updatedItems } = reconcileResult;

    return NextResponse.json({
      job,
      progress: calculateMintJobProgress(job),
      updatedItems,
      webhook: {
        provider: HELIUS_PROVIDER,
        receivedEvents: events.length,
        acceptedEvents,
        duplicateEvents,
        resolvedSignatures: resolutions.length
      }
    });
  } catch (error) {
    if (isMintOrchestratorError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Could not process Helius webhook." }, { status: 500 });
  }
}
