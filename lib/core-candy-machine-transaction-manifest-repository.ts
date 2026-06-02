import { createHash, randomUUID } from "node:crypto";

import { withDbClient } from "@/lib/db/pool";

export const CORE_CANDY_MACHINE_TRANSACTION_KINDS = [
  "create-collection",
  "create-candy-machine",
  "add-config-lines",
  "mint",
  "add-app-data-plugin",
  "write-app-data",
  "add-owner-freeze-plugin"
] as const;

export type CoreCandyMachineTransactionKind = typeof CORE_CANDY_MACHINE_TRANSACTION_KINDS[number];
export type CoreCandyMachineManifestStatus = "prepared" | "signed" | "submitted" | "confirmed" | "failed";

export type PreparedManifestTransactionInput = {
  txIndex: number;
  txKind: CoreCandyMachineTransactionKind;
  serial: number | null;
  expectedAddress: string | null;
  transactionBase64: string;
};

export type UpsertPreparedManifestInput = {
  flowId: string;
  draftId: string;
  createdBy: string;
  collectionAddress: string;
  candyMachineAddress: string;
  transactions: PreparedManifestTransactionInput[];
};

function assertNonEmpty(value: string, label: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${label} is required.`);
  }

  return trimmed;
}

function assertNonNegativeInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }

  return value;
}

function assertPositiveIntegerOrNull(value: number | null, label: string): number | null {
  if (value === null) {
    return null;
  }

  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer or null.`);
  }

  return value;
}

function assertTransactionKind(value: CoreCandyMachineTransactionKind): CoreCandyMachineTransactionKind {
  if (!CORE_CANDY_MACHINE_TRANSACTION_KINDS.includes(value)) {
    throw new Error("txKind is invalid.");
  }

  return value;
}

function hashTransactionBase64(value: string): string {
  const normalized = assertNonEmpty(value, "transactionBase64");
  return createHash("sha256").update(normalized).digest("hex");
}

export async function upsertCoreCandyMachinePreparedManifest(input: UpsertPreparedManifestInput): Promise<void> {
  const flowId = assertNonEmpty(input.flowId, "flowId");
  const draftId = assertNonEmpty(input.draftId, "draftId");
  const createdBy = assertNonEmpty(input.createdBy, "createdBy");
  const collectionAddress = assertNonEmpty(input.collectionAddress, "collectionAddress");
  const candyMachineAddress = assertNonEmpty(input.candyMachineAddress, "candyMachineAddress");

  if (!Array.isArray(input.transactions) || input.transactions.length === 0) {
    throw new Error("transactions must be a non-empty array.");
  }

  const preparedTransactions = input.transactions.map((transaction) => ({
    txIndex: assertNonNegativeInteger(transaction.txIndex, "txIndex"),
    txKind: assertTransactionKind(transaction.txKind),
    serial: assertPositiveIntegerOrNull(transaction.serial, "serial"),
    expectedAddress: transaction.expectedAddress ? assertNonEmpty(transaction.expectedAddress, "expectedAddress") : null,
    transactionBase64Hash: hashTransactionBase64(transaction.transactionBase64)
  }));

  await withDbClient(async (client) => {
    await client.query("BEGIN");

    try {
      for (const transaction of preparedTransactions) {
        await client.query(
          `INSERT INTO core_candy_machine_transaction_manifest (
             id,
             flow_id,
             draft_id,
             created_by,
             collection_address,
             candy_machine_address,
             tx_index,
             tx_kind,
             serial,
             expected_address,
             transaction_base64_hash,
             status,
             prepared_at
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'prepared', NOW())
           ON CONFLICT (flow_id, tx_index) DO UPDATE
           SET
             draft_id = EXCLUDED.draft_id,
             created_by = EXCLUDED.created_by,
             collection_address = EXCLUDED.collection_address,
             candy_machine_address = EXCLUDED.candy_machine_address,
             tx_kind = EXCLUDED.tx_kind,
             serial = EXCLUDED.serial,
             expected_address = EXCLUDED.expected_address,
             transaction_base64_hash = EXCLUDED.transaction_base64_hash,
             status = 'prepared',
             signature = NULL,
             slot = NULL,
             error_json = NULL,
             signed_transaction_base64_hash = NULL,
             signed_at = NULL,
             submitted_at = NULL,
             confirmed_at = NULL,
             failed_at = NULL,
             prepared_at = NOW(),
             updated_at = NOW()`,
          [
            randomUUID(),
            flowId,
            draftId,
            createdBy,
            collectionAddress,
            candyMachineAddress,
            transaction.txIndex,
            transaction.txKind,
            transaction.serial,
            transaction.expectedAddress,
            transaction.transactionBase64Hash
          ]
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

export async function markCoreCandyMachineTransactionSigned(input: {
  flowId: string;
  txIndex: number;
  signedTransactionBase64: string;
}): Promise<void> {
  const flowId = assertNonEmpty(input.flowId, "flowId");
  const txIndex = assertNonNegativeInteger(input.txIndex, "txIndex");
  const signedHash = hashTransactionBase64(input.signedTransactionBase64);

  await withDbClient(async (client) => {
    await client.query(
      `UPDATE core_candy_machine_transaction_manifest
       SET
         status = 'signed',
         signed_transaction_base64_hash = $3,
         signed_at = NOW(),
         error_json = NULL,
         failed_at = NULL,
         updated_at = NOW()
       WHERE flow_id = $1
         AND tx_index = $2`,
      [flowId, txIndex, signedHash]
    );
  });
}

export async function markCoreCandyMachineTransactionSubmitted(input: {
  flowId: string;
  txIndex: number;
  signature: string;
}): Promise<void> {
  const flowId = assertNonEmpty(input.flowId, "flowId");
  const txIndex = assertNonNegativeInteger(input.txIndex, "txIndex");
  const signature = assertNonEmpty(input.signature, "signature");

  await withDbClient(async (client) => {
    await client.query(
      `UPDATE core_candy_machine_transaction_manifest
       SET
         status = 'submitted',
         signature = $3,
         submitted_at = NOW(),
         error_json = NULL,
         failed_at = NULL,
         updated_at = NOW()
       WHERE flow_id = $1
         AND tx_index = $2`,
      [flowId, txIndex, signature]
    );
  });
}

export async function markCoreCandyMachineTransactionConfirmed(input: {
  signature: string;
  slot: number | null;
}): Promise<void> {
  const signature = assertNonEmpty(input.signature, "signature");
  const slot = input.slot === null ? null : assertNonNegativeInteger(input.slot, "slot");

  await withDbClient(async (client) => {
    await client.query(
      `UPDATE core_candy_machine_transaction_manifest
       SET
         status = 'confirmed',
         slot = $2,
         confirmed_at = NOW(),
         error_json = NULL,
         failed_at = NULL,
         updated_at = NOW()
       WHERE signature = $1`,
      [signature, slot]
    );
  });
}

export async function markCoreCandyMachineTransactionFailed(input: {
  flowId: string;
  txIndex: number;
  error: Record<string, unknown>;
}): Promise<void> {
  const flowId = assertNonEmpty(input.flowId, "flowId");
  const txIndex = assertNonNegativeInteger(input.txIndex, "txIndex");
  const errorJson = JSON.stringify(input.error);

  await withDbClient(async (client) => {
    await client.query(
      `UPDATE core_candy_machine_transaction_manifest
       SET
         status = 'failed',
         error_json = $3::jsonb,
         failed_at = NOW(),
         updated_at = NOW()
       WHERE flow_id = $1
         AND tx_index = $2`,
      [flowId, txIndex, errorJson]
    );
  });
}
