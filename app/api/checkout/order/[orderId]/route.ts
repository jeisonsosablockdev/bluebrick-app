import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import {
  CheckoutError,
  getOrderSnapshot
} from "@/lib/checkout-service";

type RouteContext = {
  params: Promise<{ orderId: string }>;
};

function unauthorized(): NextResponse {
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

export async function GET(request: NextRequest, context: RouteContext): Promise<NextResponse> {
  const role = getRequestRole(request);
  if (!role.authenticated || !role.pubkey) {
    return unauthorized();
  }

  const params = await context.params;
  const orderId = params.orderId?.trim();
  if (!orderId) {
    return NextResponse.json({ error: { code: "ORDER_ID_REQUIRED", message: "orderId is required." } }, { status: 400 });
  }

  try {
    const order = await getOrderSnapshot({
      walletPublicKey: role.pubkey,
      orderId
    });

    return NextResponse.json({ ok: true, data: order });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: { code: error.code, message: error.message, details: error.details ?? null } }, { status: error.status });
    }

    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Could not load order." } }, { status: 500 });
  }
}
