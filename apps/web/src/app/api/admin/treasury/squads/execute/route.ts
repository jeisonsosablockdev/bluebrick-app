/**
 * =========================================================================================
 * Layer 2: Application Layer — Squads Execute Vault Transaction Route
 * Route: POST /api/admin/treasury/squads/execute
 *
 * Description:
 * Validates the execution request, compiles an unsigned VersionedTransaction containing
 * the native Squads v4 `vaultTransactionExecute` instruction targeting the CPI to the
 * Notary Program (`update_project_dates` / `initialize_project_config`).
 * =========================================================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  fetchSquadsMultisigState,
  prepareSquadsVaultTransactionExecute,
  SQUADS_DEVNET_MULTISIG_PDA
} from "@/lib/solana-kit/compat/squads-v4-client";

const ExecuteSchema = z.object({
  proposalId: z.string().optional(),
  transactionIndex: z.string().or(z.number()).optional(),
  signerWallet: z.string().min(32, { message: "signerWallet must be a valid Solana public key" })
});

/**
 * POST /api/admin/treasury/squads/execute
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Step 1: Validate payload schema
    const body = await request.json();
    const parsed = ExecuteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_REQUEST_BODY",
          message: "Se requiere una wallet de Solana conectada y un índice de transacción válido."
        },
        { status: 400 }
      );
    }

    const { signerWallet, transactionIndex: rawTxIndex, proposalId } = parsed.data;

    let targetTxIndex: bigint;
    if (rawTxIndex !== undefined && rawTxIndex !== null && !isNaN(Number(rawTxIndex))) {
      targetTxIndex = BigInt(rawTxIndex);
    } else if (proposalId && !isNaN(Number(proposalId))) {
      targetTxIndex = BigInt(proposalId);
    } else {
      const msState = await fetchSquadsMultisigState(SQUADS_DEVNET_MULTISIG_PDA);
      targetTxIndex = msState.transactionIndex;
    }

    // Step 2: Assemble unsigned VersionedTransaction with vaultTransactionExecute
    const prepared = await prepareSquadsVaultTransactionExecute({
      memberWallet: signerWallet,
      transactionIndex: targetTxIndex,
      multisigAddress: SQUADS_DEVNET_MULTISIG_PDA
    });

    return NextResponse.json({
      ok: true,
      data: prepared
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error al preparar la ejecución en Solana Devnet.";
    return NextResponse.json(
      { ok: false, error: "EXECUTE_PREPARATION_FAILED", message },
      { status: 500 }
    );
  }
}
