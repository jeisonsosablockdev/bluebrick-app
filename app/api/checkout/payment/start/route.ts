import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { getCheckoutPaymentMethodDisabledError } from "@/features/checkout-payment/domain/checkout-payment-methods";
import {
  CheckoutError,
  startOrderPayment
} from "@/features/checkout-payment/application/checkout-service";

type StartPaymentBody = {
  orderId?: unknown;
  paymentMethod?: unknown;
  runtimeMode?: unknown;
};

function parseBody(raw: unknown): {
  orderId: string;
  paymentMethod: "crypto" | "airwallex";
  runtimeMode: "sandbox" | "live";
} {
  if (!raw || typeof raw !== "object") {
    throw new CheckoutError("INVALID_BODY", "Request body must be an object.", 400);
  }

  const body = raw as StartPaymentBody;
  if (typeof body.orderId !== "string" || !body.orderId.trim()) {
    throw new CheckoutError("ORDER_ID_REQUIRED", "orderId is required.", 400);
  }

  const paymentMethod = typeof body.paymentMethod === "string" ? body.paymentMethod.trim().toLowerCase() : "";
  if (paymentMethod !== "crypto" && paymentMethod !== "airwallex") {
    throw new CheckoutError("PAYMENT_METHOD_INVALID", "paymentMethod must be 'crypto' or 'airwallex'.", 400);
  }

  const runtimeModeRaw = typeof body.runtimeMode === "string" ? body.runtimeMode.trim().toLowerCase() : "live";
  if (runtimeModeRaw !== "sandbox" && runtimeModeRaw !== "live") {
    throw new CheckoutError("RUNTIME_MODE_INVALID", "runtimeMode must be 'sandbox' or 'live'.", 400);
  }

  return {
    orderId: body.orderId.trim(),
    paymentMethod,
    runtimeMode: runtimeModeRaw
  };
}

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

export async function POST(request: NextRequest): Promise<NextResponse> {
  const role = getRequestRole(request);
  if (!role.authenticated || !role.pubkey) {
    return unauthorized();
  }

  try {
    const body = parseBody(await request.json().catch(() => null));
    const disabledMethodError = getCheckoutPaymentMethodDisabledError(body.paymentMethod);
    if (disabledMethodError) {
      throw new CheckoutError(
        disabledMethodError.code,
        disabledMethodError.message,
        disabledMethodError.status
      );
    }

    // HARDENING-PREPROD: remove sandbox runtime override support from public API payload.
    // In production we enforce live mode only to prevent accidental sandbox payment calls.
    if (process.env.NODE_ENV === "production" && body.runtimeMode === "sandbox") {
      throw new CheckoutError(
        "SANDBOX_MODE_FORBIDDEN",
        "Sandbox mode is disabled in production.",
        403
      );
    }

    const result = await startOrderPayment({
      walletPublicKey: role.pubkey,
      orderId: body.orderId,
      paymentMethod: body.paymentMethod,
      runtimeMode: body.runtimeMode
    });

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: { code: error.code, message: error.message, details: error.details ?? null } }, { status: error.status });
    }

    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Could not start order payment." } }, { status: 500 });
  }
}
