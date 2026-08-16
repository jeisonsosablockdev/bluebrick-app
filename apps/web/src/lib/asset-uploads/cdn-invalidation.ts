import { randomUUID } from "node:crypto";

import { withDbClient } from "@/features/shared/infrastructure/db/pool";

const MAX_INVALIDATION_PATHS = 25;
const MAX_ERROR_LENGTH = 500;

type InvalidationSource = "manual" | "finalize-replace";
type InvalidationStatus = "success" | "failed" | "skipped";

export type CdnInvalidationResult = {
  status: InvalidationStatus;
  paths: string[];
  providerRequestId: string | null;
  reason: string | null;
};

type InvalidationEventInput = {
  actorPubkey: string;
  source: InvalidationSource;
  uploadId: string | null;
  paths: string[];
  status: InvalidationStatus;
  providerRequestId: string | null;
  errorMessage: string | null;
};

function sanitizeErrorMessage(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return value
    .replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, "")
    .trim()
    .slice(0, MAX_ERROR_LENGTH);
}

function parseCandidatePath(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("/")) {
    return trimmed.split(/[?#]/)[0] || null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed.pathname || null;
  } catch {
    return null;
  }
}

export function normalizeInvalidationPaths(paths: string[]): string[] {
  const normalized = paths
    .map((path) => parseCandidatePath(path))
    .filter((path): path is string => Boolean(path))
    .map((path) => (path.startsWith("/") ? path : `/${path}`))
    .slice(0, MAX_INVALIDATION_PATHS);

  return Array.from(new Set(normalized));
}

async function recordInvalidationEvent(input: InvalidationEventInput): Promise<void> {
  try {
    await withDbClient(async (client) => {
      await client.query(
        `
          INSERT INTO asset_cdn_invalidation_events (
            id,
            actor_pubkey,
            source,
            upload_id,
            paths,
            status,
            provider_request_id,
            error_message
          )
          VALUES ($1::uuid, $2, $3, $4::uuid, $5::jsonb, $6, $7, $8)
        `,
        [
          randomUUID(),
          input.actorPubkey,
          input.source,
          input.uploadId,
          JSON.stringify(input.paths),
          input.status,
          input.providerRequestId,
          sanitizeErrorMessage(input.errorMessage)
        ]
      );
    });
  } catch {
    // Best effort audit trail; do not block upload finalization if logging fails.
  }
}

function getInvalidationWebhookConfig(): { url: string; token: string | null } | null {
  const url = process.env.CDN_INVALIDATION_WEBHOOK_URL?.trim();
  if (!url) {
    return null;
  }

  return {
    url,
    token: process.env.CDN_INVALIDATION_WEBHOOK_TOKEN?.trim() || null
  };
}

export async function invalidateCdnPaths(input: {
  actorPubkey: string;
  source: InvalidationSource;
  uploadId?: string | null;
  paths: string[];
}): Promise<CdnInvalidationResult> {
  const normalizedPaths = normalizeInvalidationPaths(input.paths);

  if (normalizedPaths.length === 0) {
    const result: CdnInvalidationResult = {
      status: "skipped",
      paths: [],
      providerRequestId: null,
      reason: "No valid paths to invalidate."
    };

    await recordInvalidationEvent({
      actorPubkey: input.actorPubkey,
      source: input.source,
      uploadId: input.uploadId ?? null,
      paths: normalizedPaths,
      status: result.status,
      providerRequestId: null,
      errorMessage: result.reason
    });

    return result;
  }

  const config = getInvalidationWebhookConfig();
  if (!config) {
    const result: CdnInvalidationResult = {
      status: "skipped",
      paths: normalizedPaths,
      providerRequestId: null,
      reason: "CDN invalidation webhook is not configured."
    };

    await recordInvalidationEvent({
      actorPubkey: input.actorPubkey,
      source: input.source,
      uploadId: input.uploadId ?? null,
      paths: normalizedPaths,
      status: result.status,
      providerRequestId: null,
      errorMessage: result.reason
    });

    return result;
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };

    if (config.token) {
      headers.Authorization = `Bearer ${config.token}`;
    }

    const response = await fetch(config.url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        paths: normalizedPaths,
        source: input.source,
        requestedAt: new Date().toISOString()
      })
    });

    const payload = await response.json().catch(() => null) as { requestId?: unknown; error?: unknown } | null;
    const providerRequestId = typeof payload?.requestId === "string" ? payload.requestId : null;

    if (!response.ok) {
      const reason = `Invalidation provider returned ${response.status}.`;
      const result: CdnInvalidationResult = {
        status: "failed",
        paths: normalizedPaths,
        providerRequestId,
        reason
      };

      await recordInvalidationEvent({
        actorPubkey: input.actorPubkey,
        source: input.source,
        uploadId: input.uploadId ?? null,
        paths: normalizedPaths,
        status: result.status,
        providerRequestId,
        errorMessage: reason
      });

      return result;
    }

    const result: CdnInvalidationResult = {
      status: "success",
      paths: normalizedPaths,
      providerRequestId,
      reason: null
    };

    await recordInvalidationEvent({
      actorPubkey: input.actorPubkey,
      source: input.source,
      uploadId: input.uploadId ?? null,
      paths: normalizedPaths,
      status: result.status,
      providerRequestId,
      errorMessage: null
    });

    return result;
  } catch (error) {
    const reason = error instanceof Error ? error.message : "CDN invalidation request failed.";
    const result: CdnInvalidationResult = {
      status: "failed",
      paths: normalizedPaths,
      providerRequestId: null,
      reason
    };

    await recordInvalidationEvent({
      actorPubkey: input.actorPubkey,
      source: input.source,
      uploadId: input.uploadId ?? null,
      paths: normalizedPaths,
      status: result.status,
      providerRequestId: null,
      errorMessage: reason
    });

    return result;
  }
}
