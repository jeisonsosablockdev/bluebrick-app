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

import { prepareSquadsVoteTransaction } from "@/lib/solana-kit/compat/squads-vote-transaction";

const PrepareVoteSchema = z.object({
  proposalId: z.string().min(1, { message: "proposalId is required" }),
  signerWallet: z.string().min(32, { message: "signerWallet must be a valid Solana public key" }),
  collectionAddress: z.string().optional()
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

    const { proposalId, signerWallet, collectionAddress } = parsed.data;

    // Step 2: Prepare unsigned VersionedTransaction
    const prepared = await prepareSquadsVoteTransaction(signerWallet, proposalId, collectionAddress);

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
