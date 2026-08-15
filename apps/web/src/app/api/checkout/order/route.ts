import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import { getCheckoutPaymentMethodDisabledError } from "@/lib/checkout-payment-methods";
import {
  CheckoutError,
  createOrderFromCart
} from "@/lib/checkout-service";

type CreateOrderBody = {
  paymentMethod?: unknown;
  idempotencyKey?: unknown;
  applyOnboardingReward?: unknown;
};

function parseBody(raw: unknown): { paymentMethod: "crypto" | "airwallex"; idempotencyKey?: string; applyOnboardingReward?: boolean } {
  if (!raw || typeof raw !== "object") {
    throw new CheckoutError("INVALID_BODY", "Request body must be an object.", 400);
  }

  const body = raw as CreateOrderBody;
  const paymentMethod = typeof body.paymentMethod === "string" ? body.paymentMethod.trim().toLowerCase() : "";

  if (paymentMethod !== "crypto" && paymentMethod !== "airwallex") {
    throw new CheckoutError("PAYMENT_METHOD_INVALID", "paymentMethod must be 'crypto' or 'airwallex'.", 400);
  }

  const idempotencyKey = typeof body.idempotencyKey === "string" && body.idempotencyKey.trim()
    ? body.idempotencyKey.trim()
    : undefined;

  return {
    paymentMethod,
    idempotencyKey,
    applyOnboardingReward: typeof body.applyOnboardingReward === "boolean" ? body.applyOnboardingReward : undefined
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

    const order = await createOrderFromCart({
      walletPublicKey: role.pubkey,
      paymentMethod: body.paymentMethod,
      idempotencyKey: body.idempotencyKey,
      applyOnboardingReward: body.applyOnboardingReward
    });

    return NextResponse.json({ ok: true, data: order });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: { code: error.code, message: error.message, details: error.details ?? null } }, { status: error.status });
    }

    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Could not create order from cart." } }, { status: 500 });
  }
}
