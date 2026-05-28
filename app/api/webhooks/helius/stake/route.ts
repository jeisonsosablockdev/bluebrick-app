import { NextRequest, NextResponse } from "next/server";

import { processStakeHeliusWebhookPayload } from "@/lib/stake-webhook-reconciliation";

function unauthorizedResponse(): NextResponse {
  return NextResponse.json(
    {
      error: {
        code: "UNAUTHORIZED",
        message: "Webhook secret is invalid."
      }
    },
    { status: 401 }
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.HELIUS_WEBHOOK_SECRET?.trim();
  const authorization = request.headers.get("authorization")?.trim();

  if (!webhookSecret || authorization !== webhookSecret) {
    return unauthorizedResponse();
  }

  try {
    const payload = await request.json().catch(() => null);
    if (!Array.isArray(payload)) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_PAYLOAD",
            message: "Helius stake webhook payload must be an array."
          }
        },
        { status: 400 }
      );
    }

    const processed = await processStakeHeliusWebhookPayload(payload);

    return NextResponse.json({
      ok: true,
      data: processed
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "STAKE_WEBHOOK_FAILED",
          message: error instanceof Error ? error.message : "Could not process stake webhook payload."
        }
      },
      { status: 500 }
    );
  }
}

