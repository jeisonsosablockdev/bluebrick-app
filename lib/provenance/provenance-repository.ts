/**
 * SPEC-S02-B (EPIC-014): Mint Provenance Repository
 *
 * CRUD operations for:
 * - project_candy_machine_sources
 * - asset_project_origins
 */

import { withDbClient } from "@/lib/db/pool";
import { generateUuidV7 } from "@/lib/uuid-v7";

export type ProvenanceSource = "captured_at_mint" | "parsed_transaction" | "admin_backfill";
export type ProvenanceStatus = "validated" | "needs_review" | "rejected";
export type UnsoldInventoryPolicy = "exclude_unsold" | "include_unsold";

export type ProjectCandyMachineSourceRecord = {
  id: string;
  projectId: string;
  candyMachineAddress: string;
  collectionAddress: string | null;
  authorizedSupply: number | null;
  nftPriceMinor: bigint | null;
  minimumSoldCount: number | null;
  fundingThresholdMinor: bigint | null;
  unsoldInventoryPolicy: UnsoldInventoryPolicy;
  mintAuthorityFrozenAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AssetProjectOriginRecord = {
  id: string;
  assetAddress: string;
  projectId: string;
  collectionAddress: string | null;
  candyMachineAddress: string;
  candyGuardAddress: string | null;
  mintSignature: string | null;
  mintSlot: number | null;
  mintBlockTime: string | null;
  minterWallet: string | null;
  saleEvidence: Record<string, unknown> | null;
  provenanceSource: ProvenanceSource;
  provenanceStatus: ProvenanceStatus;
  createdAt: string;
  updatedAt: string;
};

type ProjectCandyMachineSourceRow = {
  id: string;
  project_id: string;
  candy_machine_address: string;
  collection_address: string | null;
  authorized_supply: number | null;
  nft_price_minor: string | bigint | null;
  minimum_sold_count: number | null;
  funding_threshold_minor: string | bigint | null;
  unsold_inventory_policy: UnsoldInventoryPolicy;
  mint_authority_frozen_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type AssetProjectOriginRow = {
  id: string;
  asset_address: string;
  project_id: string;
  collection_address: string | null;
  candy_machine_address: string;
  candy_guard_address: string | null;
  mint_signature: string | null;
  mint_slot: string | number | null;
  mint_block_time: string | Date | null;
  minter_wallet: string | null;
  sale_evidence: Record<string, unknown> | null;
  provenance_source: ProvenanceSource;
  provenance_status: ProvenanceStatus;
  created_at: string | Date;
  updated_at: string | Date;
};

function toIso(value: string | Date | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapPcmSourceRow(row: ProjectCandyMachineSourceRow): ProjectCandyMachineSourceRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    candyMachineAddress: row.candy_machine_address,
    collectionAddress: row.collection_address,
    authorizedSupply: row.authorized_supply,
    nftPriceMinor: row.nft_price_minor !== null ? BigInt(row.nft_price_minor) : null,
    minimumSoldCount: row.minimum_sold_count,
    fundingThresholdMinor:
      row.funding_threshold_minor !== null ? BigInt(row.funding_threshold_minor) : null,
    unsoldInventoryPolicy: row.unsold_inventory_policy,
    mintAuthorityFrozenAt: toIso(row.mint_authority_frozen_at),
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString()
  };
}

function mapOriginRow(row: AssetProjectOriginRow): AssetProjectOriginRecord {
  return {
    id: row.id,
    assetAddress: row.asset_address,
    projectId: row.project_id,
    collectionAddress: row.collection_address,
    candyMachineAddress: row.candy_machine_address,
    candyGuardAddress: row.candy_guard_address,
    mintSignature: row.mint_signature,
    mintSlot: row.mint_slot !== null ? Number(row.mint_slot) : null,
    mintBlockTime: toIso(row.mint_block_time),
    minterWallet: row.minter_wallet,
    saleEvidence: row.sale_evidence,
    provenanceSource: row.provenance_source,
    provenanceStatus: row.provenance_status,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString()
  };
}

/**
 * Upsert Candy Machine Source mapping for a project.
 */
export async function upsertProjectCandyMachineSource(input: {
  projectId: string;
  candyMachineAddress: string;
  collectionAddress?: string | null;
  authorizedSupply?: number | null;
  nftPriceMinor?: bigint | null;
  minimumSoldCount?: number | null;
  fundingThresholdMinor?: bigint | null;
  unsoldInventoryPolicy?: UnsoldInventoryPolicy;
}): Promise<ProjectCandyMachineSourceRecord> {
  return withDbClient(async (client) => {
    const id = generateUuidV7();
    const { rows } = await client.query<ProjectCandyMachineSourceRow>(
      `INSERT INTO project_candy_machine_sources (
         id, project_id, candy_machine_address, collection_address,
         authorized_supply, nft_price_minor, minimum_sold_count,
         funding_threshold_minor, unsold_inventory_policy
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, COALESCE($9, 'exclude_unsold'))
       ON CONFLICT (project_id) DO UPDATE SET
         candy_machine_address   = EXCLUDED.candy_machine_address,
         collection_address      = COALESCE(EXCLUDED.collection_address, project_candy_machine_sources.collection_address),
         authorized_supply       = COALESCE(EXCLUDED.authorized_supply, project_candy_machine_sources.authorized_supply),
         nft_price_minor         = COALESCE(EXCLUDED.nft_price_minor, project_candy_machine_sources.nft_price_minor),
         minimum_sold_count      = COALESCE(EXCLUDED.minimum_sold_count, project_candy_machine_sources.minimum_sold_count),
         funding_threshold_minor = COALESCE(EXCLUDED.funding_threshold_minor, project_candy_machine_sources.funding_threshold_minor),
         unsold_inventory_policy = COALESCE(EXCLUDED.unsold_inventory_policy, project_candy_machine_sources.unsold_inventory_policy),
         updated_at              = NOW()
       RETURNING *`,
      [
        id,
        input.projectId,
        input.candyMachineAddress,
        input.collectionAddress ?? null,
        input.authorizedSupply ?? null,
        input.nftPriceMinor ? input.nftPriceMinor.toString() : null,
        input.minimumSoldCount ?? null,
        input.fundingThresholdMinor ? input.fundingThresholdMinor.toString() : null,
        input.unsoldInventoryPolicy ?? null
      ]
    );

    return mapPcmSourceRow(rows[0]!);
  });
}

/**
 * Get Candy Machine source by project_id.
 */
export async function getProjectCandyMachineSource(
  projectId: string
): Promise<ProjectCandyMachineSourceRecord | null> {
  return withDbClient(async (client) => {
    const { rows } = await client.query<ProjectCandyMachineSourceRow>(
      `SELECT * FROM project_candy_machine_sources WHERE project_id = $1`,
      [projectId]
    );
    return rows[0] ? mapPcmSourceRow(rows[0]) : null;
  });
}

/**
 * Upsert an Asset Project Origin record.
 */
export async function upsertAssetProjectOrigin(input: {
  assetAddress: string;
  projectId: string;
  collectionAddress?: string | null;
  candyMachineAddress: string;
  candyGuardAddress?: string | null;
  mintSignature?: string | null;
  mintSlot?: number | null;
  mintBlockTime?: string | null;
  minterWallet?: string | null;
  saleEvidence?: Record<string, unknown> | null;
  provenanceSource: ProvenanceSource;
  provenanceStatus: ProvenanceStatus;
}): Promise<AssetProjectOriginRecord> {
  return withDbClient(async (client) => {
    const id = generateUuidV7();
    const { rows } = await client.query<AssetProjectOriginRow>(
      `INSERT INTO asset_project_origins (
         id, asset_address, project_id, collection_address,
         candy_machine_address, candy_guard_address, mint_signature,
         mint_slot, mint_block_time, minter_wallet, sale_evidence,
         provenance_source, provenance_status
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (asset_address) DO UPDATE SET
         project_id            = EXCLUDED.project_id,
         collection_address    = COALESCE(EXCLUDED.collection_address, asset_project_origins.collection_address),
         candy_machine_address = EXCLUDED.candy_machine_address,
         candy_guard_address   = COALESCE(EXCLUDED.candy_guard_address, asset_project_origins.candy_guard_address),
         mint_signature        = COALESCE(EXCLUDED.mint_signature, asset_project_origins.mint_signature),
         mint_slot             = COALESCE(EXCLUDED.mint_slot, asset_project_origins.mint_slot),
         mint_block_time       = COALESCE(EXCLUDED.mint_block_time, asset_project_origins.mint_block_time),
         minter_wallet         = COALESCE(EXCLUDED.minter_wallet, asset_project_origins.minter_wallet),
         sale_evidence         = COALESCE(EXCLUDED.sale_evidence, asset_project_origins.sale_evidence),
         provenance_source     = EXCLUDED.provenance_source,
         provenance_status     = EXCLUDED.provenance_status,
         updated_at            = NOW()
       RETURNING *`,
      [
        id,
        input.assetAddress,
        input.projectId,
        input.collectionAddress ?? null,
        input.candyMachineAddress,
        input.candyGuardAddress ?? null,
        input.mintSignature ?? null,
        input.mintSlot ?? null,
        input.mintBlockTime ?? null,
        input.minterWallet ?? null,
        input.saleEvidence ? JSON.stringify(input.saleEvidence) : null,
        input.provenanceSource,
        input.provenanceStatus
      ]
    );

    return mapOriginRow(rows[0]!);
  });
}

/**
 * Get asset origin by asset address.
 */
export async function getAssetProjectOrigin(
  assetAddress: string
): Promise<AssetProjectOriginRecord | null> {
  return withDbClient(async (client) => {
    const { rows } = await client.query<AssetProjectOriginRow>(
      `SELECT * FROM asset_project_origins WHERE asset_address = $1`,
      [assetAddress]
    );
    return rows[0] ? mapOriginRow(rows[0]) : null;
  });
}

/**
 * List all validated asset origins for a project.
 */
export async function listValidatedOriginsByProject(
  projectId: string
): Promise<AssetProjectOriginRecord[]> {
  return withDbClient(async (client) => {
    const { rows } = await client.query<AssetProjectOriginRow>(
      `SELECT * FROM asset_project_origins
       WHERE project_id = $1 AND provenance_status = 'validated'
       ORDER BY mint_slot ASC NULLS LAST, created_at ASC`,
      [projectId]
    );
    return rows.map(mapOriginRow);
  });
}

/**
 * Transition provenance status (e.g. admin review from needs_review to validated).
 */
export async function updateProvenanceStatus(
  assetAddress: string,
  status: ProvenanceStatus
): Promise<AssetProjectOriginRecord | null> {
  return withDbClient(async (client) => {
    const { rows } = await client.query<AssetProjectOriginRow>(
      `UPDATE asset_project_origins
       SET provenance_status = $1, updated_at = NOW()
       WHERE asset_address = $2
       RETURNING *`,
      [status, assetAddress]
    );
    return rows[0] ? mapOriginRow(rows[0]) : null;
  });
}
