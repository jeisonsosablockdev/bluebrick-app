import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { StakeFlowError, submitStakeAction } from "@/lib/stake-service";

type SubmitBody = {
  attemptId?: unknown;
  idempotencyKey?: unknown;
  signedTransactionBase64?: unknown;
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

function normalizeBody(raw: unknown): {
  attemptId: string;
  idempotencyKey: string;
  signedTransactionBase64: string;
} {
  if (!raw || typeof raw !== "object") {
    throw new StakeFlowError("INVALID_INPUT", "Request body must be an object.", 400);
  }

  const body = raw as SubmitBody;
  if (typeof body.attemptId !== "string" || !body.attemptId.trim()) {
    throw new StakeFlowError("INVALID_INPUT", "attemptId is required.", 400);
  }

  if (typeof body.idempotencyKey !== "string" || !body.idempotencyKey.trim()) {
    throw new StakeFlowError("INVALID_INPUT", "idempotencyKey is required.", 400);
  }

  if (typeof body.signedTransactionBase64 !== "string" || !body.signedTransactionBase64.trim()) {
    throw new StakeFlowError("INVALID_INPUT", "signedTransactionBase64 is required.", 400);
  }

  return {
    attemptId: body.attemptId.trim(),
    idempotencyKey: body.idempotencyKey.trim(),
    signedTransactionBase64: body.signedTransactionBase64.trim()
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const roleResult = getRequestRole(request);
  if (!roleResult.authenticated || !roleResult.pubkey) {
    return unauthorizedResponse();
  }

  try {
    const body = normalizeBody(await request.json().catch(() => null));
    const submitted = await submitStakeAction({
      walletPublicKey: roleResult.pubkey,
      attemptId: body.attemptId,
      idempotencyKey: body.idempotencyKey,
      signedTransactionBase64: body.signedTransactionBase64
    });

    return NextResponse.json({
      ok: true,
      data: submitted
    });
  } catch (error) {
    if (error instanceof StakeFlowError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
            recoverable: error.recoverable
          }
        },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "STAKE_SUBMIT_FAILED",
          message: error instanceof Error ? error.message : "Could not submit stake action."
        }
      },
      { status: 500 }
    );
  }
}
