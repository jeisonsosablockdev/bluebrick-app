import { randomUUID } from "node:crypto";

import type { PoolClient } from "pg";

import { withDbClient } from "@/lib/db/pool";
import {
  hasNotificationsDatabase,
  isNotificationsSchemaUnavailableError
} from "@/lib/notifications/runtime-config";

export type WebPushSubscriptionStatus = "active" | "revoked" | "gone" | "failing";
export type WebPushPlatformFamily = "ios" | "android" | "desktop" | "unknown";
export type WebPushAppMode = "browser" | "standalone";

export type WebPushSubscriptionRecord = {
  id: string;
  accountId: string;
  walletPublicKey: string;
  endpoint: string;
  p256dh: string;
  authSecret: string;
  userAgent: string | null;
  platformFamily: WebPushPlatformFamily;
  appMode: WebPushAppMode;
  status: WebPushSubscriptionStatus;
  consentSource: string;
  subscribedAt: string;
  lastSeenAt: string;
  lastSentAt: string | null;
  lastErrorCode: string | null;
  lastErrorAt: string | null;
  revokedAt: string | null;
};

export type UpsertWebPushSubscriptionInput = {
  accountId: string;
  walletPublicKey: string;
  endpoint: string;
  p256dh: string;
  authSecret: string;
  userAgent: string | null;
  platformFamily: WebPushPlatformFamily;
  appMode: WebPushAppMode;
  consentSource: string;
};

export type RevokeWebPushSubscriptionInput = {
  accountId: string;
  walletPublicKey: string;
  endpoint: string;
};

export type MarkWebPushSubscriptionFailureInput = {
  subscriptionId: string;
  errorCode: string;
};

export type MarkWebPushSubscriptionGoneInput = {
  subscriptionId: string;
  errorCode: string;
};

type InMemoryRecordState = WebPushSubscriptionRecord;

const inMemorySubscriptionByEndpoint = new Map<string, InMemoryRecordState>();

export class WebPushSubscriptionRepositoryError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

export function __resetWebPushSubscriptionRepositoryStateForTests(): void {
  inMemorySubscriptionByEndpoint.clear();
}

export function __getWebPushSubscriptionRecordsForTests(): WebPushSubscriptionRecord[] {
  return Array.from(inMemorySubscriptionByEndpoint.values()).map((record) => cloneRecord(record));
}

function nowIso(): string {
  return new Date().toISOString();
}

function trimRequired(value: string, field: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new WebPushSubscriptionRepositoryError("INVALID_SUBSCRIPTION_INPUT", `${field} is required.`);
  }

  return normalized;
}

function normalizeOptionalText(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized || null;
}

function normalizeUpsertInput(input: UpsertWebPushSubscriptionInput): UpsertWebPushSubscriptionInput {
  return {
    accountId: trimRequired(input.accountId, "accountId"),
    walletPublicKey: trimRequired(input.walletPublicKey, "walletPublicKey"),
    endpoint: trimRequired(input.endpoint, "endpoint"),
    p256dh: trimRequired(input.p256dh, "p256dh"),
    authSecret: trimRequired(input.authSecret, "authSecret"),
    userAgent: normalizeOptionalText(input.userAgent),
    platformFamily: input.platformFamily,
    appMode: input.appMode,
    consentSource: trimRequired(input.consentSource, "consentSource")
  };
}

function normalizeRevokeInput(input: RevokeWebPushSubscriptionInput): RevokeWebPushSubscriptionInput {
  return {
    accountId: trimRequired(input.accountId, "accountId"),
    walletPublicKey: trimRequired(input.walletPublicKey, "walletPublicKey"),
    endpoint: trimRequired(input.endpoint, "endpoint")
  };
}

function toRecord(row: Record<string, unknown>): WebPushSubscriptionRecord {
  return {
    id: String(row.id),
    accountId: String(row.account_id),
    walletPublicKey: String(row.wallet_public_key),
    endpoint: String(row.endpoint),
    p256dh: String(row.p256dh),
    authSecret: String(row.auth_secret),
    userAgent: typeof row.user_agent === "string" ? row.user_agent : null,
    platformFamily: row.platform_family as WebPushPlatformFamily,
    appMode: row.app_mode as WebPushAppMode,
    status: row.status as WebPushSubscriptionStatus,
    consentSource: String(row.consent_source),
    subscribedAt: new Date(String(row.subscribed_at)).toISOString(),
    lastSeenAt: new Date(String(row.last_seen_at)).toISOString(),
    lastSentAt: row.last_sent_at ? new Date(String(row.last_sent_at)).toISOString() : null,
    lastErrorCode: typeof row.last_error_code === "string" ? row.last_error_code : null,
    lastErrorAt: row.last_error_at ? new Date(String(row.last_error_at)).toISOString() : null,
    revokedAt: row.revoked_at ? new Date(String(row.revoked_at)).toISOString() : null
  };
}

