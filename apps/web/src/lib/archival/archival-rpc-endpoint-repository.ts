/**
 * SPEC-S02-C (EPIC-014): Archival RPC Endpoint Repository
 *
 * CRUD for the archival_rpc_endpoints table.
 * Sealed to only permit helius-archive and alchemy-archive.
 */

import { withDbClient } from "@/features/shared/infrastructure/db/pool";
import { generateUuidV7 } from "@/lib/uuid-v7";
import type { ArchivalEndpointName } from "@/lib/archival/archival-rpc-client";

export type ArchivalRpcEndpointRecord = {
  id: string;
  name: ArchivalEndpointName;
  url: string;
  provider: "helius" | "alchemy";
  isPrimary: boolean;
  isActive: boolean;
  minLedgerSlot: number | null;
  lastCheckedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ArchivalRpcEndpointRow = {
  id: string;
  name: string;
  url: string;
  provider: string;
  is_primary: boolean;
  is_active: boolean;
  min_ledger_slot: string | number | null;
  last_checked_at: string | Date | null;
  created_at: string | Date;
  updated_at: string | Date;
};

function toIso(value: string | Date | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapRow(row: ArchivalRpcEndpointRow): ArchivalRpcEndpointRecord {
  return {
    id: row.id,
    name: row.name as ArchivalEndpointName,
    url: row.url,
    provider: row.provider as "helius" | "alchemy",
    isPrimary: row.is_primary,
    isActive: row.is_active,
    minLedgerSlot:
      row.min_ledger_slot !== null && row.min_ledger_slot !== undefined
        ? Number(row.min_ledger_slot)
        : null,
    lastCheckedAt: toIso(row.last_checked_at),
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString()
  };
}

/**
 * List all active archival endpoints, ordered primary first.
 */
export async function listActiveArchivalEndpoints(): Promise<ArchivalRpcEndpointRecord[]> {
  return withDbClient(async (client) => {
    const { rows } = await client.query<ArchivalRpcEndpointRow>(
      `SELECT * FROM archival_rpc_endpoints
       WHERE is_active = true
       ORDER BY is_primary DESC, name ASC`
    );
    return rows.map(mapRow);
  });
}

/**
 * Get a single endpoint by canonical name.
 */
export async function getArchivalEndpointByName(
  name: ArchivalEndpointName
): Promise<ArchivalRpcEndpointRecord | null> {
  return withDbClient(async (client) => {
    const { rows } = await client.query<ArchivalRpcEndpointRow>(
      `SELECT * FROM archival_rpc_endpoints WHERE name = $1`,
      [name]
    );
    return rows[0] ? mapRow(rows[0]) : null;
  });
}

type UpsertArchivalEndpointInput = {
  name: ArchivalEndpointName;
  url: string;
  provider: "helius" | "alchemy";
  isPrimary: boolean;
  isActive?: boolean;
};

/**
 * Upsert an archival endpoint by name.
 * Used during initial provisioning and URL rotation.
 */
export async function upsertArchivalEndpoint(
  input: UpsertArchivalEndpointInput
): Promise<ArchivalRpcEndpointRecord> {
  return withDbClient(async (client) => {
    const id = generateUuidV7();
    const { rows } = await client.query<ArchivalRpcEndpointRow>(
      `INSERT INTO archival_rpc_endpoints (id, name, url, provider, is_primary, is_active)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (name) DO UPDATE SET
         url         = EXCLUDED.url,
         provider    = EXCLUDED.provider,
         is_primary  = EXCLUDED.is_primary,
         is_active   = EXCLUDED.is_active,
         updated_at  = NOW()
       RETURNING *`,
      [id, input.name, input.url, input.provider, input.isPrimary, input.isActive ?? true]
    );

    const row = rows[0];
    if (!row) throw new Error("Upsert returned no row.");
    return mapRow(row);
  });
}

type UpdateHealthInput = {
  name: ArchivalEndpointName;
  minLedgerSlot: number | null;
  lastCheckedAt: Date;
};

/**
 * Update the cached health fields after a health check.
 */
export async function updateArchivalEndpointHealth(
  input: UpdateHealthInput
): Promise<void> {
  await withDbClient(async (client) => {
    await client.query(
      `UPDATE archival_rpc_endpoints
       SET min_ledger_slot = $1, last_checked_at = $2
       WHERE name = $3`,
      [input.minLedgerSlot, input.lastCheckedAt, input.name]
    );
  });
}
