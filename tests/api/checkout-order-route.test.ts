import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  createOrderFromCart: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/lib/checkout-service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/checkout-service")>("@/lib/checkout-service");

  return {
    ...actual,
    createOrderFromCart: routeMocks.createOrderFromCart
  };
});

import { POST } from "@/app/api/checkout/order/route";

function createRequest(body: unknown): NextRequest {
  return new NextRequest("https://example.com/api/checkout/order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/checkout/order", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      pubkey: "Wallet11111111111111111111111111111111111",
      role: "user"
    });
  });

  it("rejects airwallex order creation while card payments are suspended", async () => {
    const response = await POST(createRequest({ paymentMethod: "airwallex" }));
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("PAYMENT_METHOD_DISABLED");
    expect(payload.error.message).toBe("Card payments are temporarily unavailable.");
    expect(routeMocks.createOrderFromCart).not.toHaveBeenCalled();
  });
});
