import { NextRequest, NextResponse } from "next/server";

import {
  InvalidStripeWebhookPayloadError,
  InvalidStripeWebhookSignatureError,
  processStripeIdentityWebhook
} from "@/lib/kyc/stripe-webhook-handler";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.STRIPE_IDENTITY_WEBHOOK_SECRET?.trim();

  if (!webhookSecret) {
    return NextResponse.json(
      {
        error: {
          code: "WEBHOOK_MISCONFIGURED",
          message: "Missing STRIPE_IDENTITY_WEBHOOK_SECRET."
        }
      },
      { status: 500 }
    );
  }

  const signatureHeader = request.headers.get("stripe-signature")?.trim();

  if (!signatureHeader) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_SIGNATURE",
          message: "Stripe-Signature header is required."
        }
      },
      { status: 401 }
    );
  }

  const rawBody = await request.text();

  try {
    const processed = await processStripeIdentityWebhook({
      rawBody,
      signatureHeader,
      webhookSecret
    });

    return NextResponse.json({
      ok: true,
      data: processed
    });
  } catch (error) {
    if (error instanceof InvalidStripeWebhookSignatureError) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_SIGNATURE",
            message: error.message
          }
        },
        { status: 401 }
      );
    }

    if (error instanceof InvalidStripeWebhookPayloadError) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_PAYLOAD",
            message: error.message
          }
        },
        { status: 400 }
      );
    }

    const message = error instanceof Error ? error.message : "Could not process Stripe webhook event.";

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
