import { randomUUID } from "crypto";

import type { PoolClient } from "pg";

import { withDbClient } from "@/lib/db/pool";

export type MintJobSnapshotStatus =
  | "queued"
  | "preparing"
  | "signing"
  | "submitting"
  | "confirming"
  | "partial"
  | "completed"
  | "failed";

export type SnapshotVerificationMethod = "das_get_assets_by_group" | "candy_machine_items_loaded";
export type SnapshotVerificationStatus = "verified" | "failed" | "degraded";
export type SnapshotMarketplaceHandoffStatus = "pending" | "ready" | "consumed" | "failed";
export type SnapshotProofKind = "create-collection" | "create-candy-machine" | "add-config-lines" | "mint";
export type SnapshotProofConfirmationStatus = "submitted" | "confirmed" | "failed";

export type UpsertMintJobFromSnapshotInput = {
  emissionId: string;
  idempotencyKey: string;
  status: MintJobSnapshotStatus;
  totalItems: number;
  submittedItems: number;
  confirmedItems: number;
  failedItems: number;
  collectionAddress: string;
  lastError: string | null;
};

export type UpsertAssetMintSnapshotInput = {
  mintJobId: string;
  draftId: string;
  createdBy: string;
  collectionAddress: string;
  candyMachineAddress: string;
  expectedQuantity: number;
  formSnapshot: Record<string, unknown>;
  blockchainSnapshot: Record<string, unknown>;
  verificationMethod: SnapshotVerificationMethod;
  verificationStatus: SnapshotVerificationStatus;
  verificationErrorJson: Record<string, unknown> | null;
  verifiedAt: string | null;
  marketplaceHandoffStatus: SnapshotMarketplaceHandoffStatus;
  proofs: Array<{
    kind: SnapshotProofKind;
    label: string;
    signature: string;
    expectedAddress: string | null;
    confirmationStatus: SnapshotProofConfirmationStatus;
    slot: number | null;
    txError: string | null;
  }>;
};

export type PersistedSnapshotResult = {
  snapshotId: string;
  verificationStatus: SnapshotVerificationStatus;
  marketplaceHandoffStatus: SnapshotMarketplaceHandoffStatus;
};

function assertNonEmpty(value: string, label: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error(`${label} is required.`);
  }

  return trimmed;
}

function assertPositiveInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }

  return value;
}

function assertNonNegativeInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }

  return value;
}

export async function upsertMintJobFromSnapshot(input: UpsertMintJobFromSnapshotInput): Promise<{ id: string; status: MintJobSnapshotStatus }> {
  const emissionId = assertNonEmpty(input.emissionId, "emissionId");
  const idempotencyKey = assertNonEmpty(input.idempotencyKey, "idempotencyKey");
  const collectionAddress = assertNonEmpty(input.collectionAddress, "collectionAddress");
  const totalItems = assertPositiveInteger(input.totalItems, "totalItems");
  const submittedItems = assertNonNegativeInteger(input.submittedItems, "submittedItems");
  const confirmedItems = assertNonNegativeInteger(input.confirmedItems, "confirmedItems");
  const failedItems = assertNonNegativeInteger(input.failedItems, "failedItems");

  return withDbClient(async (client) => {
    const result = await client.query(
      `INSERT INTO mint_jobs (
          id,
          emission_id,
          idempotency_key,
          status,
          total_items,
          prepared_items,
          submitted_items,
          confirmed_items,
          failed_items,
          collection_address,
          last_error
       )
       VALUES ($1, $2, $3, $4, $5, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (emission_id) DO UPDATE
       SET
         status = EXCLUDED.status,
         total_items = EXCLUDED.total_items,
         prepared_items = EXCLUDED.prepared_items,
         submitted_items = EXCLUDED.submitted_items,
         confirmed_items = EXCLUDED.confirmed_items,
         failed_items = EXCLUDED.failed_items,
         collection_address = EXCLUDED.collection_address,
         last_error = EXCLUDED.last_error,
         updated_at = NOW()
       RETURNING id, status`,
      [
        randomUUID(),
        emissionId,
        idempotencyKey,
        input.status,
        totalItems,
        submittedItems,
        confirmedItems,
        failedItems,
        collectionAddress,
        input.lastError
      ]
    );

    const row = result.rows[0] as { id: string; status: MintJobSnapshotStatus };
    return {
      id: row.id,
      status: row.status
    };
  });
}

