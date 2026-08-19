/**
 * SPEC-S02-C (EPIC-014): Mint Authority Freeze
 *
 * Freezes the Candy Machine mint authority at project start to prevent
 * late minting and retroactive pool dilution.
 *
 * This is an admin-only, irreversible action. Once frozen, no new NFTs
 * can be minted from the Candy Machine — locking the pool denominator
 * for the duration of the project's eligibility window.
 *
 * Business rule: Early investor dilution is the intentional reward mechanism.
 * Freezing mint authority after project start enforces this: investors who
 * minted before the window opened cannot be diluted by late minters.
 */

import { withDbClient } from "@/features/shared/infrastructure/db/pool";

export type MintAuthorityFreezeResult =
  | { status: "already_frozen"; frozenAt: string }
  | { status: "frozen"; frozenAt: string; projectId: string; candyMachineAddress: string }
  | { status: "project_not_found" };

/**
 * Record that mint authority was frozen for a project's Candy Machine.
 *
 * The actual on-chain freeze instruction is submitted by an admin via
 * the Candy Machine admin SDK (core-candy-machine-admin.ts). This function
 * records the timestamp in `project_candy_machine_sources` after confirmation.
 *
 * NOTE: The on-chain tx must be confirmed before calling this function.
 * The caller is responsible for submitting the freeze instruction to Solana
 * and passing the confirmed block time here.
 */
export async function recordMintAuthorityFreeze(input: {
  projectId: string;
  confirmedAt: Date;
}): Promise<MintAuthorityFreezeResult> {
  const { projectId, confirmedAt } = input;

  return withDbClient(async (client) => {
    // Check if already frozen
    const { rows: existing } = await client.query<{
      project_id: string;
      candy_machine_address: string;
      mint_authority_frozen_at: string | Date | null;
    }>(
      `SELECT project_id, candy_machine_address, mint_authority_frozen_at
       FROM project_candy_machine_sources
       WHERE project_id = $1`,
      [projectId]
    );

    if (existing.length === 0) {
      return { status: "project_not_found" };
    }

    const record = existing[0]!;

    if (record.mint_authority_frozen_at !== null) {
      const frozenAt =
        record.mint_authority_frozen_at instanceof Date
          ? record.mint_authority_frozen_at.toISOString()
          : new Date(record.mint_authority_frozen_at).toISOString();

      return { status: "already_frozen", frozenAt };
    }

    // Record the freeze timestamp
    await client.query(
      `UPDATE project_candy_machine_sources
       SET mint_authority_frozen_at = $1, updated_at = NOW()
       WHERE project_id = $2`,
      [confirmedAt, projectId]
    );

    return {
      status: "frozen",
      frozenAt: confirmedAt.toISOString(),
      projectId,
      candyMachineAddress: record.candy_machine_address
    };
  });
}

/**
 * Check whether mint authority is frozen for a project.
 * Returns null if the project does not exist in project_candy_machine_sources.
 */
export async function getMintAuthorityFreezeStatus(
  projectId: string
): Promise<{ isFrozen: boolean; frozenAt: string | null } | null> {
  return withDbClient(async (client) => {
    const { rows } = await client.query<{
      mint_authority_frozen_at: string | Date | null;
    }>(
      `SELECT mint_authority_frozen_at
       FROM project_candy_machine_sources
       WHERE project_id = $1`,
      [projectId]
    );

    if (rows.length === 0) return null;

    const frozenAt = rows[0]!.mint_authority_frozen_at;

    if (!frozenAt) {
      return { isFrozen: false, frozenAt: null };
    }

    return {
      isFrozen: true,
      frozenAt: frozenAt instanceof Date ? frozenAt.toISOString() : new Date(frozenAt).toISOString()
    };
  });
}