function cloneRecord(record: InMemoryRecordState): WebPushSubscriptionRecord {
  return { ...record };
}

function upsertInMemory(input: UpsertWebPushSubscriptionInput): WebPushSubscriptionRecord {
  const normalized = normalizeUpsertInput(input);
  const existing = inMemorySubscriptionByEndpoint.get(normalized.endpoint);
  const timestamp = nowIso();

  if (existing) {
    if (existing.accountId !== normalized.accountId || existing.walletPublicKey !== normalized.walletPublicKey) {
      throw new WebPushSubscriptionRepositoryError(
        "SUBSCRIPTION_OWNERSHIP_MISMATCH",
        "Subscription endpoint is already owned by another account or wallet."
      );
    }

    existing.p256dh = normalized.p256dh;
    existing.authSecret = normalized.authSecret;
    existing.userAgent = normalized.userAgent;
    existing.platformFamily = normalized.platformFamily;
    existing.appMode = normalized.appMode;
    existing.status = "active";
    existing.consentSource = normalized.consentSource;
    existing.lastSeenAt = timestamp;
    existing.lastErrorCode = null;
    existing.lastErrorAt = null;
    existing.revokedAt = null;

    return cloneRecord(existing);
  }

  const record: WebPushSubscriptionRecord = {
    id: randomUUID(),
    accountId: normalized.accountId,
    walletPublicKey: normalized.walletPublicKey,
    endpoint: normalized.endpoint,
    p256dh: normalized.p256dh,
    authSecret: normalized.authSecret,
    userAgent: normalized.userAgent,
    platformFamily: normalized.platformFamily,
    appMode: normalized.appMode,
    status: "active",
    consentSource: normalized.consentSource,
    subscribedAt: timestamp,
    lastSeenAt: timestamp,
    lastSentAt: null,
    lastErrorCode: null,
    lastErrorAt: null,
    revokedAt: null
  };

  inMemorySubscriptionByEndpoint.set(record.endpoint, record);
  return cloneRecord(record);
}

function revokeInMemory(input: RevokeWebPushSubscriptionInput): WebPushSubscriptionRecord | null {
  const normalized = normalizeRevokeInput(input);
  const existing = inMemorySubscriptionByEndpoint.get(normalized.endpoint);

  if (!existing) {
    return null;
  }

  if (existing.accountId !== normalized.accountId || existing.walletPublicKey !== normalized.walletPublicKey) {
    throw new WebPushSubscriptionRepositoryError(
      "SUBSCRIPTION_OWNERSHIP_MISMATCH",
      "Subscription endpoint is already owned by another account or wallet."
    );
  }

  const timestamp = nowIso();
  existing.status = "revoked";
  existing.lastSeenAt = timestamp;
  existing.revokedAt = timestamp;

  return cloneRecord(existing);
}

function findByIdInMemory(subscriptionId: string): InMemoryRecordState {
  const normalizedId = trimRequired(subscriptionId, "subscriptionId");

  for (const record of inMemorySubscriptionByEndpoint.values()) {
    if (record.id === normalizedId) {
      return record;
    }
  }

  throw new WebPushSubscriptionRepositoryError("SUBSCRIPTION_NOT_FOUND", "Subscription endpoint was not found.");
}

function markFailureInMemory(input: MarkWebPushSubscriptionFailureInput): WebPushSubscriptionRecord {
  const record = findByIdInMemory(input.subscriptionId);
  const timestamp = nowIso();
  record.status = "failing";
  record.lastErrorCode = trimRequired(input.errorCode, "errorCode");
  record.lastErrorAt = timestamp;
  record.lastSeenAt = timestamp;
  return cloneRecord(record);
}

function markGoneInMemory(input: MarkWebPushSubscriptionGoneInput): WebPushSubscriptionRecord {
  const record = findByIdInMemory(input.subscriptionId);
  const timestamp = nowIso();
  record.status = "gone";
  record.lastErrorCode = trimRequired(input.errorCode, "errorCode");
  record.lastErrorAt = timestamp;
  record.revokedAt = timestamp;
  record.lastSeenAt = timestamp;
  return cloneRecord(record);
}

