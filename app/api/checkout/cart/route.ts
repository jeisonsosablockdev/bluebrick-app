import { NextRequest, NextResponse } from "next/server";

import { getRequestRole } from "@/lib/auth-session";
import {
  CheckoutError,
  getCart,
  removeCartItemByProperty,
  upsertCartItemQuantity
} from "@/lib/checkout-service";

type CartMutationBody = {
  propertyId?: unknown;
  quantity?: unknown;
};

function parseBody(raw: unknown): { propertyId: string; quantity: number } {
  if (!raw || typeof raw !== "object") {
    throw new CheckoutError("INVALID_BODY", "Request body must be an object.", 400);
  }

  const body = raw as CartMutationBody;
  if (typeof body.propertyId !== "string" || !body.propertyId.trim()) {
    throw new CheckoutError("PROPERTY_REQUIRED", "propertyId is required.", 400);
  }

  const quantity = Number(body.quantity);
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new CheckoutError("INVALID_QUANTITY", "quantity must be a positive integer.", 400);
  }

  return {
    propertyId: body.propertyId.trim(),
    quantity
  };
}

function parseDeleteBody(raw: unknown): { propertyId: string } {
  if (!raw || typeof raw !== "object") {
    throw new CheckoutError("INVALID_BODY", "Request body must be an object.", 400);
  }

  const body = raw as { propertyId?: unknown };
  if (typeof body.propertyId !== "string" || !body.propertyId.trim()) {
    throw new CheckoutError("PROPERTY_REQUIRED", "propertyId is required.", 400);
  }

  return {
    propertyId: body.propertyId.trim()
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

export async function GET(request: NextRequest): Promise<NextResponse> {
  const role = getRequestRole(request);
  if (!role.authenticated || !role.pubkey) {
    return unauthorized();
  }

  try {
    const cart = await getCart(role.pubkey);
    return NextResponse.json({ ok: true, data: cart });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: { code: error.code, message: error.message, details: error.details ?? null } }, { status: error.status });
    }

    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Could not load cart." } }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const role = getRequestRole(request);
  if (!role.authenticated || !role.pubkey) {
    return unauthorized();
  }

  try {
    const body = parseBody(await request.json().catch(() => null));
    const cart = await upsertCartItemQuantity({
      walletPublicKey: role.pubkey,
      propertyId: body.propertyId,
      quantity: body.quantity
    });

    return NextResponse.json({ ok: true, data: cart });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: { code: error.code, message: error.message, details: error.details ?? null } }, { status: error.status });
    }

    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Could not update cart." } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  return POST(request);
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const role = getRequestRole(request);
  if (!role.authenticated || !role.pubkey) {
    return unauthorized();
  }

  try {
    const body = parseDeleteBody(await request.json().catch(() => null));
    const cart = await removeCartItemByProperty({
      walletPublicKey: role.pubkey,
      propertyId: body.propertyId
    });

    return NextResponse.json({ ok: true, data: cart });
  } catch (error) {
    if (error instanceof CheckoutError) {
      return NextResponse.json({ error: { code: error.code, message: error.message, details: error.details ?? null } }, { status: error.status });
    }

    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: "Could not remove cart item." } }, { status: 500 });
  }
}
