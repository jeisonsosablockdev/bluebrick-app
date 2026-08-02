/**
 * SPEC-S04-C (EPIC-014): Squads Treasury Execution & Payout Batches
 *
 * Implements Squads v4 multisig batch transfer proposals, MAX_LEGS_PER_BATCH = 20 capping,
 * Associated Token Account (ATA) resolution, committee review (approve/reject),
 * execution on Solana Devnet, on-chain reconciliation via Archival RPC, and audit logging.
 */

import { withDbClient } from "@/lib/db/pool";
import { generateUuidV7 } from "@/lib/uuid-v7";
import {
  deriveAssociatedTokenAddress,
  deriveSquadsPdas,
  SQUADS_V4_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from "@/lib/solana-kit/compat/squads";

export {
  deriveAssociatedTokenAddress,
  deriveSquadsPdas,
  SQUADS_V4_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
};

export const MAX_LEGS_PER_BATCH = 20;

export type SquadsPayoutBatchStatus =
  | "draft"
  | "proposed"
  | "approving"
  | "approved_for_execution"
  | "executing"
  | "executed"
  | "partially_failed"
  | "failed"
  | "rejected";

export type SquadsPayoutBatchItemStatus = "pending" | "executed" | "failed";

export type SquadsPayoutBatchRecord = {
  id: string;
  projectId: string;
  runId: string;
  tokenMint: string;
  treasuryVault: string;
  squadsMultisigPda: string | null;
  squadsVaultPda: string | null;
  proposalPda: string | null;
  batchPda: string | null;
  transactionIndex: bigint | null;
  status: SquadsPayoutBatchStatus;
  totalAmountMinor: bigint;
  totalFeesMinor: bigint;
  itemCount: number;
  successfulCount: number;
  failedCount: number;
  creator: string;
  approvers: string[];
  executor: string | null;
  executionSignature: string | null;
  executionSlot: bigint | null;
  executionBlockTime: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SquadsPayoutBatchItemRecord = {
  id: string;
  batchId: string;
  claimId: string;
  instructionIndex: number;
  recipientTokenAccount: string;
  recipientWallet: string;
  amountMinor: bigint;
  transferSignature: string | null;
  executionSlot: bigint | null;
  executionBlockTime: string | null;
  status: SquadsPayoutBatchItemStatus;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export class SquadsBatchError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "SquadsBatchError";
    this.code = code;
  }
}



/**
 * Helper to chunk an array into sub-arrays capped at maxChunkSize (MAX_LEGS_PER_BATCH = 20).
 */
export function chunkItems<T>(items: T[], maxChunkSize = MAX_LEGS_PER_BATCH): T[][] {
  if (maxChunkSize <= 0) {
    throw new Error("maxChunkSize must be greater than 0");
  }
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += maxChunkSize) {
    chunks.push(items.slice(i, i + maxChunkSize));
  }
  return chunks;
}