function markSuccessInMemory(subscriptionId: string): WebPushSubscriptionRecord {
  const record = findByIdInMemory(subscriptionId);
  const timestamp = nowIso();
  record.status = "active";
  record.lastSentAt = timestamp;
  record.lastSeenAt = timestamp;
  record.lastErrorCode = null;
  record.lastErrorAt = null;
  return cloneRecord(record);
}

function listByWalletInMemory(accountId: string, walletPublicKey: string): WebPushSubscriptionRecord[] {
  return Array.from(inMemorySubscriptionByEndpoint.values())
    .filter((record) => record.accountId === accountId && record.walletPublicKey === walletPublicKey)
    .sort((left, right) => right.lastSeenAt.localeCompare(left.lastSeenAt))
    .map((record) => cloneRecord(record));
}

async function upsertWithClient(client: PoolClient, input: UpsertWebPushSubscriptionInput): Promise<WebPushSubscriptionRecord> {
  const normalized = normalizeUpsertInput(input);
  const lastSeenAt = nowIso();

  const result = await client.query(
    `
      INSERT INTO web_push_subscriptions (
        account_id,
        wallet_public_key,
        endpoint,
        p256dh,
        auth_secret,
        user_agent,
        platform_family,
        app_mode,
        status,
        consent_source,
        last_seen_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, $10)
      ON CONFLICT (endpoint) DO UPDATE
      SET p256dh = EXCLUDED.p256dh,
          auth_secret = EXCLUDED.auth_secret,
          user_agent = EXCLUDED.user_agent,
          platform_family = EXCLUDED.platform_family,
          app_mode = EXCLUDED.app_mode,
          status = 'active',
          consent_source = EXCLUDED.consent_source,
          last_seen_at = EXCLUDED.last_seen_at,
          last_error_code = NULL,
          last_error_at = NULL,
          revoked_at = NULL
      WHERE web_push_subscriptions.account_id = EXCLUDED.account_id
        AND web_push_subscriptions.wallet_public_key = EXCLUDED.wallet_public_key
      RETURNING *
    `,
    [
      normalized.accountId,
      normalized.walletPublicKey,
      normalized.endpoint,
      normalized.p256dh,
      normalized.authSecret,
      normalized.userAgent,
      normalized.platformFamily,
      normalized.appMode,
      normalized.consentSource,
      lastSeenAt
    ]
  );

  if (result.rowCount && result.rows[0]) {
    return toRecord(result.rows[0]);
  }

  const ownershipCheck = await client.query(
    `
      SELECT account_id, wallet_public_key
      FROM web_push_subscriptions
      WHERE endpoint = $1
      LIMIT 1
    `,
    [normalized.endpoint]
  );

  if (ownershipCheck.rowCount) {
    throw new WebPushSubscriptionRepositoryError(
      "SUBSCRIPTION_OWNERSHIP_MISMATCH",
      "Subscription endpoint is already owned by another account or wallet."
    );
  }

  throw new WebPushSubscriptionRepositoryError("SUBSCRIPTION_UPSERT_FAILED", "Could not upsert the web push subscription.");
}

async function revokeWithClient(client: PoolClient, input: RevokeWebPushSubscriptionInput): Promise<WebPushSubscriptionRecord | null> {
  const normalized = normalizeRevokeInput(input);
  const revokedAt = nowIso();
  const result = await client.query(
    `
      UPDATE web_push_subscriptions
      SET status = 'revoked',
          revoked_at = $4,
          last_seen_at = $4
      WHERE endpoint = $1
        AND account_id = $2
        AND wallet_public_key = $3
      RETURNING *
    `,
    [normalized.endpoint, normalized.accountId, normalized.walletPublicKey, revokedAt]
  );

  if (result.rowCount && result.rows[0]) {
    return toRecord(result.rows[0]);
  }

  const ownershipCheck = await client.query(
    `
      SELECT account_id, wallet_public_key
      FROM web_push_subscriptions
      WHERE endpoint = $1
      LIMIT 1
    `,
    [normalized.endpoint]
  );

  if (ownershipCheck.rowCount) {
    throw new WebPushSubscriptionRepositoryError(
      "SUBSCRIPTION_OWNERSHIP_MISMATCH",
      "Subscription endpoint is already owned by another account or wallet."
    );
  }

  return null;
}

