import { NextRequest, NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const routeMocks = vi.hoisted(() => ({
  getNonceFromRequest: vi.fn(),
  getRequestHost: vi.fn(),
  verifySiwsPayload: vi.fn(),
  setSessionCookie: vi.fn(),
  clearNonceCookie: vi.fn(),
  isWalletRegistered: vi.fn(),
  bindReferralAtFirstAuth: vi.fn()
}));

vi.mock("@/lib/auth", () => ({
  getNonceFromRequest: routeMocks.getNonceFromRequest,
  getRequestHost: routeMocks.getRequestHost,
  verifySiwsPayload: routeMocks.verifySiwsPayload,
  setSessionCookie: routeMocks.setSessionCookie,
  clearNonceCookie: routeMocks.clearNonceCookie
}));

vi.mock("@/lib/compliance/profile-repository", () => ({
  isWalletRegistered: routeMocks.isWalletRegistered
}));

vi.mock("@/lib/referrals/repository", () => ({
  bindReferralAtFirstAuth: routeMocks.bindReferralAtFirstAuth
}));

import { POST } from "@/app/api/auth/verify/route";

function createRequest(body: unknown): NextRequest {
  return new NextRequest("https://example.com/api/auth/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/auth/verify", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeMocks.getNonceFromRequest.mockReturnValue("nonce-1");
    routeMocks.getRequestHost.mockReturnValue("example.com");
    routeMocks.verifySiwsPayload.mockReturnValue({
      ok: true,
      publicKey: "Wallet11111111111111111111111111111111111",
      sessionToken: "session-1"
    });
    routeMocks.isWalletRegistered.mockResolvedValue(false);
    routeMocks.clearNonceCookie.mockImplementation((response: NextResponse) => response);
    routeMocks.setSessionCookie.mockImplementation((response: NextResponse) => response);
    routeMocks.bindReferralAtFirstAuth.mockResolvedValue({
      outcome: "bound",
      attribution: {
        id: "attr-1"
      }
    });
  });

  it("returns 400 for invalid request body", async () => {
    const response = await POST(createRequest({ message: "hello" }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe("Invalid request body.");
    expect(routeMocks.bindReferralAtFirstAuth).not.toHaveBeenCalled();
  });

  it("binds referral code on first auth payload for a new wallet", async () => {
    const response = await POST(
      createRequest({
        message: "signed-message",
        signature: "signature-1",
        publicKey: "Wallet11111111111111111111111111111111111",
        referralCode: "REF-CODE-1",
        attributionSource: "link",
        attributionMetadata: {
          landingPath: "/?ref=REF-CODE-1",
          utmSource: "telegram"
        }
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.referralBindingOutcome).toBe("bound");
    expect(routeMocks.bindReferralAtFirstAuth).toHaveBeenCalledWith({
      inviteeWalletPublicKey: "Wallet11111111111111111111111111111111111",
      referralCode: "REF-CODE-1",
      attributionSource: "link",
      metadata: {
        landingPath: "/?ref=REF-CODE-1",
        utmSource: "telegram"
      }
    });
  });

  it("does not bind a referral for an already registered wallet", async () => {
    routeMocks.isWalletRegistered.mockResolvedValueOnce(true);

    const response = await POST(
      createRequest({
        message: "signed-message",
        signature: "signature-1",
        publicKey: "Wallet11111111111111111111111111111111111",
        referralCode: "REF-CODE-2",
        attributionSource: "manual"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.isNewUser).toBe(false);
    expect(payload.referralBindingOutcome).toBe("skipped_existing_wallet");
    expect(routeMocks.bindReferralAtFirstAuth).not.toHaveBeenCalled();
  });

  it("clears nonce cookie and returns verification error when SIWS verification fails", async () => {
    routeMocks.verifySiwsPayload.mockReturnValueOnce({
      ok: false,
      status: 409,
      error: "Invalid or expired nonce."
    });

    const response = await POST(
      createRequest({
        message: "signed-message",
        signature: "signature-1",
        publicKey: "Wallet11111111111111111111111111111111111"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error).toBe("Invalid or expired nonce.");
    expect(routeMocks.clearNonceCookie).toHaveBeenCalledTimes(1);
    expect(routeMocks.bindReferralAtFirstAuth).not.toHaveBeenCalled();
  });
});
