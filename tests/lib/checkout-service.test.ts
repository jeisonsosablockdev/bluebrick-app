import { describe, expect, it } from "vitest";

import { CheckoutError, createOrderFromCart } from "@/lib/checkout-service";

describe("lib/checkout-service", () => {
  it("rejects suspended airwallex checkout before opening a transaction", async () => {
    await expect(
      createOrderFromCart({
        walletPublicKey: "Wallet11111111111111111111111111111111111",
        paymentMethod: "airwallex"
      })
    ).rejects.toMatchObject({
      code: "PAYMENT_METHOD_DISABLED",
      status: 403,
      message: "Card payments are temporarily unavailable."
    });
  });
});
