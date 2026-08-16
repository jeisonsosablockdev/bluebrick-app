// @vitest-environment jsdom
/**
 * TDD — navigation-use-referral-capture
 * @spec BRI-154 § Referral Capture Hook
 */

import { describe, expect, it, vi, beforeEach, type Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useReferralCapture } from "../../apps/web/src/features/referral-marketing/application/use-referral-capture";
import { ANONYMOUS_AUTH_STATE } from "../../apps/web/src/lib/auth-client";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock("../../apps/web/src/lib/auth-client", () => ({
  ANONYMOUS_AUTH_STATE: {
    authenticated: false,
    pubkey: null,
    federatedAuthenticated: false,
    walletAuthenticated: false,
    accountId: null,
    federatedAvailable: false,
  },
  persistReferralIntent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../apps/web/src/features/referral-marketing/application/client-state", () => ({
  buildStoredReferralHint: vi.fn((input: { referralCode: string; origin: string; landingPath?: string | null }) => ({
    referralCode: input.referralCode.toUpperCase().trim(),
    origin: input.origin,
    landingPath: input.landingPath ?? null,
    capturedAt: new Date().toISOString(),
  })),
  buildReferralAuthMetadata: vi.fn(() => ({})),
  clearStoredReferralHint: vi.fn(),
  deriveReferralAttributionSource: vi.fn(() => "link"),
  normalizeReferralCodeInput: vi.fn((v: string) => v.trim().toUpperCase()),
  readStoredReferralHint: vi.fn(() => null),
  writeStoredReferralHint: vi.fn(),
}));

import {
  readStoredReferralHint,
  writeStoredReferralHint,
  clearStoredReferralHint,
  normalizeReferralCodeInput,
} from "../../apps/web/src/features/referral-marketing/application/client-state";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const baseParams = {
  authState: ANONYMOUS_AUTH_STATE,
  queryReferralCode: "",
  cleanCurrentLandingPath: "/",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("useReferralCapture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (readStoredReferralHint as Mock).mockReturnValue(null);
  });

  it("given_query_ref_param_then_sets_referral_code", () => {
    const { result } = renderHook(() =>
      useReferralCapture({ ...baseParams, queryReferralCode: "abc123" })
    );

    expect(writeStoredReferralHint).toHaveBeenCalled();
    expect(result.current.referralCode).toBeTruthy();
    expect(result.current.referralOrigin).toBe("auto");
  });

  it("given_stored_hint_then_reads_and_applies", () => {
    (readStoredReferralHint as Mock).mockReturnValue({
      referralCode: "STORED",
      origin: "manual",
      landingPath: "/landing",
      capturedAt: new Date().toISOString(),
    });

    const { result } = renderHook(() =>
      useReferralCapture({ ...baseParams, queryReferralCode: "" })
    );

    expect(result.current.referralCode).toBe("STORED");
    expect(result.current.referralOrigin).toBe("manual");
  });

  it("given_referral_code_present_then_shows_field", () => {
    const { result } = renderHook(() =>
      useReferralCapture({ ...baseParams, queryReferralCode: "XYZ" })
    );

    expect(result.current.isReferralFieldVisible).toBe(true);
  });

  it("given_handleReferralCodeChange_then_normalizes_and_stores", () => {
    const { result } = renderHook(() =>
      useReferralCapture(baseParams)
    );

    act(() => {
      result.current.handleReferralCodeChange("mycode");
    });

    expect(normalizeReferralCodeInput).toHaveBeenCalledWith("mycode");
    expect(writeStoredReferralHint).toHaveBeenCalled();
  });

  it("given_empty_change_then_clears_stored_hint", () => {
    (normalizeReferralCodeInput as Mock).mockReturnValueOnce("");

    const { result } = renderHook(() =>
      useReferralCapture(baseParams)
    );

    act(() => {
      result.current.handleReferralCodeChange("");
    });

    expect(clearStoredReferralHint).toHaveBeenCalled();
  });
});
