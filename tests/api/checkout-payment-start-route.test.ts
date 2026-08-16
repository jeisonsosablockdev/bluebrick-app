import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getRequestRole: vi.fn(),
  startOrderPayment: vi.fn()
}));

vi.mock("@/lib/auth-session", () => ({
  getRequestRole: routeMocks.getRequestRole
}));

vi.mock("@/features/checkout-payment/application/checkout-service", async () => {
  const actual = await vi.importActual<typeof import("@/features/checkout-payment/application/checkout-service")>("@/features/checkout-payment/application/checkout-service");

  return {
    ...actual,
    startOrderPayment: routeMocks.startOrderPayment
  };
});

import { POST } from "@/app/api/checkout/payment/start/route";

function createRequest(body: unknown): NextRequest {
  return new NextRequest("https://example.com/api/checkout/payment/start", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/checkout/payment/start", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getRequestRole.mockReturnValue({
      authenticated: true,
      pubkey: "Wallet11111111111111111111111111111111111",
      role: "user"
    });
  });

  it("rejects airwallex payment start while card payments are suspended", async () => {
    const response = await POST(
      createRequest({
        orderId: "order-1",
        paymentMethod: "airwallex"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("PAYMENT_METHOD_DISABLED");
    expect(payload.error.message).toBe("Card payments are temporarily unavailable.");
    expect(routeMocks.startOrderPayment).not.toHaveBeenCalled();
  });
});
