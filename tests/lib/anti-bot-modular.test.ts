import { describe, expect, it } from "vitest";

import { getPurchaseAntiBotConfig } from "@/lib/anti-bot/config";
import { assertMatchingChallengeContext, buildPurchaseChallengeMessage } from "@/lib/anti-bot/challenge-builder";
import { decodeSignature } from "@/lib/anti-bot/signature-verifier";

describe("SPEC 7 - Modular Anti-Bot Refactor (SRP)", () => {
  it("@spec BRI-12-REQ-7 parses anti-bot config parameters with defaults", () => {
    const config = getPurchaseAntiBotConfig();
    expect(config.challengeTtlSeconds).toBeGreaterThan(0);
    expect(config.rateLimitWindowSeconds).toBeGreaterThan(0);
    expect(config.rateLimitMaxByWallet).toBeGreaterThan(0);
    expect(config.rateLimitMaxByIp).toBeGreaterThan(0);
  });

  it("@spec BRI-12-REQ-7 builds deterministic challenge message in challenge-builder module", () => {
    const msg = buildPurchaseChallengeMessage({
      walletPublicKey: "Wallet1111111111111111111111111111111111111",
      propertyId: "torre-marina",
      candyMachineAddress: "CM11111111111111111111111111111111111111111",
      quantity: 2,
      nonce: "nonce-123",
      expiresAtIso: "2026-08-02T22:00:00.000Z"
    });

    expect(msg).toContain("Solana Purchase Challenge");
    expect(msg).toContain("Quantity: 2");
    expect(msg).toContain("Nonce: nonce-123");
  });

  it("@spec BRI-12-REQ-7 decodes Base64 Ed25519 signatures in signature-verifier module", () => {
    const base64Sig = Buffer.from(new Uint8Array(64).fill(1)).toString("base64");
    const decoded = decodeSignature(base64Sig);

    expect(decoded).toBeInstanceOf(Uint8Array);
    expect(decoded.length).toBe(64);
  });
});
