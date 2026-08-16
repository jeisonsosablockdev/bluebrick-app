import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  evaluateHeliusAmlClassification,
  screenWalletWithHelius
} from "@/features/profile/infrastructure/aml-helius";

const WALLET = "Wallet11111111111111111111111111111111111";
const WALLET_FALLBACK = "Wallet22222222222222222222222222222222222";

describe("aml-helius", () => {
  beforeEach(() => {
    process.env.HELIUS_API_KEY = "helius_test_key";
    delete process.env.HELIUS_AML_API_URL;
    process.env.HELIUS_AML_RETRY_ATTEMPTS = "1";
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("classifies high risk payload as flagged", () => {
    const result = evaluateHeliusAmlClassification({
      riskScore: 91,
      flags: [{ code: "sanctions_hit", severity: "high" }]
    });

    expect(result.providerClassification).toBe("flagged");
    expect(result.amlStatus).toBe("flagged");
    expect(result.amlRiskScore).toBe(91);
  });

  it("classifies medium risk payload as review_required -> pending", () => {
    const result = evaluateHeliusAmlClassification({
      riskScore: 55,
      flags: [{ code: "mixer_exposure", severity: "medium" }]
    });

    expect(result.providerClassification).toBe("review_required");
    expect(result.amlStatus).toBe("pending");
    expect(result.amlRiskScore).toBe(55);
  });

  it("returns unavailable when provider request fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const result = await screenWalletWithHelius({
      walletPublicKey: WALLET,
      reason: "test-network-failure"
    });

    expect(result.providerClassification).toBe("unavailable");
    expect(result.amlStatus).toBe("pending");
    expect(result.flags[0]?.code).toBe("provider_unavailable");
  });

  it("falls back to wallet API signals when risk endpoint is unavailable", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: "Method not found" } }), { status: 404 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ address: WALLET_FALLBACK, type: "unknown" }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "No transactions found", code: 404 }), { status: 404 })
      );

    vi.stubGlobal("fetch", fetchMock);

    const result = await screenWalletWithHelius({
      walletPublicKey: WALLET_FALLBACK,
      reason: "fallback-wallet-api"
    });

    expect(result.providerClassification).toBe("review_required");
    expect(result.amlStatus).toBe("pending");
    expect(result.flags.some((flag) => flag.code === "wallet_api_unknown_identity")).toBe(true);
  });
});
