import "server-only";

import { withDbClient } from "@/lib/db/pool";

export type AdminCollectionValidationState = "linked" | "missing_snapshot" | "inconsistent" | "orphaned";
export type AdminCollectionEditableSection = "summary" | "propertyInformation" | "gallery" | "documents";

export type AdminCollectionReadModel = {
  entryId: string;
  title: string;
  coverImageUrl: string;
  collectionAddress: string;
  candyMachineAddress: string;
  updatedAt: string;
  validationState: AdminCollectionValidationState;
  editableSections: AdminCollectionEditableSection[];
};

type MarketplaceEntryRow = {
  id: string;
  title: string;
  image_url: string;
  collection_address: string;
  asset_mint_address: string;
  updated_at: string | Date;
};

type AssetMintSnapshotRow = {
  id: string;
  collection_address: string;
  candy_machine_address: string;
};

const EDITABLE_SECTIONS: AdminCollectionEditableSection[] = [
  "summary",
  "propertyInformation",
  "gallery",
  "documents"
];

function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
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

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.trim().length > 0)));
}

function indexSnapshots(
  snapshots: AssetMintSnapshotRow[]
): {
  byCollection: Map<string, AssetMintSnapshotRow[]>;
  byCandyMachine: Map<string, AssetMintSnapshotRow[]>;
} {
  const byCollection = new Map<string, AssetMintSnapshotRow[]>();
  const byCandyMachine = new Map<string, AssetMintSnapshotRow[]>();

  for (const snapshot of snapshots) {
    const collectionMatches = byCollection.get(snapshot.collection_address) ?? [];
    collectionMatches.push(snapshot);
    byCollection.set(snapshot.collection_address, collectionMatches);

    const candyMachineMatches = byCandyMachine.get(snapshot.candy_machine_address) ?? [];
    candyMachineMatches.push(snapshot);
    byCandyMachine.set(snapshot.candy_machine_address, candyMachineMatches);
  }

  return { byCollection, byCandyMachine };
}

function classifyValidationState(
  entry: MarketplaceEntryRow,
  snapshotIndex: ReturnType<typeof indexSnapshots>
): AdminCollectionValidationState {
  const collectionMatches = snapshotIndex.byCollection.get(entry.collection_address) ?? [];
  const candyMachineMatches = snapshotIndex.byCandyMachine.get(entry.asset_mint_address) ?? [];
  const candidates = new Map<string, AssetMintSnapshotRow>();

  for (const snapshot of [...collectionMatches, ...candyMachineMatches]) {
    candidates.set(snapshot.id, snapshot);
  }

  if (candidates.size === 0) {
    return "missing_snapshot";
  }

  for (const snapshot of candidates.values()) {
    if (
      snapshot.collection_address === entry.collection_address &&
      snapshot.candy_machine_address === entry.asset_mint_address
    ) {
      return "linked";
    }
  }

  return "inconsistent";
}

export async function listAdminCollectionReadModels(actorPubkey: string): Promise<AdminCollectionReadModel[]> {
  const normalizedActorPubkey = actorPubkey.trim();
  if (!normalizedActorPubkey || !isDatabaseConfigured()) {
    return [];
  }

  try {
    return await withDbClient(async (client) => {
      const entryResult = await client.query<MarketplaceEntryRow>(
        `SELECT
           id,
           title,
           image_url,
           collection_address,
           asset_mint_address,
           updated_at
         FROM marketplace_entries
         WHERE created_by = $1
         ORDER BY updated_at DESC, created_at DESC`,
        [normalizedActorPubkey]
      );

      const entries = entryResult.rows;
      if (entries.length === 0) {
        return [];
      }

      const collectionAddresses = unique(entries.map((entry) => entry.collection_address));
      const candyMachineAddresses = unique(entries.map((entry) => entry.asset_mint_address));

      const snapshotResult = await client.query<AssetMintSnapshotRow>(
        `SELECT
           id,
           collection_address,
           candy_machine_address
         FROM asset_mint_snapshots
         WHERE created_by = $1
           AND (
             collection_address = ANY($2::text[])
             OR candy_machine_address = ANY($3::text[])
           )
         ORDER BY updated_at DESC, created_at DESC`,
        [normalizedActorPubkey, collectionAddresses, candyMachineAddresses]
      );

      const snapshotIndex = indexSnapshots(snapshotResult.rows);

      return entries.map((entry) => {
        const validationState = classifyValidationState(entry, snapshotIndex);

        return {
          entryId: entry.id,
          title: entry.title,
          coverImageUrl: entry.image_url,
          collectionAddress: entry.collection_address,
          candyMachineAddress: entry.asset_mint_address,
          updatedAt: toIsoString(entry.updated_at),
          validationState,
          editableSections: validationState === "linked" ? [...EDITABLE_SECTIONS] : []
        };
      });
    });
  } catch {
    return [];
  }
}
