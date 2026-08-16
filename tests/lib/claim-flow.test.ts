import { describe, expect, it } from "vitest";

import { ClaimFlowError, submitPayoutOverride } from "@/features/staking-distribution/application/claim-flow";
import { verifySiwsSignature, buildSiwsMessage } from "@/lib/siws";

describe("features/staking-distribution/application/claim-flow", () => {
  it("creates ClaimFlowError with correct error code and message", () => {
    const error = new ClaimFlowError("QUOTE_EXPIRED", "Claim quote has expired (48-hour TTL exceeded).");
    expect(error.code).toBe("QUOTE_EXPIRED");
    expect(error.message).toBe("Claim quote has expired (48-hour TTL exceeded).");
  });

  it("rejects payout override submission when SIWS proof is invalid", async () => {
    await expect(
      submitPayoutOverride({
        claimId: "018f3a8b-7c42-7000-8000-000000000001",
        walletPublicKey: "11111111111111111111111111111111",
        newPayoutWallet: "22222222222222222222222222222222",
        siwsMessage: "invalid message",
        siwsSignature: "invalid signature"
      })
    ).rejects.toThrow(ClaimFlowError);
  });
});

describe("lib/siws verifySiwsSignature", () => {
  it("returns false for invalid SIWS payload or signature", () => {
    const validAddress = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
    const message = buildSiwsMessage({
      domain: "localhost",
      publicKey: validAddress,
      nonce: "1234567890",
      issuedAt: new Date().toISOString(),
      statement: "Override payout wallet"
    });

    const result = verifySiwsSignature({
      message,
      signature: Buffer.from(new Uint8Array(64)).toString("base64"),
      publicKey: validAddress
    });

    expect(result).toBe(false);
  });
});

