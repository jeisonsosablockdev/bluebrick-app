/**
 * Layer 2: Application / Staking Distribution & Cranker
 * Module: crank-payout-run
 * 
 * =========================================================================================
 * 🏛️ ARCHITECTURAL ROLE & CRANKER PIPELINE
 * =========================================================================================
 * This application module orchestrates the cranking execution for a PayoutRun.
 * It encodes `settle_claim` instructions, prevents double-settlement of existing receipts,
 * and packages claims into execution batches suitable for Solana transaction dispatch.
 * 
 * Invariants:
 * 1. Idempotency: Existing ClaimReceipt PDAs are filtered out before transaction construction.
 * 2. Exact Layout: Matches Anchor on-chain Borsh serialization for Vec<[u8; 32]> proof paths.
 * 3. Separation of Concerns: Delegates progress computations to Layer 3 (Domain).
 * 
 * @spec EPIC-015-SOLUTION-ARCHITECTURE §Settlement Cranker & Payout Run Lifecycle
 * @spec STORY-015-01-SPEC-07
 */

import {
  address,
  getAddressEncoder,
  getProgramDerivedAddress,
  type Address,
} from "@solana/kit";
import {
  TOKEN_PROGRAM_ID,
} from "../../../lib/solana-kit/compat/squads";
import {
  SYSTEM_PROGRAM_ID,
  type AccountMeta,
  type InstructionModel,
} from "../infrastructure/squads-proposals";
import {
  filterUnsettledClaims,
  batchClaimsForCranking,
  type PayoutClaimSummary,
} from "../domain/payout-projection";

/**
 * Anchor 8-byte instruction discriminator for `settle_claim`.
 * Calculated as: `sha256("global:settle_claim")[0..8]`
 * Hex: `50efef1d768605fa`
 */
export const SETTLE_CLAIM_DISCRIMINATOR = new Uint8Array([
  0x50, 0xef, 0xef, 0x1d, 0x76, 0x86, 0x05, 0xfa,
]);

/**
 * Parameters for encoding an individual `settle_claim` instruction.
 */
export interface SettleClaimInstructionParams {
  settlementProgramId: Address | string;
  runId: string;
  claimId: string;
  amountMinor: bigint;
  leafIndex: number;
  merkleProofHex: string[];
  escrowAta: string;
  recipientWallet: string;
  recipientAta: string;
  mint: string;
  payer: string;
}

/**
 * Parameters for planning a full crank execution run.
 */
export interface PlanCrankExecutionParams {
  settlementProgramId: Address | string;
  runId: string;
  mint: string;
  escrowAta: string;
  payer: string;
  claims: PayoutClaimSummary[];
  settledClaimIds: Set<string>;
  batchSize?: number;
}

/**
 * A batch of instructions ready for atomic transaction submission.
 */
export interface CrankBatch {
  batchIndex: number;
  claimIds: string[];
  instructions: InstructionModel[];
}

/**
 * Complete execution plan produced by the crank planner.
 */
export interface CrankExecutionPlan {
  runId: string;
  totalClaims: number;
  settledCount: number;
  pendingCount: number;
  batches: CrankBatch[];
}

/**
 * Encodes the Anchor `settle_claim` instruction.
 * 
 * Step-by-Step Logic:
 * // Step 1: Parse run_id and claim_id into 16-byte buffers.
 * // Step 2: Derive PayoutRun PDA and ClaimReceipt PDA.
 * // Step 3: Parse Merkle proof hex strings into 32-byte byte arrays.
 * // Step 4: Serialize instruction data buffer matching Borsh schema.
 * // Step 5: Assemble account metas matching SettleClaim Anchor context.
 * 
 * @param params - Instruction parameters
 * @returns InstructionModel ready for transaction inclusion
 */
