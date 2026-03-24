import { NextRequest, NextResponse } from "next/server";

import { getFlowId, recordPurchaseFlowEvent, withFlowIdHeader } from "@/lib/purchase-flow-trace";
import { PurchaseFlowError, quotePurchaseForProperty } from "@/lib/purchase-service";

type QuoteBody = {
  propertyId?: unknown;
  quantity?: unknown;
};

function normalizeBody(raw: unknown): { propertyId: string; quantity: number } {
  if (!raw || typeof raw !== "object") {
    throw new PurchaseFlowError("TRANSACTION_FAILED", "Request body must be an object.", 400);
  }

  const body = raw as QuoteBody;
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  const flowId = getFlowId(request.headers.get("x-flow-id"));

  try {
    const body = normalizeBody(await request.json().catch(() => null));
    await recordPurchaseFlowEvent({
      flowId,
      endpoint: "quote",
      phase: "request",
      propertyId: body.propertyId,
      metadata: {
        quantity: body.quantity
      }
    });

    const quote = await quotePurchaseForProperty(body.propertyId, body.quantity);
    await recordPurchaseFlowEvent({
      flowId,
      endpoint: "quote",
      phase: "success",
      propertyId: body.propertyId,
      statusCode: 200,
      metadata: {
        itemsRemaining: quote.itemsRemaining,
        priceLamports: quote.priceLamports
      }
    });

    return withFlowIdHeader(NextResponse.json({
      ok: true,
      data: quote
    }), flowId);
  } catch (error) {
    if (error instanceof PurchaseFlowError) {
      await recordPurchaseFlowEvent({
        flowId,
        endpoint: "quote",
        phase: "error",
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

    const message = error instanceof Error ? error.message : "Could not generate purchase quote.";
    await recordPurchaseFlowEvent({
      flowId,
      endpoint: "quote",
      phase: "error",
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
