import { NextRequest, NextResponse } from "next/server";

import { getAuthenticatedPublicKeyFromRequest } from "@/lib/auth";
import { listStakeProfileEventsByWallet } from "@/features/staking-distribution/infrastructure/stake-profile-events-repository";

function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "UNAUTHORIZED",
        message: "Wallet authentication is required."
      }
    },
    { status: 401 }
  );
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const walletPublicKey = getAuthenticatedPublicKeyFromRequest(request);
  if (!walletPublicKey) {
    return unauthorizedResponse();
  }

  try {
    const items = await listStakeProfileEventsByWallet(walletPublicKey);

    return NextResponse.json({
      ok: true,
      data: {
        walletPublicKey,
        items
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "STAKE_HISTORY_FETCH_FAILED",
          message: error instanceof Error ? error.message : "Could not load stake history."
        }
      },
      { status: 500 }
    );
  }
}