async function listByWalletWithClient(
  client: PoolClient,
  accountId: string,
  walletPublicKey: string
): Promise<WebPushSubscriptionRecord[]> {
  const result = await client.query(
    `
      SELECT *
      FROM web_push_subscriptions
      WHERE account_id = $1
        AND wallet_public_key = $2
      ORDER BY last_seen_at DESC, subscribed_at DESC
    `,
    [trimRequired(accountId, "accountId"), trimRequired(walletPublicKey, "walletPublicKey")]
  );

  return result.rows.map((row) => toRecord(row));
}

async function findByEndpointWithClient(client: PoolClient, endpoint: string): Promise<WebPushSubscriptionRecord | null> {
  const result = await client.query(
    `
      SELECT *
      FROM web_push_subscriptions
      WHERE endpoint = $1
      LIMIT 1
    `,
    [trimRequired(endpoint, "endpoint")]
  );

  return result.rowCount && result.rows[0] ? toRecord(result.rows[0]) : null;
}

async function listActiveByWalletWithClient(client: PoolClient, walletPublicKey: string): Promise<WebPushSubscriptionRecord[]> {
  const result = await client.query(
    `
      SELECT *
      FROM web_push_subscriptions
      WHERE wallet_public_key = $1
        AND status = 'active'
      ORDER BY last_seen_at DESC, subscribed_at DESC
    `,
    [trimRequired(walletPublicKey, "walletPublicKey")]
  );

  return result.rows.map((row) => toRecord(row));
}

async function markSuccessWithClient(client: PoolClient, subscriptionId: string): Promise<WebPushSubscriptionRecord> {
  const timestamp = nowIso();
  const result = await client.query(
    `
      UPDATE web_push_subscriptions
      SET status = 'active',
          last_sent_at = $2,
          last_seen_at = $2,
          last_error_code = NULL,
          last_error_at = NULL
      WHERE id = $1
      RETURNING *
    `,
    [trimRequired(subscriptionId, "subscriptionId"), timestamp]
  );

  if (result.rowCount && result.rows[0]) {
    return toRecord(result.rows[0]);
  }

  throw new WebPushSubscriptionRepositoryError("SUBSCRIPTION_NOT_FOUND", "Subscription endpoint was not found.");
}

async function markFailureWithClient(
  client: PoolClient,
  input: MarkWebPushSubscriptionFailureInput
): Promise<WebPushSubscriptionRecord> {
  const timestamp = nowIso();
  const result = await client.query(
    `
      UPDATE web_push_subscriptions
      SET status = 'failing',
          last_error_code = $2,
          last_error_at = $3,
          last_seen_at = $3
      WHERE id = $1
      RETURNING *
    `,
    [trimRequired(input.subscriptionId, "subscriptionId"), trimRequired(input.errorCode, "errorCode"), timestamp]
  );

  if (result.rowCount && result.rows[0]) {
    return toRecord(result.rows[0]);
  }

  throw new WebPushSubscriptionRepositoryError("SUBSCRIPTION_NOT_FOUND", "Subscription endpoint was not found.");
}

async function markGoneWithClient(client: PoolClient, input: MarkWebPushSubscriptionGoneInput): Promise<WebPushSubscriptionRecord> {
  const timestamp = nowIso();
  const result = await client.query(
    `
      UPDATE web_push_subscriptions
      SET status = 'gone',
          last_error_code = $2,
          last_error_at = $3,
          revoked_at = $3,
          last_seen_at = $3
      WHERE id = $1
      RETURNING *
    `,
    [trimRequired(input.subscriptionId, "subscriptionId"), trimRequired(input.errorCode, "errorCode"), timestamp]
  );

  if (result.rowCount && result.rows[0]) {
    return toRecord(result.rows[0]);
  }

  throw new WebPushSubscriptionRepositoryError("SUBSCRIPTION_NOT_FOUND", "Subscription endpoint was not found.");
}

export async function upsertWebPushSubscription(input: UpsertWebPushSubscriptionInput): Promise<WebPushSubscriptionRecord> {
  if (!hasNotificationsDatabase()) {
    return upsertInMemory(input);
  }

  try {
    return await withDbClient((client) => upsertWithClient(client, input));
  } catch (error) {
    if (isNotificationsSchemaUnavailableError(error)) {
      return upsertInMemory(input);
    }

    throw error;
  }
}