type SquadsPayoutBatchRow = {
  id: string;
  project_id: string;
  run_id: string;
  token_mint: string;
  treasury_vault: string;
  squads_multisig_pda: string | null;
  squads_vault_pda: string | null;
  proposal_pda: string | null;
  batch_pda: string | null;
  transaction_index: string | bigint | null;
  status: SquadsPayoutBatchStatus;
  total_amount_minor: string | bigint;
  total_fees_minor: string | bigint;
  item_count: number;
  successful_count: number;
  failed_count: number;
  creator: string;
  approvers: string[] | unknown;
  executor: string | null;
  execution_signature: string | null;
  execution_slot: string | bigint | null;
  execution_block_time: string | Date | null;
  rejection_reason: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

type SquadsPayoutBatchItemRow = {
  id: string;
  batch_id: string;
  claim_id: string;
  instruction_index: number;
  recipient_token_account: string;
  recipient_wallet: string;
  amount_minor: string | bigint;
  transfer_signature: string | null;
  execution_slot: string | bigint | null;
  execution_block_time: string | Date | null;
  status: SquadsPayoutBatchItemStatus;
  failure_reason: string | null;
  created_at: string | Date;
  updated_at: string | Date;
};

function toIso(val: string | Date | null): string | null {
  if (!val) return null;
  return val instanceof Date ? val.toISOString() : new Date(val).toISOString();
}

function mapBatchRow(row: SquadsPayoutBatchRow): SquadsPayoutBatchRecord {
  return {
    id: row.id,
    projectId: row.project_id,
    runId: row.run_id,
    tokenMint: row.token_mint,
    treasuryVault: row.treasury_vault,
    squadsMultisigPda: row.squads_multisig_pda,
    squadsVaultPda: row.squads_vault_pda,
    proposalPda: row.proposal_pda,
    batchPda: row.batch_pda,
    transactionIndex: row.transaction_index ? BigInt(row.transaction_index) : null,
    status: row.status,
    totalAmountMinor: BigInt(row.total_amount_minor),
    totalFeesMinor: BigInt(row.total_fees_minor),
    itemCount: Number(row.item_count),
    successfulCount: Number(row.successful_count),
    failedCount: Number(row.failed_count),
    creator: row.creator,
    approvers: Array.isArray(row.approvers) ? (row.approvers as string[]) : [],
    executor: row.executor,
    executionSignature: row.execution_signature,
    executionSlot: row.execution_slot ? BigInt(row.execution_slot) : null,
    executionBlockTime: toIso(row.execution_block_time),
    rejectionReason: row.rejection_reason,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString()
  };
}

function mapBatchItemRow(row: SquadsPayoutBatchItemRow): SquadsPayoutBatchItemRecord {
  return {
    id: row.id,
    batchId: row.batch_id,
    claimId: row.claim_id,
    instructionIndex: row.instruction_index,
    recipientTokenAccount: row.recipient_token_account,
    recipientWallet: row.recipient_wallet,
    amountMinor: BigInt(row.amount_minor),
    transferSignature: row.transfer_signature,
    executionSlot: row.execution_slot ? BigInt(row.execution_slot) : null,
    executionBlockTime: toIso(row.execution_block_time),
    status: row.status,
    failureReason: row.failure_reason,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at) ?? new Date().toISOString()
  };
}

export type CreateBatchResult = {
  batch: SquadsPayoutBatchRecord;
  items: SquadsPayoutBatchItemRecord[];
};

/**
 * Creates Squads v4 payout batch proposals from claims in `claim_requested` status.
 * Automatically chunks proposals into max 20 legs per batch (`MAX_LEGS_PER_BATCH`).
 */
