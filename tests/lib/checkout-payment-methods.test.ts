import { describe, expect, it } from "vitest";

import {
  AIRWALLEX_CHECKOUT_ENABLED,
  getCheckoutPaymentMethodDisabledError,
  isCheckoutPaymentMethodEnabled
} from "@/features/checkout-payment/domain/checkout-payment-methods";

describe("features/checkout-payment/domain/checkout-payment-methods", () => {
  it("keeps crypto enabled", () => {
    expect(isCheckoutPaymentMethodEnabled("crypto")).toBe(true);
    expect(getCheckoutPaymentMethodDisabledError("crypto")).toBeNull();
  });

  it("keeps airwallex disabled while suspension is active", () => {
    expect(AIRWALLEX_CHECKOUT_ENABLED).toBe(false);
    expect(isCheckoutPaymentMethodEnabled("airwallex")).toBe(false);
    expect(getCheckoutPaymentMethodDisabledError("airwallex")).toEqual({
      code: "PAYMENT_METHOD_DISABLED",
      message: "Card payments are temporarily unavailable.",
      status: 403
    });
  });
});