async function upsertSnapshot(client: PoolClient, input: UpsertAssetMintSnapshotInput): Promise<PersistedSnapshotResult> {
  const result = await client.query(
    `INSERT INTO asset_mint_snapshots (
        id,
        mint_job_id,
        draft_id,
        created_by,
        collection_address,
        candy_machine_address,
        expected_quantity,
        form_snapshot,
        blockchain_snapshot,
        verification_method,
        verification_status,
        verification_error_json,
        verified_at,
        marketplace_handoff_status
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
       $12,
       $13,
       $14
     )
     ON CONFLICT (mint_job_id) DO UPDATE
     SET
       draft_id = EXCLUDED.draft_id,
       created_by = EXCLUDED.created_by,
       collection_address = EXCLUDED.collection_address,
       candy_machine_address = EXCLUDED.candy_machine_address,
       expected_quantity = EXCLUDED.expected_quantity,
       form_snapshot = EXCLUDED.form_snapshot,
       blockchain_snapshot = EXCLUDED.blockchain_snapshot,
       verification_method = EXCLUDED.verification_method,
       verification_status = EXCLUDED.verification_status,
       verification_error_json = EXCLUDED.verification_error_json,
       verified_at = EXCLUDED.verified_at,
       marketplace_handoff_status = EXCLUDED.marketplace_handoff_status,
       updated_at = NOW()
     RETURNING id, verification_status, marketplace_handoff_status`,
    [
      randomUUID(),
      input.mintJobId,
      input.draftId,
      input.createdBy,
      input.collectionAddress,
      input.candyMachineAddress,
      input.expectedQuantity,
      input.formSnapshot,
      input.blockchainSnapshot,
      input.verificationMethod,
      input.verificationStatus,
      input.verificationErrorJson,
      input.verifiedAt,
      input.marketplaceHandoffStatus
    ]
  );

  const row = result.rows[0] as {
    id: string;
    verification_status: SnapshotVerificationStatus;
    marketplace_handoff_status: SnapshotMarketplaceHandoffStatus;
  };

  return {
    snapshotId: row.id,
    verificationStatus: row.verification_status,
    marketplaceHandoffStatus: row.marketplace_handoff_status
  };
}

async function replaceSnapshotProofs(client: PoolClient, snapshotId: string, proofs: UpsertAssetMintSnapshotInput["proofs"]): Promise<void> {
  await client.query("DELETE FROM asset_mint_onchain_proofs WHERE snapshot_id = $1", [snapshotId]);

  for (const proof of proofs) {
    await client.query(
      `INSERT INTO asset_mint_onchain_proofs (
         id,
         snapshot_id,
         tx_kind,
         tx_label,
         tx_signature,
         expected_address,
         confirmation_status,
         slot,
         tx_error
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        randomUUID(),
        snapshotId,
        proof.kind,
        proof.label,
        proof.signature,
        proof.expectedAddress,
        proof.confirmationStatus,
        proof.slot,
        proof.txError
      ]
    );
  }
}

export async function upsertAssetMintSnapshot(input: UpsertAssetMintSnapshotInput): Promise<PersistedSnapshotResult> {
  assertNonEmpty(input.mintJobId, "mintJobId");
  assertNonEmpty(input.draftId, "draftId");
  assertNonEmpty(input.createdBy, "createdBy");
  assertNonEmpty(input.collectionAddress, "collectionAddress");
  assertNonEmpty(input.candyMachineAddress, "candyMachineAddress");
  assertPositiveInteger(input.expectedQuantity, "expectedQuantity");

  for (const proof of input.proofs) {
    assertNonEmpty(proof.label, "proof.label");
    assertNonEmpty(proof.signature, "proof.signature");
  }

  return withDbClient(async (client) => {
    await client.query("BEGIN");

    try {
      const snapshot = await upsertSnapshot(client, input);
      await replaceSnapshotProofs(client, snapshot.snapshotId, input.proofs);
      await client.query("COMMIT");
      return snapshot;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}
