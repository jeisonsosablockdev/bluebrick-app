import { afterEach, describe, expect, it } from "vitest";

import { resolveCandyGuardPaymentMode } from "@/features/nft-minting/domain/candy-guard-payment-config";

const originalMode = process.env.CANDY_GUARD_PAYMENT_MODE;

afterEach(() => {
  if (typeof originalMode === "string") {
    process.env.CANDY_GUARD_PAYMENT_MODE = originalMode;
    return;
  }

  delete process.env.CANDY_GUARD_PAYMENT_MODE;
});

describe("features/nft-minting/domain/candy-guard-payment-config", () => {
  it("defaults to USDC when CANDY_GUARD_PAYMENT_MODE is missing", () => {
    delete process.env.CANDY_GUARD_PAYMENT_MODE;
    expect(resolveCandyGuardPaymentMode()).toBe("USDC");
  });

  it("ignores explicit SOL mode and keeps USDC policy", () => {
    process.env.CANDY_GUARD_PAYMENT_MODE = "SOL";
    expect(resolveCandyGuardPaymentMode()).toBe("USDC");
  });

  it("keeps USDC when configured explicitly", () => {
    process.env.CANDY_GUARD_PAYMENT_MODE = "USDC";
    expect(resolveCandyGuardPaymentMode()).toBe("USDC");
  });
});
