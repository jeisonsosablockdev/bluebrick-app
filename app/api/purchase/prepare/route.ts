import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { assertFinancialAccessByComplianceStatus, ComplianceCaseServiceError } from "@/features/profile/application/case-service";
import { getOrCreateProfileBundle } from "@/features/profile/infrastructure/profile-repository";
import { getFlowId, recordPurchaseFlowEvent, withFlowIdHeader } from "@/features/checkout-payment/application/purchase-flow-trace";
import { preparePurchase, PurchaseFlowError } from "@/features/checkout-payment/application/purchase-service";

type PrepareBody = {
  propertyId?: unknown;
  quantity?: unknown;
  quotedPriceLamports?: unknown;
  quotedPriceUsdcAtomic?: unknown;
  challengeId?: unknown;
  challengeSignatureBase64?: unknown;
};

function normalizeBody(raw: unknown): {
  propertyId: string;
  quantity: number;
  quotedPriceLamports?: number;
  quotedPriceUsdcAtomic?: number;
  challengeId: string;
  challengeSignatureBase64: string;
} {
  if (!raw || typeof raw !== "object") {
    throw new PurchaseFlowError("TRANSACTION_FAILED", "Request body must be an object.", 400);
  }

  const body = raw as PrepareBody;
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

  let quotedPriceLamports: number | undefined;
  if (typeof body.quotedPriceLamports !== "undefined") {
    const parsed = Number(body.quotedPriceLamports);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new PurchaseFlowError("TRANSACTION_FAILED", "quotedPriceLamports must be a non-negative number.", 400);
    }

    quotedPriceLamports = Math.floor(parsed);
  }

  let quotedPriceUsdcAtomic: number | undefined;
  if (typeof body.quotedPriceUsdcAtomic !== "undefined") {
    const parsed = Number(body.quotedPriceUsdcAtomic);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 0) {
      throw new PurchaseFlowError("TRANSACTION_FAILED", "quotedPriceUsdcAtomic must be a non-negative integer.", 400);
    }

    quotedPriceUsdcAtomic = parsed;
  }

  if (typeof body.challengeId !== "string" || !body.challengeId.trim()) {
    throw new PurchaseFlowError("INVALID_CHALLENGE", "challengeId is required.", 400);
  }

  if (typeof body.challengeSignatureBase64 !== "string" || !body.challengeSignatureBase64.trim()) {
    throw new PurchaseFlowError("INVALID_CHALLENGE", "challengeSignatureBase64 is required.", 400);
  }

  return {
    propertyId: body.propertyId.trim(),
    quantity,
    quotedPriceLamports,
    quotedPriceUsdcAtomic,
    challengeId: body.challengeId.trim(),
    challengeSignatureBase64: body.challengeSignatureBase64.trim()
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
      endpoint: "prepare",
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
      endpoint: "prepare",
      phase: "request",
      walletPublicKey: roleResult.pubkey,
      propertyId: body.propertyId,
      metadata: {
        quantity: body.quantity,
        quotedPriceLamports: body.quotedPriceLamports ?? null,
        quotedPriceUsdcAtomic: body.quotedPriceUsdcAtomic ?? null,
        challengeId: body.challengeId
      }
    });

    const prepared = await preparePurchase({
      propertyId: body.propertyId,
      buyerPublicKey: roleResult.pubkey,
      quantity: body.quantity,
      quotedPriceLamports: body.quotedPriceLamports,
      quotedPriceUsdcAtomic: body.quotedPriceUsdcAtomic,
      challengeId: body.challengeId,
      challengeSignatureBase64: body.challengeSignatureBase64,
      clientIp: getClientIp(request)
    });

    await recordPurchaseFlowEvent({
      flowId,
      endpoint: "prepare",
      phase: "success",
      walletPublicKey: roleResult.pubkey,
      propertyId: prepared.propertyId,
      attemptId: prepared.attemptId,
      idempotencyKey: prepared.idempotencyKey,
      statusCode: 200,
      metadata: {
        paymentCurrency: prepared.paymentCurrency,
        priceLamports: prepared.priceLamports,
        priceUsdcAtomic: prepared.priceUsdcAtomic
      }
    });

    return withFlowIdHeader(NextResponse.json({
      ok: true,
      data: prepared
    }), flowId);
  } catch (error) {
    if (error instanceof PurchaseFlowError) {
      await recordPurchaseFlowEvent({
        flowId,
        endpoint: "prepare",
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

    const message = error instanceof Error ? error.message : "Could not prepare purchase transaction.";
    await recordPurchaseFlowEvent({
      flowId,
      endpoint: "prepare",
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
