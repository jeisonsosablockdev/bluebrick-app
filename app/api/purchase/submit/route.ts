import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { assertFinancialAccessByComplianceStatus, ComplianceCaseServiceError } from "@/lib/compliance/case-service";
import { getOrCreateProfileBundle } from "@/lib/compliance/profile-repository";
import { getFlowId, recordPurchaseFlowEvent, withFlowIdHeader } from "@/lib/purchase-flow-trace";
import { PurchaseFlowError, submitPurchase } from "@/lib/purchase-service";

type SubmitBody = {
  attemptId?: unknown;
  idempotencyKey?: unknown;
  signedTransactionBase64?: unknown;
};

function normalizeBody(raw: unknown): { attemptId: string; idempotencyKey: string; signedTransactionBase64: string } {
  if (!raw || typeof raw !== "object") {
    throw new PurchaseFlowError("TRANSACTION_FAILED", "Request body must be an object.", 400);
  }

  const body = raw as SubmitBody;
  if (typeof body.attemptId !== "string" || !body.attemptId.trim()) {
    throw new PurchaseFlowError("TRANSACTION_FAILED", "attemptId is required.", 400);
  }

  if (typeof body.idempotencyKey !== "string" || !body.idempotencyKey.trim()) {
    throw new PurchaseFlowError("TRANSACTION_FAILED", "idempotencyKey is required.", 400);
  }

  if (typeof body.signedTransactionBase64 !== "string" || !body.signedTransactionBase64.trim()) {
    throw new PurchaseFlowError("TRANSACTION_FAILED", "signedTransactionBase64 is required.", 400);
  }

  return {
    attemptId: body.attemptId.trim(),
    idempotencyKey: body.idempotencyKey.trim(),
    signedTransactionBase64: body.signedTransactionBase64.trim()
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const flowId = getFlowId(request.headers.get("x-flow-id"));
  const roleResult = getRequestRole(request);

  if (!roleResult.authenticated || !roleResult.pubkey) {
    await recordPurchaseFlowEvent({
      flowId,
      endpoint: "submit",
      phase: "error",
      statusCode: 401,
      errorCode: "UNAUTHORIZED"
    });

    return withFlowIdHeader(NextResponse.json(
      {
        error: {
          code: "UNAUTHORIZED",
          message: "Wallet authentication is required."
        }
      },
      { status: 401 }
    ), flowId);
  }

  try {
    const profile = await getOrCreateProfileBundle(roleResult.pubkey);
    try {
      assertFinancialAccessByComplianceStatus(profile.complianceStatus);
    } catch (error) {
      if (error instanceof ComplianceCaseServiceError) {
        throw new PurchaseFlowError("COMPLIANCE_RESTRICTED", error.message, error.status, {
          complianceStatus: profile.complianceStatus
        });
      }

      throw error;
    }

    const body = normalizeBody(await request.json().catch(() => null));
    await recordPurchaseFlowEvent({
      flowId,
      endpoint: "submit",
      phase: "request",
      walletPublicKey: roleResult.pubkey,
      attemptId: body.attemptId,
      idempotencyKey: body.idempotencyKey,
      metadata: {
        signedTransactionSize: body.signedTransactionBase64.length
      }
    });

    const submitted = await submitPurchase({
      attemptId: body.attemptId,
      idempotencyKey: body.idempotencyKey,
      buyerPublicKey: roleResult.pubkey,
      signedTransactionBase64: body.signedTransactionBase64
    });

    await recordPurchaseFlowEvent({
      flowId,
      endpoint: "submit",
      phase: "success",
      walletPublicKey: roleResult.pubkey,
      attemptId: submitted.attemptId,
      idempotencyKey: body.idempotencyKey,
      statusCode: 200,
      metadata: {
        txSignature: submitted.txSignature
      }
    });

    return withFlowIdHeader(NextResponse.json({
      ok: true,
      data: submitted
    }), flowId);
  } catch (error) {
    if (error instanceof PurchaseFlowError) {
      await recordPurchaseFlowEvent({
        flowId,
        endpoint: "submit",
        phase: "error",
        walletPublicKey: roleResult.pubkey,
        statusCode: error.status,
        errorCode: error.code,
        metadata: {
          message: error.message
        }
      });

      return withFlowIdHeader(NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
            details: error.details ?? null
          }
        },
        { status: error.status }
      ), flowId);
    }

    const message = error instanceof Error ? error.message : "Could not submit purchase transaction.";
    await recordPurchaseFlowEvent({
      flowId,
      endpoint: "submit",
      phase: "error",
      walletPublicKey: roleResult.pubkey,
      statusCode: 500,
      errorCode: "TRANSACTION_FAILED",
      metadata: {
        message
      }
    });

    return withFlowIdHeader(NextResponse.json(
      {
        error: {
          code: "TRANSACTION_FAILED",
          message
        }
      },
      { status: 500 }
    ), flowId);
  }
}