export async function encodeSettleClaimInstruction(
  params: SettleClaimInstructionParams
): Promise<InstructionModel> {
  const {
    settlementProgramId,
    runId,
    claimId,
    amountMinor,
    leafIndex,
    merkleProofHex,
    escrowAta,
    recipientWallet,
    recipientAta,
    mint,
    payer,
  } = params;

  const progAddr = address(settlementProgramId);
  const runIdBytes = Buffer.from(runId.replace(/-/g, ""), "hex");
  const claimIdBytes = Buffer.from(claimId.replace(/-/g, ""), "hex");

  // Step 2: Derive PDAs
  const [payoutRunPda] = await getProgramDerivedAddress({
    programAddress: progAddr,
    seeds: [new TextEncoder().encode("payout_run"), runIdBytes],
  });

  const [claimReceiptPda] = await getProgramDerivedAddress({
    programAddress: progAddr,
    seeds: [
      new TextEncoder().encode("claim_receipt"),
      runIdBytes,
      claimIdBytes,
    ],
  });

  // Step 3: Parse Merkle proof
  const proofNodes = merkleProofHex.map((hex) => Buffer.from(hex, "hex"));

  // Step 4: Serialize data buffer
  // Layout:
  // [8B discriminator]
  // [16B claim_id]
  // [8B amount_minor (u64 LE)]
  // [4B leaf_index (u32 LE)]
  // [4B proof_vec_len (u32 LE)]
  // [... (proof_vec_len * 32B)]
  const dataSize = 8 + 16 + 8 + 4 + 4 + proofNodes.length * 32;
  const data = new Uint8Array(dataSize);
  const view = new DataView(data.buffer);

  data.set(SETTLE_CLAIM_DISCRIMINATOR, 0);
  data.set(claimIdBytes, 8);
  view.setBigUint64(24, amountMinor, true);
  view.setUint32(32, leafIndex, true);
  view.setUint32(36, proofNodes.length, true);

  let offset = 40;
  for (const node of proofNodes) {
    data.set(node, offset);
    offset += 32;
  }

  // Step 5: Assemble account metas
  const accounts: AccountMeta[] = [
    { address: payoutRunPda, isWritable: true, isSigner: false },
    { address: claimReceiptPda, isWritable: true, isSigner: false },
    { address: escrowAta, isWritable: true, isSigner: false },
    { address: recipientWallet, isWritable: false, isSigner: false },
    { address: recipientAta, isWritable: true, isSigner: false },
    { address: mint, isWritable: false, isSigner: false },
    { address: payer, isWritable: true, isSigner: true },
    { address: TOKEN_PROGRAM_ID.toString(), isWritable: false, isSigner: false },
    { address: SYSTEM_PROGRAM_ID.toString(), isWritable: false, isSigner: false },
  ];

  return {
    programAddress: progAddr,
    accounts,
    data,
  };
}

/**
 * Plans the full cranking execution by filtering settled claims and assembling instruction batches.
 * 
 * @param params - Crank parameters
 * @returns Complete CrankExecutionPlan
 */
export async function planCrankExecution(
  params: PlanCrankExecutionParams
): Promise<CrankExecutionPlan> {
  const {
    settlementProgramId,
    runId,
    mint,
    escrowAta,
    payer,
    claims,
    settledClaimIds,
    batchSize = 4,
  } = params;

  // Step 1: Filter unsettled claims
  const unsettled = filterUnsettledClaims(claims, settledClaimIds);
  const totalClaims = claims.length;
  const settledCount = totalClaims - unsettled.length;
  const pendingCount = unsettled.length;

  // Step 2: Batch claims
  const claimBatches = batchClaimsForCranking(unsettled, batchSize);

  // Step 3: Encode instructions for each batch
  const batches: CrankBatch[] = [];
  for (let bIdx = 0; bIdx < claimBatches.length; bIdx++) {
    const batchClaims = claimBatches[bIdx];
    const instructions: InstructionModel[] = [];

    for (const claim of batchClaims) {
      const ix = await encodeSettleClaimInstruction({
        settlementProgramId,
        runId,
        claimId: claim.claimId,
        amountMinor: claim.amountMinor,
        leafIndex: claim.index,
        merkleProofHex: claim.proofHex,
        escrowAta,
        recipientWallet: claim.recipientWallet,
        recipientAta: claim.recipientAta,
        mint,
        payer,
      });
      instructions.push(ix);
    }

    batches.push({
      batchIndex: bIdx,
      claimIds: batchClaims.map((c) => c.claimId),
      instructions,
    });
  }

  return {
    runId,
    totalClaims,
    settledCount,
    pendingCount,
    batches,
  };
}
