import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { listStakeAssetsForWallet, StakeFlowError } from "@/lib/stake-service";

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
  const roleResult = getRequestRole(request);
  if (!roleResult.authenticated || !roleResult.pubkey) {
    return unauthorizedResponse();
  }

  try {
    const items = await listStakeAssetsForWallet(roleResult.pubkey);

    return NextResponse.json({
      ok: true,
      data: {
        walletPublicKey: roleResult.pubkey,
        items
      }
    });
  } catch (error) {
    if (error instanceof StakeFlowError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message
          }
        },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "STAKE_ASSETS_FETCH_FAILED",
          message: error instanceof Error ? error.message : "Could not load stake assets."
        }
      },
      { status: 500 }
    );
  }
}

