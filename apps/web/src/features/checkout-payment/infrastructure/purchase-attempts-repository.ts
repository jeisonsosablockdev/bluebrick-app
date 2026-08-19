import { randomUUID } from "node:crypto";

import type { PoolClient } from "pg";

import { withDbClient } from "@/features/shared/infrastructure/db/pool";

export type PurchaseAttemptStatus = "created" | "prepared" | "submitted" | "confirmed" | "failed";
export type PurchaseAttemptAssetVerificationStatus = "not_required" | "pending" | "verified" | "failed";

export type PurchaseAttemptRecord = {
  id: string;
  propertyId: string;
  walletPublicKey: string;
  candyMachineAddress: string;
  collectionAddress: string;
  challengeId: string | null;
  clientIp: string | null;
  quantity: number;
  quotedPriceLamports: number | null;
  preparedPriceLamports: number | null;
  cacheUpdatedAt: string | null;
  preparedTxMessageBase64: string | null;
  expectedAssetAddresses: string[];
  verifiedAssetAddresses: string[];
  assetVerificationStatus: PurchaseAttemptAssetVerificationStatus;
  assetVerificationError: string | null;
  assetVerificationCheckedAt: string | null;
  idempotencyKey: string;
  idempotencyExpiresAt: string;
  preparedAt: string | null;
  txSignature: string | null;
  status: PurchaseAttemptStatus;
  errorCode: string | null;
  errorMessage: string | null;
  submittedAt: string | null;
  confirmedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePurchaseAttemptInput = {
  propertyId: string;
  walletPublicKey: string;
  candyMachineAddress: string;
  collectionAddress: string;
  challengeId: string | null;
  clientIp: string | null;
  quantity?: number;
  quotedPriceLamports: number | null;
  idempotencyKey: string;
  idempotencyExpiresAt: string;
};

type PurchaseAttemptRow = {
  id: string;
  property_id: string;
  wallet_public_key: string;
  candy_machine_address: string;
  collection_address: string;
  challenge_id: string | null;
  client_ip: string | null;
  quantity: number;
  quoted_price_lamports: string | number | null;
  prepared_price_lamports: string | number | null;
  cache_updated_at: string | Date | null;
  prepared_tx_message_b64: string | null;
  expected_asset_addresses: unknown;
  verified_asset_addresses: unknown;
  asset_verification_status: PurchaseAttemptAssetVerificationStatus;
  asset_verification_error: string | null;
  asset_verification_checked_at: string | Date | null;
  idempotency_key: string;
  idempotency_expires_at: string | Date;
  prepared_at: string | Date | null;
  tx_signature: string | null;
  status: PurchaseAttemptStatus;
  error_code: string | null;
  error_message: string | null;
  submitted_at: string | Date | null;
  confirmed_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type DbOptions = {
  client?: PoolClient;
  forUpdate?: boolean;
};

const PURCHASE_ATTEMPT_SELECT_COLUMNS = `
  id,
  property_id,
  wallet_public_key,
  candy_machine_address,
  collection_address,
  challenge_id,
  client_ip,
  quantity,
  quoted_price_lamports,
  prepared_price_lamports,
  cache_updated_at,
  prepared_tx_message_b64,
  expected_asset_addresses,
  verified_asset_addresses,
  asset_verification_status,
  asset_verification_error,
  asset_verification_checked_at,
  idempotency_key,
  idempotency_expires_at,
  prepared_at,
  tx_signature,
  status,
  error_code,
  error_message,
  submitted_at,
  confirmed_at,
  created_at,
  updated_at
`;

export function isPurchaseAttemptsDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
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

function toNumber(value: string | number | null): number | null {
  if (value === null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeStringArray(value: unknown): string[] {
  const parsed = typeof value === "string" ? JSON.parse(value) as unknown : value;
  if (!Array.isArray(parsed)) {
    return [];
  }

  const normalized = new Set<string>();
  for (const item of parsed) {
    if (typeof item !== "string") {
      continue;
    }

    const trimmed = item.trim();
    if (trimmed) {
      normalized.add(trimmed);
    }
  }

  return Array.from(normalized);
}

function safeNormalizeStringArray(value: unknown): string[] {
  try {
    return normalizeStringArray(value);
  } catch {
    return [];
  }
}

function mapRow(row: PurchaseAttemptRow): PurchaseAttemptRecord {
  const createdAt = toIso(row.created_at);
  const updatedAt = toIso(row.updated_at);

  return {
    id: row.id,
    propertyId: row.property_id,
    walletPublicKey: row.wallet_public_key,
    candyMachineAddress: row.candy_machine_address,
    collectionAddress: row.collection_address,
    challengeId: row.challenge_id,
    clientIp: row.client_ip,
    quantity: Number(row.quantity),
    quotedPriceLamports: toNumber(row.quoted_price_lamports),
    preparedPriceLamports: toNumber(row.prepared_price_lamports),
    cacheUpdatedAt: toIso(row.cache_updated_at),
    preparedTxMessageBase64: row.prepared_tx_message_b64,
    expectedAssetAddresses: safeNormalizeStringArray(row.expected_asset_addresses),
    verifiedAssetAddresses: safeNormalizeStringArray(row.verified_asset_addresses),
    assetVerificationStatus: row.asset_verification_status ?? "not_required",
    assetVerificationError: row.asset_verification_error,
    assetVerificationCheckedAt: toIso(row.asset_verification_checked_at),
    idempotencyKey: row.idempotency_key,
    idempotencyExpiresAt: toIso(row.idempotency_expires_at) ?? new Date().toISOString(),
    preparedAt: toIso(row.prepared_at),
    txSignature: row.tx_signature,
    status: row.status,
    errorCode: row.error_code,
    errorMessage: row.error_message,
    submittedAt: toIso(row.submitted_at),
    confirmedAt: toIso(row.confirmed_at),
    createdAt: createdAt ?? new Date().toISOString(),
    updatedAt: updatedAt ?? new Date().toISOString()
  };
}

function buildAssetVerificationFailurePatch(
  record: PurchaseAttemptRecord,
  errorMessage: string,
  checkedAt: string
): Pick<PurchaseAttemptRecord, "assetVerificationCheckedAt" | "assetVerificationError" | "assetVerificationStatus"> {
  if (record.expectedAssetAddresses.length === 0) {
    return {
      assetVerificationStatus: record.assetVerificationStatus,
      assetVerificationError: record.assetVerificationError,
      assetVerificationCheckedAt: record.assetVerificationCheckedAt
    };
  }

  return {
    assetVerificationStatus: "failed",
    assetVerificationError: errorMessage,
    assetVerificationCheckedAt: checkedAt
  };
}

function assetVerificationFailureSetSql(errorMessagePlaceholder: "$2" | "$3"): string {
  return `asset_verification_status = CASE
           WHEN jsonb_array_length(expected_asset_addresses) > 0 THEN 'failed'
           ELSE asset_verification_status
         END,
         asset_verification_error = CASE
           WHEN jsonb_array_length(expected_asset_addresses) > 0 THEN ${errorMessagePlaceholder}
           ELSE asset_verification_error
         END,
         asset_verification_checked_at = CASE
           WHEN jsonb_array_length(expected_asset_addresses) > 0 THEN NOW()
           ELSE asset_verification_checked_at
         END`;
}

function normalizePreparedPriceLamports(value: number | null): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0;
  }

  return Math.floor(value);
}

const inMemoryAttempts = new Map<string, PurchaseAttemptRecord>();
const inMemoryAttemptsByWalletAndIdempotency = new Map<string, string>();

function inMemoryLookupKey(walletPublicKey: string, idempotencyKey: string): string {
  return `${walletPublicKey}:${idempotencyKey}`;
}

function setInMemoryAttempt(record: PurchaseAttemptRecord): void {
  inMemoryAttempts.set(record.id, record);
  inMemoryAttemptsByWalletAndIdempotency.set(
    inMemoryLookupKey(record.walletPublicKey, record.idempotencyKey),
    record.id
  );
}

async function queryWithClient<T>(
  client: PoolClient,
  queryText: string,
  values: unknown[]
): Promise<T | null> {
  const result = await client.query<PurchaseAttemptRow>(queryText, values);
  if (!result.rows[0]) {
    return null;
  }

  return mapRow(result.rows[0]) as T;
}

async function getPurchaseAttemptByIdWithClient(
  client: PoolClient,
  id: string,
  forUpdate = false
): Promise<PurchaseAttemptRecord | null> {
  return queryWithClient<PurchaseAttemptRecord>(
    client,
    `SELECT ${PURCHASE_ATTEMPT_SELECT_COLUMNS}
     FROM purchase_attempts
     WHERE id = $1
     ${forUpdate ? "FOR UPDATE" : ""}`,
    [id]
  );
}

async function getPurchaseAttemptByWalletAndIdempotencyWithClient(
  client: PoolClient,
  input: { walletPublicKey: string; idempotencyKey: string; forUpdate?: boolean }
): Promise<PurchaseAttemptRecord | null> {
  return queryWithClient<PurchaseAttemptRecord>(
    client,
    `SELECT ${PURCHASE_ATTEMPT_SELECT_COLUMNS}
     FROM purchase_attempts
     WHERE wallet_public_key = $1
       AND idempotency_key = $2
     LIMIT 1
     ${input.forUpdate ? "FOR UPDATE" : ""}`,
    [input.walletPublicKey, input.idempotencyKey]
  );
}

async function getPurchaseAttemptBySignatureWithClient(
  client: PoolClient,
  input: { signature: string; forUpdate?: boolean }
): Promise<PurchaseAttemptRecord | null> {
  return queryWithClient<PurchaseAttemptRecord>(
    client,
    `SELECT ${PURCHASE_ATTEMPT_SELECT_COLUMNS}
     FROM purchase_attempts
     WHERE tx_signature = $1
     LIMIT 1
     ${input.forUpdate ? "FOR UPDATE" : ""}`,
    [input.signature]
  );
}

export async function createPurchaseAttempt(input: CreatePurchaseAttemptInput): Promise<PurchaseAttemptRecord> {
  const now = new Date().toISOString();
  const quantity = Number.isInteger(input.quantity) && Number(input.quantity) > 0 ? Number(input.quantity) : 1;
  const record: PurchaseAttemptRecord = {
    id: randomUUID(),
    propertyId: input.propertyId,
    walletPublicKey: input.walletPublicKey,
    candyMachineAddress: input.candyMachineAddress,
    collectionAddress: input.collectionAddress,
    challengeId: input.challengeId,
    clientIp: input.clientIp,
    quantity,
    quotedPriceLamports: input.quotedPriceLamports,
    preparedPriceLamports: null,
    cacheUpdatedAt: null,
    preparedTxMessageBase64: null,
    expectedAssetAddresses: [],
    verifiedAssetAddresses: [],
    assetVerificationStatus: "not_required",
    assetVerificationError: null,
    assetVerificationCheckedAt: null,
    idempotencyKey: input.idempotencyKey,
    idempotencyExpiresAt: input.idempotencyExpiresAt,
    preparedAt: null,
    txSignature: null,
    status: "created",
    errorCode: null,
    errorMessage: null,
    submittedAt: null,
    confirmedAt: null,
    createdAt: now,
    updatedAt: now
  };

  if (!isPurchaseAttemptsDatabaseConfigured()) {
    setInMemoryAttempt(record);
    return { ...record };
  }

  return withDbClient(async (client) => {
    const created = await queryWithClient<PurchaseAttemptRecord>(
      client,
      `INSERT INTO purchase_attempts (
         id,
         property_id,
         wallet_public_key,
         candy_machine_address,
         collection_address,
         challenge_id,
         client_ip,
         quantity,
         quoted_price_lamports,
         idempotency_key,
         idempotency_expires_at,
         status
       )
       VALUES (
         $1,
         $2,
         $3,
         $4,
         $5,
         $6,
         $7,
         $8,
         $9,
         $10,
         $11,
         'created'
       )
       RETURNING ${PURCHASE_ATTEMPT_SELECT_COLUMNS}`,
      [
        record.id,
        record.propertyId,
        record.walletPublicKey,
        record.candyMachineAddress,
        record.collectionAddress,
        record.challengeId,
        record.clientIp,
        record.quantity,
        record.quotedPriceLamports,
        record.idempotencyKey,
        record.idempotencyExpiresAt
      ]
    );

    if (!created) {
      throw new Error("Could not create purchase attempt.");
    }

    return created;
  });
}

export async function markPurchaseAttemptPrepared(input: {
  id: string;
  preparedPriceLamports: number | null;
  cacheUpdatedAt: string;
  preparedTxMessageBase64: string;
  expectedAssetAddresses?: string[];
}, options?: DbOptions): Promise<PurchaseAttemptRecord | null> {
  const normalizedPreparedPriceLamports = normalizePreparedPriceLamports(input.preparedPriceLamports);
  const expectedAssetAddresses = safeNormalizeStringArray(input.expectedAssetAddresses ?? []);
  const assetVerificationStatus: PurchaseAttemptAssetVerificationStatus = expectedAssetAddresses.length > 0
    ? "pending"
    : "not_required";

  if (!isPurchaseAttemptsDatabaseConfigured()) {
    const found = inMemoryAttempts.get(input.id);
    if (!found) {
      return null;
    }

    if (found.status !== "created") {
      return { ...found };
    }

    const updated: PurchaseAttemptRecord = {
      ...found,
      preparedPriceLamports: normalizedPreparedPriceLamports,
      cacheUpdatedAt: input.cacheUpdatedAt,
      preparedTxMessageBase64: input.preparedTxMessageBase64,
      expectedAssetAddresses,
      verifiedAssetAddresses: [],
      assetVerificationStatus,
      assetVerificationError: null,
      assetVerificationCheckedAt: null,
      preparedAt: new Date().toISOString(),
      status: "prepared",
      errorCode: null,
      errorMessage: null,
      updatedAt: new Date().toISOString()
    };
    setInMemoryAttempt(updated);
    return { ...updated };
  }

  const run = async (client: PoolClient) => {
    const updated = await queryWithClient<PurchaseAttemptRecord>(
      client,
       `UPDATE purchase_attempts
       SET
         prepared_price_lamports = $2,
         cache_updated_at = $3,
         prepared_tx_message_b64 = $4,
         expected_asset_addresses = $5::jsonb,
         verified_asset_addresses = '[]'::jsonb,
         asset_verification_status = $6,
         asset_verification_error = NULL,
         asset_verification_checked_at = NULL,
         prepared_at = NOW(),
         status = 'prepared',
         error_code = NULL,
         error_message = NULL
       WHERE id = $1
         AND status = 'created'
       RETURNING ${PURCHASE_ATTEMPT_SELECT_COLUMNS}`,
      [
        input.id,
        normalizedPreparedPriceLamports,
        input.cacheUpdatedAt,
        input.preparedTxMessageBase64,
        JSON.stringify(expectedAssetAddresses),
        assetVerificationStatus
      ]
    );

    if (updated) {
      return updated;
    }

    return getPurchaseAttemptByIdWithClient(client, input.id, false);
  };

  if (options?.client) {
    return run(options.client);
  }

  return withDbClient(run);
}

export async function getPurchaseAttemptById(id: string, options?: DbOptions): Promise<PurchaseAttemptRecord | null> {
  if (!isPurchaseAttemptsDatabaseConfigured()) {
    const found = inMemoryAttempts.get(id);
    return found ? { ...found } : null;
  }

  const run = async (client: PoolClient) => getPurchaseAttemptByIdWithClient(client, id, Boolean(options?.forUpdate));

  if (options?.client) {
    return run(options.client);
  }

  return withDbClient(run);
}

export async function getPurchaseAttemptByWalletAndIdempotency(input: {
  walletPublicKey: string;
  idempotencyKey: string;
}, options?: DbOptions): Promise<PurchaseAttemptRecord | null> {
  if (!isPurchaseAttemptsDatabaseConfigured()) {
    const lookup = inMemoryAttemptsByWalletAndIdempotency.get(inMemoryLookupKey(input.walletPublicKey, input.idempotencyKey));
    if (!lookup) {
      return null;
    }

    const found = inMemoryAttempts.get(lookup);
    return found ? { ...found } : null;
  }

  const run = async (client: PoolClient) => getPurchaseAttemptByWalletAndIdempotencyWithClient(
    client,
    {
      walletPublicKey: input.walletPublicKey,
      idempotencyKey: input.idempotencyKey,
      forUpdate: options?.forUpdate
    }
  );

  if (options?.client) {
    return run(options.client);
  }

  return withDbClient(run);
}

export async function getPurchaseAttemptBySignature(input: {
  signature: string;
}, options?: DbOptions): Promise<PurchaseAttemptRecord | null> {
  const signature = typeof input.signature === "string" ? input.signature.trim() : "";
  if (!signature) {
    return null;
  }

  if (!isPurchaseAttemptsDatabaseConfigured()) {
    for (const attempt of inMemoryAttempts.values()) {
      if (attempt.txSignature === signature) {
        return { ...attempt };
      }
    }

    return null;
  }

  const run = async (client: PoolClient) => getPurchaseAttemptBySignatureWithClient(
    client,
    {
      signature,
      forUpdate: options?.forUpdate
    }
  );

  if (options?.client) {
    return run(options.client);
  }

  return withDbClient(run);
}

export async function markPurchaseAttemptSubmitted(input: {
  id: string;
  signature: string;
}, options?: DbOptions): Promise<PurchaseAttemptRecord | null> {
  if (!isPurchaseAttemptsDatabaseConfigured()) {
    const found = inMemoryAttempts.get(input.id);
    if (!found) {
      return null;
    }

    if (found.status !== "prepared") {
      return { ...found };
    }

    const updated: PurchaseAttemptRecord = {
      ...found,
      txSignature: input.signature,
      status: "submitted",
      submittedAt: new Date().toISOString(),
      errorCode: null,
      errorMessage: null,
      updatedAt: new Date().toISOString()
    };
    setInMemoryAttempt(updated);
    return { ...updated };
  }

  const run = async (client: PoolClient) => {
    const updated = await queryWithClient<PurchaseAttemptRecord>(
      client,
      `UPDATE purchase_attempts
       SET
         tx_signature = $2,
         status = 'submitted',
         submitted_at = NOW(),
         error_code = NULL,
         error_message = NULL
       WHERE id = $1
         AND status = 'prepared'
       RETURNING ${PURCHASE_ATTEMPT_SELECT_COLUMNS}`,
      [input.id, input.signature]
    );

    if (updated) {
      return updated;
    }

    return getPurchaseAttemptByIdWithClient(client, input.id, false);
  };

  if (options?.client) {
    return run(options.client);
  }

  return withDbClient(run);
}

export async function markPurchaseAttemptFailed(input: {
  id: string;
  errorCode: string;
  errorMessage: string;
}, options?: DbOptions): Promise<PurchaseAttemptRecord | null> {
  if (!isPurchaseAttemptsDatabaseConfigured()) {
    const found = inMemoryAttempts.get(input.id);
    if (!found) {
      return null;
    }

    if (found.status === "confirmed") {
      return { ...found };
    }

    const now = new Date().toISOString();
    const updated: PurchaseAttemptRecord = {
      ...found,
      status: "failed",
      ...buildAssetVerificationFailurePatch(found, input.errorMessage, now),
      errorCode: input.errorCode,
      errorMessage: input.errorMessage,
      updatedAt: now
    };
    setInMemoryAttempt(updated);
    return { ...updated };
  }

  const run = async (client: PoolClient) => {
    const updated = await queryWithClient<PurchaseAttemptRecord>(
      client,
      `UPDATE purchase_attempts
       SET
         status = 'failed',
         ${assetVerificationFailureSetSql("$3")},
         error_code = $2,
         error_message = $3
       WHERE id = $1
         AND status IN ('created', 'prepared', 'submitted', 'failed')
       RETURNING ${PURCHASE_ATTEMPT_SELECT_COLUMNS}`,
      [input.id, input.errorCode, input.errorMessage]
    );

    if (updated) {
      return updated;
    }

    return getPurchaseAttemptByIdWithClient(client, input.id, false);
  };

  if (options?.client) {
    return run(options.client);
  }

  return withDbClient(run);
}

export async function markPurchaseAttemptConfirmed(input: {
  signature: string;
  verifiedAssetAddresses?: string[];
}, options?: DbOptions): Promise<PurchaseAttemptRecord | null> {
  const signature = typeof input.signature === "string" ? input.signature.trim() : "";
  if (!signature) {
    return null;
  }
  const verifiedAssetAddresses = typeof input.verifiedAssetAddresses === "undefined"
    ? null
    : safeNormalizeStringArray(input.verifiedAssetAddresses);

  if (!isPurchaseAttemptsDatabaseConfigured()) {
    const found = await getPurchaseAttemptBySignature({ signature });
    if (!found) {
      return null;
    }

    if (found.status === "failed") {
      return found;
    }

    const updated: PurchaseAttemptRecord = {
      ...found,
      status: "confirmed",
      confirmedAt: found.confirmedAt ?? new Date().toISOString(),
      verifiedAssetAddresses: verifiedAssetAddresses ?? found.verifiedAssetAddresses,
      assetVerificationStatus: verifiedAssetAddresses ? "verified" : found.assetVerificationStatus,
      assetVerificationError: verifiedAssetAddresses ? null : found.assetVerificationError,
      assetVerificationCheckedAt: verifiedAssetAddresses ? new Date().toISOString() : found.assetVerificationCheckedAt,
      errorCode: null,
      errorMessage: null,
      updatedAt: new Date().toISOString()
    };
    setInMemoryAttempt(updated);
    return { ...updated };
  }

  const run = async (client: PoolClient) => {
    const updated = await queryWithClient<PurchaseAttemptRecord>(
      client,
      `UPDATE purchase_attempts
       SET
         status = 'confirmed',
         confirmed_at = COALESCE(confirmed_at, NOW()),
         verified_asset_addresses = COALESCE($2::jsonb, verified_asset_addresses),
         asset_verification_status = CASE
           WHEN $2::jsonb IS NULL THEN asset_verification_status
           ELSE 'verified'
         END,
         asset_verification_error = CASE
           WHEN $2::jsonb IS NULL THEN asset_verification_error
           ELSE NULL
         END,
         asset_verification_checked_at = CASE
           WHEN $2::jsonb IS NULL THEN asset_verification_checked_at
           ELSE NOW()
         END,
         error_code = NULL,
         error_message = NULL
       WHERE tx_signature = $1
         AND status IN ('submitted', 'confirmed')
       RETURNING ${PURCHASE_ATTEMPT_SELECT_COLUMNS}`,
      [signature, verifiedAssetAddresses === null ? null : JSON.stringify(verifiedAssetAddresses)]
    );

    if (updated) {
      return updated;
    }

    return getPurchaseAttemptBySignatureWithClient(
      client,
      {
        signature,
        forUpdate: false
      }
    );
  };

  if (options?.client) {
    return run(options.client);
  }

  return withDbClient(run);
}

export async function markPurchaseAttemptAssetVerificationFailed(input: {
  signature: string;
  errorMessage: string;
}, options?: DbOptions): Promise<PurchaseAttemptRecord | null> {
  const signature = typeof input.signature === "string" ? input.signature.trim() : "";
  if (!signature) {
    return null;
  }

  if (!isPurchaseAttemptsDatabaseConfigured()) {
    const found = await getPurchaseAttemptBySignature({ signature });
    if (!found) {
      return null;
    }

    if (found.status !== "confirmed") {
      return found;
    }

    const now = new Date().toISOString();
    const updated: PurchaseAttemptRecord = {
      ...found,
      ...buildAssetVerificationFailurePatch(found, input.errorMessage, now),
      errorCode: null,
      errorMessage: null,
      updatedAt: now
    };
    setInMemoryAttempt(updated);
    return { ...updated };
  }

  const run = async (client: PoolClient) => {
    const updated = await queryWithClient<PurchaseAttemptRecord>(
      client,
      `UPDATE purchase_attempts
       SET
         ${assetVerificationFailureSetSql("$2")},
         error_code = NULL,
         error_message = NULL
       WHERE tx_signature = $1
         AND status = 'confirmed'
       RETURNING ${PURCHASE_ATTEMPT_SELECT_COLUMNS}`,
      [signature, input.errorMessage]
    );

    if (updated) {
      return updated;
    }

    return getPurchaseAttemptBySignatureWithClient(
      client,
      {
        signature,
        forUpdate: false
      }
    );
  };

  if (options?.client) {
    return run(options.client);
  }

  return withDbClient(run);
}

export async function markPurchaseAttemptFailedBySignature(input: {
  signature: string;
  errorCode: string;
  errorMessage: string;
}, options?: DbOptions): Promise<PurchaseAttemptRecord | null> {
  const signature = typeof input.signature === "string" ? input.signature.trim() : "";
  if (!signature) {
    return null;
  }

  if (!isPurchaseAttemptsDatabaseConfigured()) {
    const found = await getPurchaseAttemptBySignature({ signature });
    if (!found) {
      return null;
    }

    if (found.status === "confirmed") {
      return found;
    }

    const now = new Date().toISOString();
    const updated: PurchaseAttemptRecord = {
      ...found,
      status: "failed",
      ...buildAssetVerificationFailurePatch(found, input.errorMessage, now),
      errorCode: input.errorCode,
      errorMessage: input.errorMessage,
      updatedAt: now
    };
    setInMemoryAttempt(updated);
    return { ...updated };
  }

  const run = async (client: PoolClient) => {
    const updated = await queryWithClient<PurchaseAttemptRecord>(
      client,
      `UPDATE purchase_attempts
       SET
         status = 'failed',
         ${assetVerificationFailureSetSql("$3")},
         error_code = $2,
         error_message = $3
       WHERE tx_signature = $1
         AND status IN ('submitted', 'failed')
       RETURNING ${PURCHASE_ATTEMPT_SELECT_COLUMNS}`,
      [signature, input.errorCode, input.errorMessage]
    );

    if (updated) {
      return updated;
    }

    return getPurchaseAttemptBySignatureWithClient(
      client,
      {
        signature,
        forUpdate: false
      }
    );
  };

  if (options?.client) {
    return run(options.client);
  }

  return withDbClient(run);
}

export async function listPurchaseAttempts(input?: {
  fromIso?: string | null;
  toIso?: string | null;
  status?: PurchaseAttemptStatus | null;
  walletPublicKey?: string | null;
  candyMachineAddress?: string | null;
  limit?: number;
}): Promise<PurchaseAttemptRecord[]> {
  const fromIso = typeof input?.fromIso === "string" ? input.fromIso.trim() : "";
  const toIso = typeof input?.toIso === "string" ? input.toIso.trim() : "";
  const status = input?.status ?? null;
  const walletPublicKey = typeof input?.walletPublicKey === "string" ? input.walletPublicKey.trim() : "";
  const candyMachineAddress = typeof input?.candyMachineAddress === "string" ? input.candyMachineAddress.trim() : "";
  const limit = Number.isInteger(input?.limit) && Number(input?.limit) > 0
    ? Number(input?.limit)
    : 100;

  if (!isPurchaseAttemptsDatabaseConfigured()) {
    let rows = Array.from(inMemoryAttempts.values()).map((item) => ({ ...item }));

    if (fromIso) {
      const fromTime = new Date(fromIso).getTime();
      if (Number.isFinite(fromTime)) {
        rows = rows.filter((item) => new Date(item.createdAt).getTime() >= fromTime);
      }
    }

    if (toIso) {
      const toTime = new Date(toIso).getTime();
      if (Number.isFinite(toTime)) {
        rows = rows.filter((item) => new Date(item.createdAt).getTime() <= toTime);
      }
    }

    if (status) {
      rows = rows.filter((item) => item.status === status);
    }

    if (walletPublicKey) {
      rows = rows.filter((item) => item.walletPublicKey === walletPublicKey);
    }

    if (candyMachineAddress) {
      rows = rows.filter((item) => item.candyMachineAddress === candyMachineAddress);
    }

    rows.sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    return rows.slice(0, limit);
  }

  return withDbClient(async (client) => {
    const whereClauses: string[] = [];
    const values: unknown[] = [];

    if (fromIso) {
      values.push(fromIso);
      whereClauses.push(`created_at >= $${values.length}::timestamptz`);
    }

    if (toIso) {
      values.push(toIso);
      whereClauses.push(`created_at <= $${values.length}::timestamptz`);
    }

    if (status) {
      values.push(status);
      whereClauses.push(`status = $${values.length}`);
    }

    if (walletPublicKey) {
      values.push(walletPublicKey);
      whereClauses.push(`wallet_public_key = $${values.length}`);
    }

    if (candyMachineAddress) {
      values.push(candyMachineAddress);
      whereClauses.push(`candy_machine_address = $${values.length}`);
    }

    values.push(limit);
    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const result = await client.query<PurchaseAttemptRow>(
      `SELECT ${PURCHASE_ATTEMPT_SELECT_COLUMNS}
       FROM purchase_attempts
       ${whereSql}
       ORDER BY created_at DESC
       LIMIT $${values.length}`,
      values
    );

    return result.rows.map((row) => mapRow(row));
  });
}
