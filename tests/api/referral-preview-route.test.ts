import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";

import { GET } from "@/app/api/referrals/preview/route";
import { __resetReferralRepositoryStateForTests, getOrCreateReferralCodeForWallet } from "@/features/referral-marketing/infrastructure/referrals-repository";

function createRequest(code?: string): NextRequest {
  const url = code
    ? `https://example.com/api/referrals/preview?code=${encodeURIComponent(code)}`
    : "https://example.com/api/referrals/preview";

  return new NextRequest(url, { method: "GET" });
}

describe("GET /api/referrals/preview", () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
    __resetReferralRepositoryStateForTests();
  });

  it("returns 400 when code is missing", async () => {
    const response = await GET(createRequest());
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("INVALID_REFERRAL_CODE");
  });

  it("returns truncated referrer preview for a valid referral code", async () => {
    const referralCode = await getOrCreateReferralCodeForWallet({
      referrerWalletPublicKey: "Wallet11111111111111111111111111111111111"
    });

    const response = await GET(createRequest(referralCode.code));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.code).toBe(referralCode.code);
    expect(payload.data.referrerWalletDisplay).toBe("Wall...1111");
  });

  it("returns 404 for unknown referral codes", async () => {
    const response = await GET(createRequest("UNKNOWN-REF"));
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.error.code).toBe("REFERRAL_NOT_FOUND");
  });
});
