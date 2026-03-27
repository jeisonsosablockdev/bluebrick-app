import { randomUUID } from "node:crypto";

import type { PoolClient } from "pg";

import { withDbClient } from "@/lib/db/pool";

export type PurchaseAttemptStatus = "created" | "prepared" | "submitted" | "confirmed" | "failed";

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
}, options?: DbOptions): Promise<PurchaseAttemptRecord | null> {
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
      preparedPriceLamports: input.preparedPriceLamports,
      cacheUpdatedAt: input.cacheUpdatedAt,
      preparedTxMessageBase64: input.preparedTxMessageBase64,
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
         prepared_at = NOW(),
         status = 'prepared',
         error_code = NULL,
         error_message = NULL
       WHERE id = $1
         AND status = 'created'
       RETURNING ${PURCHASE_ATTEMPT_SELECT_COLUMNS}`,
      [input.id, input.preparedPriceLamports, input.cacheUpdatedAt, input.preparedTxMessageBase64]
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

    const updated: PurchaseAttemptRecord = {
      ...found,
      status: "failed",
      errorCode: input.errorCode,
      errorMessage: input.errorMessage,
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
         status = 'failed',
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

    if (found.status === "failed") {
      return found;
    }

    const updated: PurchaseAttemptRecord = {
      ...found,
      status: "confirmed",
      confirmedAt: found.confirmedAt ?? new Date().toISOString(),
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
         error_code = NULL,
         error_message = NULL
       WHERE tx_signature = $1
         AND status IN ('submitted', 'confirmed')
       RETURNING ${PURCHASE_ATTEMPT_SELECT_COLUMNS}`,
      [signature]
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

    const updated: PurchaseAttemptRecord = {
      ...found,
      status: "failed",
      errorCode: input.errorCode,
      errorMessage: input.errorMessage,
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
         status = 'failed',
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
