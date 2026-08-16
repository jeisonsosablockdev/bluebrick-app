import "server-only";

import { withDbClient } from "@/features/shared/infrastructure/db/pool";

export type AdminCollectionOwnershipErrorCode =
  | "INVALID_COLLECTION_OWNERSHIP_INPUT"
  | "COLLECTION_NOT_FOUND"
  | "COLLECTION_OWNERSHIP_MISMATCH";

export type AdminCollectionOwnership = {
  entryId: string;
  adminId: string;
  title: string;
  coverImageUrl: string;
  collectionAddress: string;
  candyMachineAddress: string;
  snapshotId: string;
  snapshotDraftId: string;
  snapshotVerificationStatus: string;
  snapshotMarketplaceHandoffStatus: string;
  updatedAt: string;
};

type MarketplaceEntryOwnershipRow = {
  id: string;
  title: string;
  created_by: string;
  image_url: string;
  collection_address: string;
  asset_mint_address: string;
  updated_at: string | Date;
};

type AssetMintSnapshotOwnershipRow = {
  id: string;
  draft_id: string;
  verification_status: string;
  marketplace_handoff_status: string;
};

export class AdminCollectionOwnershipError extends Error {
  readonly code: AdminCollectionOwnershipErrorCode;
  readonly status: number;

  constructor(code: AdminCollectionOwnershipErrorCode, message: string, status: number) {
    super(message);
    this.name = "AdminCollectionOwnershipError";
    this.code = code;
    this.status = status;
  }
}

export function isAdminCollectionOwnershipError(error: unknown): error is AdminCollectionOwnershipError {
  return error instanceof AdminCollectionOwnershipError;
}

function toIsoString(value: string | Date): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(0).toISOString();
  }

  return parsed.toISOString();
}

function assertNonEmpty(value: string, label: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new AdminCollectionOwnershipError(
      "INVALID_COLLECTION_OWNERSHIP_INPUT",
      `${label} is required.`,
      400
    );
  }

  return trimmed;
}

function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export async function assertAdminCollectionOwnership(
  adminId: string,
  collectionId: string
): Promise<AdminCollectionOwnership> {
  const normalizedAdminId = assertNonEmpty(adminId, "adminId");
  const normalizedCollectionId = assertNonEmpty(collectionId, "collectionId");

  if (!isDatabaseConfigured()) {
    throw new AdminCollectionOwnershipError(
      "COLLECTION_NOT_FOUND",
      "Collection was not found.",
      404
    );
  }

  return withDbClient(async (client) => {
    const entryResult = await client.query<MarketplaceEntryOwnershipRow>(
      `SELECT
         id,
         title,
         created_by,
         image_url,
         collection_address,
         asset_mint_address,
         updated_at
       FROM marketplace_entries
       WHERE id = $1
       LIMIT 1`,
      [normalizedCollectionId]
    );

    const entry = entryResult.rows[0] ?? null;
    if (!entry) {
      throw new AdminCollectionOwnershipError(
        "COLLECTION_NOT_FOUND",
        "Collection was not found.",
        404
      );
    }

    if (entry.created_by !== normalizedAdminId) {
      throw new AdminCollectionOwnershipError(
        "COLLECTION_OWNERSHIP_MISMATCH",
        "Collection does not belong to the authenticated admin.",
        403
      );
    }

    const snapshotResult = await client.query<AssetMintSnapshotOwnershipRow>(
      `SELECT
         id,
         draft_id,
         verification_status,
         marketplace_handoff_status
       FROM asset_mint_snapshots
       WHERE created_by = $1
         AND collection_address = $2
         AND candy_machine_address = $3
       ORDER BY updated_at DESC, created_at DESC
       LIMIT 1`,
      [normalizedAdminId, entry.collection_address, entry.asset_mint_address]
    );

    const snapshot = snapshotResult.rows[0] ?? null;
    if (!snapshot) {
      throw new AdminCollectionOwnershipError(
        "COLLECTION_OWNERSHIP_MISMATCH",
        "Collection snapshot evidence is missing or does not belong to the authenticated admin.",
        403
      );
    }

    return {
      entryId: entry.id,
      adminId: normalizedAdminId,
      title: entry.title,
      coverImageUrl: entry.image_url,
      collectionAddress: entry.collection_address,
      candyMachineAddress: entry.asset_mint_address,
      snapshotId: snapshot.id,
      snapshotDraftId: snapshot.draft_id,
      snapshotVerificationStatus: snapshot.verification_status,
      snapshotMarketplaceHandoffStatus: snapshot.marketplace_handoff_status,
      updatedAt: toIsoString(entry.updated_at)
    };
  });
}