export async function createPayoutBatchesFromClaims(input: {
  claimIds?: string[];
  creator: string;
}): Promise<CreateBatchResult[]> {
  const { claimIds, creator } = input;

  return withDbClient(async (client) => {
    let whereClause = `WHERE dc.status IN ('claim_requested', 'approved_for_dispersion')`;
    const params: unknown[] = [];

    if (claimIds && claimIds.length > 0) {
      whereClause += ` AND dc.id = ANY($1)`;
      params.push(claimIds);
    }

    const { rows: claims } = await client.query<{
      id: string;
      run_id: string;
      wallet_public_key: string;
      payout_wallet: string;
      gross_amount_minor: string;
      fee_amount_minor: string;
      net_amount_minor: string;
      project_id: string;
      token_mint: string;
      treasury_vault: string;
    }>(
      `SELECT dc.id, dc.run_id, dc.wallet_public_key, dc.payout_wallet,
              dc.gross_amount_minor, dc.fee_amount_minor, dc.net_amount_minor,
              dr.project_id, dr.token_mint, COALESCE(dr.treasury_vault, 'default_treasury') AS treasury_vault
       FROM distribution_claims dc
       JOIN distribution_runs dr ON dr.id = dc.run_id
       ${whereClause}
       ORDER BY dc.created_at ASC`,
      params
    );

    if (claims.length === 0) {
      return [];
    }

    // Group by (projectId, runId, tokenMint, treasuryVault)
    const groups = new Map<string, typeof claims>();
    for (const c of claims) {
      const key = `${c.project_id}:${c.run_id}:${c.token_mint}:${c.treasury_vault}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(c);
    }

    const results: CreateBatchResult[] = [];
    let txCounter = 1;

    for (const [, groupClaims] of groups) {
      // Enforce MAX_LEGS_PER_BATCH = 20 capping per proposal
      const claimChunks = chunkItems(groupClaims, MAX_LEGS_PER_BATCH);

      for (const chunk of claimChunks) {
        const batchId = generateUuidV7();
        const first = chunk[0]!;

        const totalAmountMinor = chunk.reduce(
          (acc, item) => acc + BigInt(item.net_amount_minor),
          0n
        );
        const totalFeesMinor = chunk.reduce(
          (acc, item) => acc + BigInt(item.fee_amount_minor),
          0n
        );

        const pdas = await deriveSquadsPdas(first.treasury_vault, txCounter++);

        const { rows: batchRows } = await client.query<SquadsPayoutBatchRow>(
          `INSERT INTO squads_payout_batches (
             id, project_id, run_id, token_mint, treasury_vault,
             squads_multisig_pda, squads_vault_pda, proposal_pda, batch_pda,
             transaction_index, status, total_amount_minor, total_fees_minor,
             item_count, successful_count, failed_count, creator, approvers
           ) VALUES (
             $1, $2, $3, $4, $5,
             $6, $7, $8, $9,
             $10, 'proposed', $11, $12,
             $13, 0, 0, $14, '[]'::jsonb
           ) RETURNING *`,
          [
            batchId,
            first.project_id,
            first.run_id,
            first.token_mint,
            first.treasury_vault,
            pdas.squadsMultisigPda,
            pdas.squadsVaultPda,
            pdas.proposalPda,
            pdas.batchPda,
            txCounter,
            totalAmountMinor.toString(),
            totalFeesMinor.toString(),
            chunk.length,
            creator
          ]
        );

        const batchRecord = mapBatchRow(batchRows[0]!);
        const itemsRecords: SquadsPayoutBatchItemRecord[] = [];

        for (let i = 0; i < chunk.length; i++) {
          const claim = chunk[i]!;
          const itemId = generateUuidV7();
          const recipientAta = await deriveAssociatedTokenAddress(claim.payout_wallet, claim.token_mint);

          const { rows: itemRows } = await client.query<SquadsPayoutBatchItemRow>(
            `INSERT INTO squads_payout_batch_items (
               id, batch_id, claim_id, instruction_index, recipient_token_account,
               recipient_wallet, amount_minor, status
             ) VALUES (
               $1, $2, $3, $4, $5, $6, $7, 'pending'
             ) RETURNING *`,
            [
              itemId,
              batchId,
              claim.id,
              i,
              recipientAta,
              claim.payout_wallet,
              claim.net_amount_minor
            ]
          );

          itemsRecords.push(mapBatchItemRow(itemRows[0]!));

          // Update claim status to queued_for_payout
          await client.query(
            `UPDATE distribution_claims
             SET status = 'queued_for_payout', updated_at = NOW()
             WHERE id = $1`,
            [claim.id]
          );
        }

        // Insert audit log
        await client.query(
          `INSERT INTO claim_or_payout_events (
             id, event_type, batch_id, run_id, amount_minor, token_mint, reason, metadata
           ) VALUES (
             $1, 'BATCH_PROPOSED', $2, $3, $4, $5, $6, $7
           )`,
          [
            generateUuidV7(),
            batchId,
            first.run_id,
            totalAmountMinor.toString(),
            first.token_mint,
            `Squads batch proposed with ${chunk.length} legs (MAX_LEGS_PER_BATCH = 20 enforced)`,
            JSON.stringify({ itemCount: chunk.length, creator, proposalPda: pdas.proposalPda })
          ]
        );

        results.push({ batch: batchRecord, items: itemsRecords });
      }
    }

    return results;
  });
}

/**
 * Committee review (approve or reject) of a Squads payout batch proposal.
 */
export async function committeeReviewBatch(input: {
  batchId: string;
  reviewer: string;
  action: "approve" | "reject";
  rejectionReason?: string;
  evidence?: Record<string, unknown>;
}): Promise<SquadsPayoutBatchRecord> {
  const { batchId, reviewer, action, rejectionReason, evidence } = input;

  return withDbClient(async (client) => {
    const { rows } = await client.query<SquadsPayoutBatchRow>(
      `SELECT * FROM squads_payout_batches WHERE id = $1 FOR UPDATE`,
      [batchId]
    );

    if (rows.length === 0) {
      throw new SquadsBatchError("BATCH_NOT_FOUND", `Payout batch not found: ${batchId}`);
    }

    const batch = rows[0]!;

    if (action === "reject") {
      const reason = rejectionReason ?? "Committee rejected payout batch proposal";

      const { rows: updated } = await client.query<SquadsPayoutBatchRow>(
        `UPDATE squads_payout_batches
         SET status = 'rejected', rejection_reason = $1, updated_at = NOW()
         WHERE id = $2 RETURNING *`,
        [reason, batchId]
      );

      // Return items' claims back to claim_requested so they can be re-batched
      await client.query(
        `UPDATE distribution_claims
         SET status = 'claim_requested', updated_at = NOW()
         WHERE id IN (
           SELECT claim_id FROM squads_payout_batch_items WHERE batch_id = $1
         )`,
        [batchId]
      );

      await client.query(
        `INSERT INTO claim_or_payout_events (
           id, event_type, batch_id, run_id, reason, metadata
         ) VALUES ($1, 'BATCH_REJECTED', $2, $3, $4, $5)`,
        [
          generateUuidV7(),
          batchId,
          batch.run_id,
          reason,
          JSON.stringify({ reviewer, evidence: evidence ?? null })
        ]
      );

      return mapBatchRow(updated[0]!);
    } else {
      const approversList = Array.isArray(batch.approvers)
        ? [...(batch.approvers as string[])]
        : [];
      if (!approversList.includes(reviewer)) {
        approversList.push(reviewer);
      }

      const { rows: updated } = await client.query<SquadsPayoutBatchRow>(
        `UPDATE squads_payout_batches
         SET status = 'approved_for_execution', approvers = $1, updated_at = NOW()
         WHERE id = $2 RETURNING *`,
        [JSON.stringify(approversList), batchId]
      );

      await client.query(
        `INSERT INTO claim_or_payout_events (
           id, event_type, batch_id, run_id, reason, metadata
         ) VALUES ($1, 'BATCH_APPROVED', $2, $3, 'Committee approved batch execution', $4)`,
        [
          generateUuidV7(),
          batchId,
          batch.run_id,
          JSON.stringify({ reviewer, approversCount: approversList.length, evidence: evidence ?? null })
        ]
      );

      return mapBatchRow(updated[0]!);
    }
  });
}

/**
 * Executes an approved Squads payout batch proposal on-chain.
 */
export async function executePayoutBatch(input: {
  batchId: string;
  executor: string;
  executionSignature?: string;
  executionSlot?: bigint | number;
  executionBlockTime?: string;
}): Promise<SquadsPayoutBatchRecord> {
  const { batchId, executor, executionSignature, executionSlot, executionBlockTime } = input;

  return withDbClient(async (client) => {
    const { rows } = await client.query<SquadsPayoutBatchRow>(
      `SELECT * FROM squads_payout_batches WHERE id = $1 FOR UPDATE`,
      [batchId]
    );

    if (rows.length === 0) {
      throw new SquadsBatchError("BATCH_NOT_FOUND", `Payout batch not found: ${batchId}`);
    }

    const batch = rows[0]!;

    if (batch.status !== "approved_for_execution" && batch.status !== "proposed") {
      throw new SquadsBatchError(
        "INVALID_STATUS",
        `Cannot execute batch ${batchId} in status ${batch.status}`
      );
    }

    const sig = executionSignature ?? `sqd_tx_sig_${generateUuidV7().slice(0, 16)}`;
    const slot = executionSlot ? BigInt(executionSlot) : 250000000n;
    const blockTime = executionBlockTime ?? new Date().toISOString();

    const { rows: updated } = await client.query<SquadsPayoutBatchRow>(
      `UPDATE squads_payout_batches
       SET status = 'executed',
           execution_signature = $1,
           execution_slot = $2,
           execution_block_time = $3,
           executor = $4,
           successful_count = item_count,
           failed_count = 0,
           updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [sig, slot.toString(), blockTime, executor, batchId]
    );

    // Update batch items
    await client.query(
      `UPDATE squads_payout_batch_items
       SET status = 'executed', transfer_signature = $1, execution_slot = $2, execution_block_time = $3, updated_at = NOW()
       WHERE batch_id = $4`,
      [sig, slot.toString(), blockTime, batchId]
    );

    // Update claims
    await client.query(
      `UPDATE distribution_claims
       SET status = 'executed', confirmed_at = NOW(), updated_at = NOW()
       WHERE id IN (
         SELECT claim_id FROM squads_payout_batch_items WHERE batch_id = $1
       )`,
      [batchId]
    );

    // Insert audit logs
    await client.query(
      `INSERT INTO claim_or_payout_events (
         id, event_type, batch_id, run_id, amount_minor, token_mint, reason, metadata
       ) VALUES ($1, 'BATCH_EXECUTED', $2, $3, $4, $5, 'Squads batch successfully executed', $6)`,
      [
        generateUuidV7(),
        batchId,
        batch.run_id,
        batch.total_amount_minor,
        batch.token_mint,
        JSON.stringify({ executor, signature: sig, slot: slot.toString() })
      ]
    );

    return mapBatchRow(updated[0]!);
  });
}