export async function revokeWebPushSubscription(input: RevokeWebPushSubscriptionInput): Promise<WebPushSubscriptionRecord | null> {
  if (!hasNotificationsDatabase()) {
    return revokeInMemory(input);
  }

  try {
    return await withDbClient((client) => revokeWithClient(client, input));
  } catch (error) {
    if (isNotificationsSchemaUnavailableError(error)) {
      return revokeInMemory(input);
    }

    throw error;
  }
}

export async function listWebPushSubscriptionsByWallet(
  accountId: string,
  walletPublicKey: string
): Promise<WebPushSubscriptionRecord[]> {
  if (!hasNotificationsDatabase()) {
    return listByWalletInMemory(trimRequired(accountId, "accountId"), trimRequired(walletPublicKey, "walletPublicKey"));
  }

  try {
    return await withDbClient((client) => listByWalletWithClient(client, accountId, walletPublicKey));
  } catch (error) {
    if (isNotificationsSchemaUnavailableError(error)) {
      return listByWalletInMemory(trimRequired(accountId, "accountId"), trimRequired(walletPublicKey, "walletPublicKey"));
    }

    throw error;
  }
}

export async function findWebPushSubscriptionByEndpoint(endpoint: string): Promise<WebPushSubscriptionRecord | null> {
  const normalizedEndpoint = trimRequired(endpoint, "endpoint");

  if (!hasNotificationsDatabase()) {
    const record = inMemorySubscriptionByEndpoint.get(normalizedEndpoint);
    return record ? cloneRecord(record) : null;
  }

  try {
    return await withDbClient((client) => findByEndpointWithClient(client, normalizedEndpoint));
  } catch (error) {
    if (isNotificationsSchemaUnavailableError(error)) {
      const record = inMemorySubscriptionByEndpoint.get(normalizedEndpoint);
      return record ? cloneRecord(record) : null;
    }

    throw error;
  }
}

export async function listActiveWebPushSubscriptionsByWallet(walletPublicKey: string): Promise<WebPushSubscriptionRecord[]> {
  const normalizedWallet = trimRequired(walletPublicKey, "walletPublicKey");

  if (!hasNotificationsDatabase()) {
    return Array.from(inMemorySubscriptionByEndpoint.values())
      .filter((record) => record.walletPublicKey === normalizedWallet && record.status === "active")
      .sort((left, right) => right.lastSeenAt.localeCompare(left.lastSeenAt))
      .map((record) => cloneRecord(record));
  }

  try {
    return await withDbClient((client) => listActiveByWalletWithClient(client, normalizedWallet));
  } catch (error) {
    if (isNotificationsSchemaUnavailableError(error)) {
      return Array.from(inMemorySubscriptionByEndpoint.values())
        .filter((record) => record.walletPublicKey === normalizedWallet && record.status === "active")
        .sort((left, right) => right.lastSeenAt.localeCompare(left.lastSeenAt))
        .map((record) => cloneRecord(record));
    }

    throw error;
  }
}

export async function markWebPushSubscriptionDeliverySuccess(subscriptionId: string): Promise<WebPushSubscriptionRecord> {
  const normalizedId = trimRequired(subscriptionId, "subscriptionId");

  if (!hasNotificationsDatabase()) {
    return markSuccessInMemory(normalizedId);
  }

  try {
    return await withDbClient((client) => markSuccessWithClient(client, normalizedId));
  } catch (error) {
    if (isNotificationsSchemaUnavailableError(error)) {
      return markSuccessInMemory(normalizedId);
    }

    throw error;
  }
}

export async function markWebPushSubscriptionDeliveryFailure(
  input: MarkWebPushSubscriptionFailureInput
): Promise<WebPushSubscriptionRecord> {
  if (!hasNotificationsDatabase()) {
    return markFailureInMemory(input);
  }

  try {
    return await withDbClient((client) => markFailureWithClient(client, input));
  } catch (error) {
    if (isNotificationsSchemaUnavailableError(error)) {
      return markFailureInMemory(input);
    }

    throw error;
  }
}

export async function markWebPushSubscriptionGone(input: MarkWebPushSubscriptionGoneInput): Promise<WebPushSubscriptionRecord> {
  if (!hasNotificationsDatabase()) {
    return markGoneInMemory(input);
  }

  try {
    return await withDbClient((client) => markGoneWithClient(client, input));
  } catch (error) {
    if (isNotificationsSchemaUnavailableError(error)) {
      return markGoneInMemory(input);
    }

    throw error;
  }
}
