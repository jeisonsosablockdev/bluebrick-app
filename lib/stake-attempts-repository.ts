import { randomUUID } from "node:crypto";

import { withDbClient } from "@/lib/db/pool";

export type StakeProductAction = "stake" | "unstake";
export type StakeAttemptStatus = "prepared" | "submitted" | "validated" | "reconcile_pending" | "rejected" | "failed";

export type StakeActionAttemptRecord = {
  id: string;
  idempotencyKey: string;
  walletPublicKey: string;
  assetAddress: string;
  collectionAddress: string;
  candyMachineAddress: string;
  propertyId: string;
  propertyTitle: string;
  productAction: StakeProductAction;
  preparedTxMessageBase64: string;
  txSignature: string | null;
  status: StakeAttemptStatus;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

type StakeActionAttemptRow = {
  id: string;
  idempotency_key: string;
  wallet_public_key: string;
  asset_address: string;
  collection_address: string;
  candy_machine_address: string;
  property_id: string;
  property_title: string;
  product_action: StakeProductAction;
  prepared_tx_message_base64: string;
  tx_signature: string | null;
  status: StakeAttemptStatus;
  error_message: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type CreateStakeActionAttemptInput = {
  idempotencyKey: string;
  walletPublicKey: string;
  assetAddress: string;
  collectionAddress: string;
  candyMachineAddress: string;
  propertyId: string;
  propertyTitle: string;
  productAction: StakeProductAction;
  preparedTxMessageBase64: string;
};

function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

function assertNonEmpty(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
}

function toIso(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return new Date(value).toISOString();
}

function mapRow(row: StakeActionAttemptRow): StakeActionAttemptRecord {
  return {
    id: row.id,
    idempotencyKey: row.idempotency_key,
    walletPublicKey: row.wallet_public_key,
    assetAddress: row.asset_address,
    collectionAddress: row.collection_address,
    candyMachineAddress: row.candy_machine_address,
    propertyId: row.property_id,
    propertyTitle: row.property_title,
    productAction: row.product_action,
    preparedTxMessageBase64: row.prepared_tx_message_base64,
    txSignature: row.tx_signature,
    status: row.status,
    errorMessage: row.error_message,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

const inMemoryAttempts = new Map<string, StakeActionAttemptRecord>();
const inMemoryAttemptsByWallet = new Map<string, StakeActionAttemptRecord[]>();

function saveInMemory(record: StakeActionAttemptRecord): StakeActionAttemptRecord {
  inMemoryAttempts.set(record.id, record);

  const list = inMemoryAttemptsByWallet.get(record.walletPublicKey) ?? [];
  const next = [...list.filter((entry) => entry.id !== record.id), record].sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt)
  );
  inMemoryAttemptsByWallet.set(record.walletPublicKey, next);

  return record;
}

export async function createStakeActionAttempt(input: CreateStakeActionAttemptInput): Promise<StakeActionAttemptRecord> {
  const idempotencyKey = assertNonEmpty(input.idempotencyKey, "idempotencyKey");
  const walletPublicKey = assertNonEmpty(input.walletPublicKey, "walletPublicKey");
  const assetAddress = assertNonEmpty(input.assetAddress, "assetAddress");
  const collectionAddress = assertNonEmpty(input.collectionAddress, "collectionAddress");
  const candyMachineAddress = assertNonEmpty(input.candyMachineAddress, "candyMachineAddress");
  const propertyId = assertNonEmpty(input.propertyId, "propertyId");
  const propertyTitle = assertNonEmpty(input.propertyTitle, "propertyTitle");
  const preparedTxMessageBase64 = assertNonEmpty(input.preparedTxMessageBase64, "preparedTxMessageBase64");

  if (!isDatabaseConfigured()) {
    const now = new Date().toISOString();
    return saveInMemory({
      id: randomUUID(),
      idempotencyKey,
      walletPublicKey,
      assetAddress,
      collectionAddress,
      candyMachineAddress,
      propertyId,
      propertyTitle,
      productAction: input.productAction,
      preparedTxMessageBase64,
      txSignature: null,
      status: "prepared",
      errorMessage: null,
      createdAt: now,
      updatedAt: now
    });
  }

  return withDbClient(async (client) => {
    const result = await client.query<StakeActionAttemptRow>(
      `INSERT INTO stake_action_attempts (
         id,
         idempotency_key,
         wallet_public_key,
         asset_address,
         collection_address,
         candy_machine_address,
         property_id,
         property_title,
         product_action,
         prepared_tx_message_base64,
         status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'prepared')
       RETURNING *`,
      [
        randomUUID(),
        idempotencyKey,
        walletPublicKey,
        assetAddress,
        collectionAddress,
        candyMachineAddress,
        propertyId,
        propertyTitle,
        input.productAction,
        preparedTxMessageBase64
      ]
    );

    return mapRow(result.rows[0] as StakeActionAttemptRow);
  });
}

export async function getStakeActionAttemptById(attemptId: string): Promise<StakeActionAttemptRecord | null> {
  const id = assertNonEmpty(attemptId, "attemptId");

  if (!isDatabaseConfigured()) {
    return inMemoryAttempts.get(id) ?? null;
  }

  return withDbClient(async (client) => {
    const result = await client.query<StakeActionAttemptRow>(
      `SELECT *
       FROM stake_action_attempts
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    if ((result.rowCount ?? 0) === 0) {
      return null;
    }

    return mapRow(result.rows[0] as StakeActionAttemptRow);
  });
}

export async function getStakeActionAttemptBySignature(signature: string): Promise<StakeActionAttemptRecord | null> {
  const txSignature = assertNonEmpty(signature, "signature");

  if (!isDatabaseConfigured()) {
    return Array.from(inMemoryAttempts.values()).find((entry) => entry.txSignature === txSignature) ?? null;
  }

  return withDbClient(async (client) => {
    const result = await client.query<StakeActionAttemptRow>(
      `SELECT *
       FROM stake_action_attempts
       WHERE tx_signature = $1
       LIMIT 1`,
      [txSignature]
    );

    if ((result.rowCount ?? 0) === 0) {
      return null;
    }

    return mapRow(result.rows[0] as StakeActionAttemptRow);
  });
}

export async function listStakeActionAttemptsByWallet(walletPublicKey: string): Promise<StakeActionAttemptRecord[]> {
  const wallet = assertNonEmpty(walletPublicKey, "walletPublicKey");

  if (!isDatabaseConfigured()) {
    return [...(inMemoryAttemptsByWallet.get(wallet) ?? [])];
  }

  return withDbClient(async (client) => {
    const result = await client.query<StakeActionAttemptRow>(
      `SELECT *
       FROM stake_action_attempts
       WHERE wallet_public_key = $1
       ORDER BY updated_at DESC, created_at DESC`,
      [wallet]
    );

    return result.rows.map((row) => mapRow(row));
  });
}

async function updateStakeActionAttempt(
  attemptId: string,
  values: { txSignature?: string | null; status: StakeAttemptStatus; errorMessage?: string | null }
): Promise<StakeActionAttemptRecord | null> {
  const id = assertNonEmpty(attemptId, "attemptId");

  if (!isDatabaseConfigured()) {
    const current = inMemoryAttempts.get(id) ?? null;
    if (!current) {
      return null;
    }

    return saveInMemory({
      ...current,
      txSignature: typeof values.txSignature === "undefined" ? current.txSignature : values.txSignature,
      status: values.status,
      errorMessage: typeof values.errorMessage === "undefined" ? current.errorMessage : values.errorMessage,
      updatedAt: new Date().toISOString()
    });
  }

  return withDbClient(async (client) => {
    const result = await client.query<StakeActionAttemptRow>(
      `UPDATE stake_action_attempts
       SET tx_signature = COALESCE($2, tx_signature),
           status = $3,
           error_message = $4
       WHERE id = $1
       RETURNING *`,
      [id, values.txSignature ?? null, values.status, values.errorMessage ?? null]
    );

    if ((result.rowCount ?? 0) === 0) {
      return null;
    }

    return mapRow(result.rows[0] as StakeActionAttemptRow);
  });
}

export async function markStakeActionAttemptSubmitted(input: {
  attemptId: string;
  txSignature: string;
}): Promise<StakeActionAttemptRecord | null> {
  return updateStakeActionAttempt(input.attemptId, {
    txSignature: assertNonEmpty(input.txSignature, "txSignature"),
    status: "submitted",
    errorMessage: null
  });
}

export async function markStakeActionAttemptFailed(input: {
  attemptId: string;
  errorMessage: string;
}): Promise<StakeActionAttemptRecord | null> {
  return updateStakeActionAttempt(input.attemptId, {
    status: "failed",
    errorMessage: assertNonEmpty(input.errorMessage, "errorMessage")
  });
}

export async function markStakeActionAttemptValidated(input: {
  attemptId: string;
}): Promise<StakeActionAttemptRecord | null> {
  return updateStakeActionAttempt(input.attemptId, {
    status: "validated",
    errorMessage: null
  });
}

export async function markStakeActionAttemptReconcilePending(input: {
  attemptId: string;
  errorMessage?: string | null;
}): Promise<StakeActionAttemptRecord | null> {
  return updateStakeActionAttempt(input.attemptId, {
    status: "reconcile_pending",
    errorMessage: input.errorMessage ?? null
  });
}