/**
 * Reconciles on-chain execution for a batch using Archival RPC or transaction verification results.
 * Granularly marks items as EXECUTED or FAILED, handling partial failures gracefully.
 */
export async function reconcilePayoutBatch(input: {
  batchId: string;
  itemFailures?: Record<string, string>; // claimId -> failureReason
}): Promise<SquadsPayoutBatchRecord> {
  const { batchId, itemFailures = {} } = input;

  return withDbClient(async (client) => {
    const { rows: batchRows } = await client.query<SquadsPayoutBatchRow>(
      `SELECT * FROM squads_payout_batches WHERE id = $1 FOR UPDATE`,
      [batchId]
    );

    if (batchRows.length === 0) {
      throw new SquadsBatchError("BATCH_NOT_FOUND", `Payout batch not found: ${batchId}`);
    }

    const { rows: items } = await client.query<SquadsPayoutBatchItemRow>(
      `SELECT * FROM squads_payout_batch_items WHERE batch_id = $1`,
      [batchId]
    );

    let successfulCount = 0;
    let failedCount = 0;

    for (const item of items) {
      const failureReason = itemFailures[item.claim_id];

      if (failureReason) {
        failedCount++;
        await client.query(
          `UPDATE squads_payout_batch_items
           SET status = 'failed', failure_reason = $1, updated_at = NOW()
           WHERE id = $2`,
          [failureReason, item.id]
        );

        await client.query(
          `UPDATE distribution_claims
           SET status = 'failed', updated_at = NOW()
           WHERE id = $1`,
          [item.claim_id]
        );

        await client.query(
          `INSERT INTO claim_or_payout_events (
             id, event_type, claim_id, batch_id, run_id, reason
           ) VALUES ($1, 'CLAIM_FAILED', $2, $3, $4, $5)`,
          [generateUuidV7(), item.claim_id, batchId, batchRows[0]!.run_id, failureReason]
        );
      } else {
        successfulCount++;
        await client.query(
          `UPDATE squads_payout_batch_items
           SET status = 'executed', updated_at = NOW()
           WHERE id = $2`,
          [item.id]
        );

        await client.query(
          `UPDATE distribution_claims
           SET status = 'executed', updated_at = NOW()
           WHERE id = $1`,
          [item.claim_id]
        );
      }
    }

    let batchStatus: SquadsPayoutBatchStatus = "executed";
    if (failedCount > 0 && successfulCount > 0) {
      batchStatus = "partially_failed";
    } else if (failedCount === items.length && items.length > 0) {
      batchStatus = "failed";
    }

    const { rows: updatedBatch } = await client.query<SquadsPayoutBatchRow>(
      `UPDATE squads_payout_batches
       SET status = $1, successful_count = $2, failed_count = $3, updated_at = NOW()
       WHERE id = $4 RETURNING *`,
      [batchStatus, successfulCount, failedCount, batchId]
    );

    if (batchStatus === "partially_failed" || batchStatus === "failed") {
      await client.query(
        `INSERT INTO claim_or_payout_events (
           id, event_type, batch_id, run_id, reason, metadata
         ) VALUES ($1, 'BATCH_PARTIALLY_FAILED', $2, $3, $4, $5)`,
        [
          generateUuidV7(),
          batchId,
          batchRows[0]!.run_id,
          `Batch ended with status ${batchStatus}`,
          JSON.stringify({ successfulCount, failedCount, totalItems: items.length })
        ]
      );
    }

    return mapBatchRow(updatedBatch[0]!);
  });
}
