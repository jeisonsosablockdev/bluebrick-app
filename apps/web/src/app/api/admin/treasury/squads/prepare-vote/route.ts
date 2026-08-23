/**
 * =========================================================================================
 * Layer 2: Application Layer — Squads Prepare Vote Transaction Route
 * Route: POST /api/admin/treasury/squads/prepare-vote
 *
 * Description:
 * Validates the voting request, fetches recent blockhash from Solana Devnet RPC,
 * and compiles an unsigned base64 VersionedTransaction for the connected wallet.
 * =========================================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  fetchSquadsMultisigState,
  prepareSquadsProposalApproveTransaction,
  prepareSquadsVaultTransactionExecute,
  SQUADS_DEVNET_MULTISIG_PDA
} from "@/lib/solana-kit/compat/squads-v4-client";

const PrepareVoteSchema = z.object({
  proposalId: z.string().min(1, { message: "proposalId is required" }),
  signerWallet: z.string().min(32, { message: "signerWallet must be a valid Solana public key" }),
  transactionIndex: z.string().or(z.number()).optional(),
  collectionAddress: z.string().optional(),
  newStartAt: z.string().optional(),
  newEndAt: z.string().optional(),
  action: z.enum(["VOTE", "EXECUTE"]).optional(),
  isExecute: z.boolean().optional()
});

/**
 * POST /api/admin/treasury/squads/prepare-vote
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Step 1: Validate payload schema
    const body = await request.json();
    const parsed = PrepareVoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_REQUEST_BODY",
          message: "Se requiere una wallet de Solana conectada y un ID de propuesta válido."
        },
        { status: 400 }
      );
    }

    const { proposalId, signerWallet, transactionIndex: rawTxIndex, action, isExecute } = parsed.data;

    let targetTxIndex: bigint;
    if (rawTxIndex !== undefined && rawTxIndex !== null && !isNaN(Number(rawTxIndex))) {
      targetTxIndex = BigInt(rawTxIndex);
    } else {
      const msState = await fetchSquadsMultisigState(SQUADS_DEVNET_MULTISIG_PDA);
      targetTxIndex = msState.transactionIndex;
    }

    // Step 2: Prepare unsigned VersionedTransaction
    let prepared;
    if (action === "EXECUTE" || isExecute) {
      prepared = await prepareSquadsVaultTransactionExecute({
        memberWallet: signerWallet,
        transactionIndex: targetTxIndex,
        multisigAddress: SQUADS_DEVNET_MULTISIG_PDA
      });
    } else {
      prepared = await prepareSquadsProposalApproveTransaction({
        memberWallet: signerWallet,
        transactionIndex: targetTxIndex,
        memo: `BRIDS_NOTARY:approve:${proposalId}`
      });
    }

    return NextResponse.json({
      ok: true,
      data: prepared
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al preparar la transacción de votación en Devnet.";
    return NextResponse.json(
      { ok: false, error: "PREPARE_VOTE_FAILED", message },
      { status: 500 }
    );
  }
}
