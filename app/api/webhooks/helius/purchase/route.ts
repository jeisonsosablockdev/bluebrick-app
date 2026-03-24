import { NextRequest, NextResponse } from "next/server";

import { processPurchaseHeliusWebhookPayload } from "@/lib/purchase-webhook-reconciliation";

function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "UNAUTHORIZED",
        message: "Webhook secret mismatch."
      }
    },
    { status: 401 }
  );
}

function invalidPayloadResponse(): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "INVALID_PAYLOAD",
        message: "Webhook payload must be an array."
      }
    },
    { status: 400 }
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const expectedSecret = process.env.HELIUS_WEBHOOK_SECRET?.trim();
  const providedSecret = request.headers.get("authorization")?.trim();

  if (!expectedSecret || !providedSecret || providedSecret !== expectedSecret) {
    return unauthorizedResponse();
  }

  const payload = await request.json().catch(() => null);
  if (!Array.isArray(payload)) {
    return invalidPayloadResponse();
  }

  try {
    const processed = await processPurchaseHeliusWebhookPayload(payload);

    return NextResponse.json({
      ok: true,
      data: processed
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not process purchase webhook payload.";
    return NextResponse.json(
      {
        error: {
          code: "WEBHOOK_PROCESSING_FAILED",
          message
        }
      },
      { status: 500 }
    );
  }
}
