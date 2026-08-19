import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { assertFinancialAccessByComplianceStatus, ComplianceCaseServiceError } from "@/features/profile/application/case-service";
import { getOrCreateProfileBundle } from "@/features/profile/infrastructure/profile-repository";
import { getFlowId, recordPurchaseFlowEvent, withFlowIdHeader } from "@/features/checkout-payment/application/purchase-flow-trace";
import { issuePurchaseChallengeForProperty, PurchaseFlowError } from "@/features/checkout-payment/application/purchase-service";

type ChallengeBody = {
  propertyId?: unknown;
  quantity?: unknown;
};

function normalizeBody(raw: unknown): { propertyId: string; quantity: number } {
  if (!raw || typeof raw !== "object") {
    throw new PurchaseFlowError("TRANSACTION_FAILED", "Request body must be an object.", 400);
  }

  const body = raw as ChallengeBody;
  if (typeof body.propertyId !== "string" || !body.propertyId.trim()) {
    throw new PurchaseFlowError("TRANSACTION_FAILED", "propertyId is required.", 400);
  }

  const parsedQuantity = typeof body.quantity === "undefined" ? 1 : Number(body.quantity);
  if (!Number.isFinite(parsedQuantity) || !Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
    throw new PurchaseFlowError("INVALID_QUANTITY", "quantity must be a positive integer.", 400, {
      requestedQuantity: body.quantity ?? null,
      quantityMode: "SINGLE_ONLY"
    });
  }

  const quantity = parsedQuantity;

  return {
    propertyId: body.propertyId.trim(),
    quantity
  };
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) {
      return firstIp;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  return "unknown";
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const flowId = getFlowId(request.headers.get("x-flow-id"));
  const roleResult = getRequestRole(request);

  if (!roleResult.authenticated || !roleResult.pubkey) {
    await recordPurchaseFlowEvent({
      flowId,
      endpoint: "challenge",
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
      endpoint: "challenge",
      phase: "request",
      walletPublicKey: roleResult.pubkey,
      propertyId: body.propertyId,
      metadata: {
        quantity: body.quantity
      }
    });

    const challenge = await issuePurchaseChallengeForProperty({
      propertyId: body.propertyId,
      buyerPublicKey: roleResult.pubkey,
      quantity: body.quantity,
      clientIp: getClientIp(request)
    });

    await recordPurchaseFlowEvent({
      flowId,
      endpoint: "challenge",
      phase: "success",
      walletPublicKey: roleResult.pubkey,
      propertyId: body.propertyId,
      statusCode: 200,
      metadata: {
        challengeId: challenge.challengeId,
        expiresAt: challenge.expiresAt
      }
    });

    return withFlowIdHeader(NextResponse.json({
      ok: true,
      data: challenge
    }), flowId);
  } catch (error) {
    if (error instanceof PurchaseFlowError) {
      await recordPurchaseFlowEvent({
        flowId,
        endpoint: "challenge",
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

    const message = error instanceof Error ? error.message : "Could not issue purchase challenge.";
    await recordPurchaseFlowEvent({
      flowId,
      endpoint: "challenge",
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
