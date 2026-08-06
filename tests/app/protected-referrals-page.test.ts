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

import ReferralsPage from "../../../app/profile/referrals/page";

describe("app/profile/referrals/page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders when profile referrals page is invoked", () => {
    authMocks.getAuthenticatedPublicKeyFromCookies.mockResolvedValue("Wallet111");
    expect(ReferralsPage()).not.toBeNull();
  });
});
