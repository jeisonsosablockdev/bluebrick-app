import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { reprocessPurchaseWebhookEventById } from "@/features/checkout-payment/application/purchase-webhook-reconciliation";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
): Promise<NextResponse> {
  const role = getRequestRole(request);
  if (!role.authenticated || role.role !== "admin") {
    return NextResponse.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "Admin role is required."
        }
      },
      { status: 403 }
    );
  }

  const { eventId } = await context.params;
  if (!eventId || !eventId.trim()) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_EVENT_ID",
          message: "eventId is required."
        }
      },
      { status: 400 }
    );
  }

  try {
    const result = await reprocessPurchaseWebhookEventById({ eventId });
    return NextResponse.json({
      ok: true,
      data: result
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not reprocess webhook event.";
    const status = message === "Webhook event not found." ? 404 : 500;
    return NextResponse.json(
      {
        error: {
          code: status === 404 ? "EVENT_NOT_FOUND" : "REPROCESS_FAILED",
          message
        }
      },
      { status }
    );
  }
}
