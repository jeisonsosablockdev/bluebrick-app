import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/property-marketplace-server", () => ({
  getMarketplacePropertyDetailOrThrowRpc: vi.fn()
}));

import {
  amountToLamports,
  evaluateMintAvailability,
  evaluatePurchaseQuantity,
  getPurchaseAssetVerificationRetryConfig,
  mapSubmitErrorToPurchaseError,
  resolvePreparedPriceLamports
} from "@/lib/purchase-service";

describe("lib/purchase-service", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns INVALID_QUANTITY when quantity is not a positive integer", () => {
    const error = evaluatePurchaseQuantity({
      quantityMode: "SINGLE_ONLY",
      requestedQuantity: 0
    });

    expect(error?.code).toBe("INVALID_QUANTITY");
    expect(error?.status).toBe(400);
  });

  it("returns INVALID_QUANTITY when quantity is above 1 in SINGLE_ONLY mode", () => {
    const error = evaluatePurchaseQuantity({
      quantityMode: "SINGLE_ONLY",
      requestedQuantity: 2
    });

    expect(error?.code).toBe("INVALID_QUANTITY");
    expect(error?.status).toBe(409);
  });

  it("accepts quantity=1 in SINGLE_ONLY mode", () => {
    const error = evaluatePurchaseQuantity({
      quantityMode: "SINGLE_ONLY",
      requestedQuantity: 1
    });

    expect(error).toBeNull();
  });

  it("accepts quantity>1 in MULTI_ENABLED mode when below max", () => {
    const error = evaluatePurchaseQuantity({
      quantityMode: "MULTI_ENABLED",
      requestedQuantity: 3,
      maxQuantityPerOrder: 10
    });

    expect(error).toBeNull();
  });

  it("returns INVALID_QUANTITY when quantity exceeds max in MULTI_ENABLED mode", () => {
    const error = evaluatePurchaseQuantity({
      quantityMode: "MULTI_ENABLED",
      requestedQuantity: 11,
      maxQuantityPerOrder: 10
    });

    expect(error?.code).toBe("INVALID_QUANTITY");
    expect(error?.status).toBe(409);
  });

  it("returns MINT_NOT_STARTED when guard start date is in the future", () => {
    const error = evaluateMintAvailability(
      {
        startDateUnix: 2_000_000_000,
        itemsRemaining: 10
      },
      1_900_000_000
    );

    expect(error?.code).toBe("MINT_NOT_STARTED");
  });

  it("returns SOLD_OUT when items remaining is zero", () => {
    const error = evaluateMintAvailability(
      {
        startDateUnix: null,
        itemsRemaining: 0
      },
      1_900_000_000
    );

    expect(error?.code).toBe("SOLD_OUT");
  });

  it("maps insufficient funds submit errors to INSUFFICIENT_FUNDS", () => {
    const error = mapSubmitErrorToPurchaseError(new Error("Simulation failed: insufficient funds for fee"));
    expect(error.code).toBe("INSUFFICIENT_FUNDS");
  });

  it("maps unknown submit errors to TRANSACTION_FAILED", () => {
    const error = mapSubmitErrorToPurchaseError(new Error("blockhash not found"));
    expect(error.code).toBe("TRANSACTION_FAILED");
  });

  it("parses bigint guard amounts", () => {
    expect(amountToLamports(1_000_000n)).toBe(1_000_000);
  });

  it("parses object guard amounts with basisPoints", () => {
    expect(amountToLamports({ basisPoints: 2_500_000n })).toBe(2_500_000);
  });

  it("returns null for unsupported guard amount values", () => {
    expect(amountToLamports({ invalid: true })).toBeNull();
  });

  it("returns 0 prepared price for USDC payment currency", () => {
    expect(resolvePreparedPriceLamports("USDC", null)).toBe(0);
    expect(resolvePreparedPriceLamports("USDC", 100_000)).toBe(0);
  });

  it("returns SOL prepared price when payment currency is SOL", () => {
    expect(resolvePreparedPriceLamports("SOL", 100_000)).toBe(100_000);
    expect(resolvePreparedPriceLamports("SOL", null)).toBe(0);
  });

  it("uses a longer asset verification window after confirmed Core mint transactions", () => {
    const config = getPurchaseAssetVerificationRetryConfig({});

    expect(config.maxAttempts).toBe(24);
    expect(config.retryDelayMs).toBe(1500);
  });

  it("allows bounded asset verification window overrides for devnet propagation", () => {
    const config = getPurchaseAssetVerificationRetryConfig({
      PURCHASE_ASSET_VERIFICATION_MAX_ATTEMPTS: "200",
      PURCHASE_ASSET_VERIFICATION_RETRY_MS: "9000"
    });

    expect(config.maxAttempts).toBe(120);
    expect(config.retryDelayMs).toBe(5000);
  });

  it("ignores invalid asset verification window overrides", () => {
    const config = getPurchaseAssetVerificationRetryConfig({
      PURCHASE_ASSET_VERIFICATION_MAX_ATTEMPTS: "4.5",
      PURCHASE_ASSET_VERIFICATION_RETRY_MS: "-1"
    });

    expect(config.maxAttempts).toBe(24);
    expect(config.retryDelayMs).toBe(1500);
  });
});
