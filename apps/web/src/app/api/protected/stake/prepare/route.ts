import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { prepareStakeAction, StakeFlowError } from "@/lib/stake-service";

type PrepareBody = {
  assetAddress?: unknown;
  action?: unknown;
};

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

function normalizeBody(raw: unknown): { assetAddress: string; action: "stake" | "unstake" } {
  if (!raw || typeof raw !== "object") {
    throw new StakeFlowError("INVALID_INPUT", "Request body must be an object.", 400);
  }

  const body = raw as PrepareBody;
  if (typeof body.assetAddress !== "string" || !body.assetAddress.trim()) {
    throw new StakeFlowError("INVALID_INPUT", "assetAddress is required.", 400);
  }

  if (body.action !== "stake" && body.action !== "unstake") {
    throw new StakeFlowError("INVALID_INPUT", "action must be either stake or unstake.", 400);
  }

  return {
    assetAddress: body.assetAddress.trim(),
    action: body.action
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const roleResult = getRequestRole(request);
  if (!roleResult.authenticated || !roleResult.pubkey) {
    return unauthorizedResponse();
  }

  try {
    const body = normalizeBody(await request.json().catch(() => null));
    const prepared = await prepareStakeAction({
      walletPublicKey: roleResult.pubkey,
      assetAddress: body.assetAddress,
      action: body.action
    });

    return NextResponse.json({
      ok: true,
      data: prepared
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
          code: "STAKE_PREPARE_FAILED",
          message: error instanceof Error ? error.message : "Could not prepare stake action."
        }
      },
      { status: 500 }
    );
  }
}

