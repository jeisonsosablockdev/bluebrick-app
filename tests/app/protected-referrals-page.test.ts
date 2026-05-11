import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  redirect: vi.fn((href: string) => {
    throw new Error(`REDIRECT:${href}`);
  })
}));

const authMocks = vi.hoisted(() => ({
  getAuthenticatedPublicKeyFromCookies: vi.fn()
}));

vi.mock("next/navigation", () => ({
  redirect: navigationMocks.redirect
}));

vi.mock("@/lib/auth", () => ({
  getAuthenticatedPublicKeyFromCookies: authMocks.getAuthenticatedPublicKeyFromCookies
}));

vi.mock("@/components/dashboard/referral-program-module", () => ({
  ReferralProgramModule: () => null
}));

import ReferralsPage from "@/app/protected/referrals/page";

describe("app/protected/referrals/page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("redirects account-only sessions back to protected overview", async () => {
    authMocks.getAuthenticatedPublicKeyFromCookies.mockResolvedValue(null);

    await expect(ReferralsPage()).rejects.toThrow("REDIRECT:/protected");
  });

  it("renders when wallet auth exists", async () => {
    authMocks.getAuthenticatedPublicKeyFromCookies.mockResolvedValue("Wallet111");

    await expect(ReferralsPage()).resolves.not.toBeNull();
  });
});
