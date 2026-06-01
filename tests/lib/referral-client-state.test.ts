import { describe, expect, it } from "vitest";

import {
  buildPhantomBrowseDeepLink,
  buildReferralAuthPayload,
  buildReferralAuthMetadata,
  buildStoredReferralHint,
  deriveReferralAttributionSource,
  extractReferralCodeFromUrl,
  parseStoredReferralHint
} from "@/lib/referrals/client-state";

describe("lib/referrals/client-state", () => {
  it("extracts normalized referral codes from URL query params", () => {
    expect(extractReferralCodeFromUrl("https://example.com/?ref=abc-123")).toBe("ABC-123");
    expect(extractReferralCodeFromUrl("https://example.com/marketplace")).toBeNull();
  });

  it("builds and parses stored referral hints safely", () => {
    const hint = buildStoredReferralHint({
      referralCode: " ref-code-9 ",
      origin: "manual",
      landingPath: "/?ref=ref-code-9",
      capturedAt: "2026-05-03T00:00:00.000Z"
    });

    expect(hint).toEqual({
      referralCode: "REF-CODE-9",
      origin: "manual",
      landingPath: "/?ref=ref-code-9",
      capturedAt: "2026-05-03T00:00:00.000Z"
    });

    expect(parseStoredReferralHint(JSON.stringify(hint))).toEqual(hint);
    expect(parseStoredReferralHint("{bad json")).toBeNull();
  });

  it("derives attribution source from hint origin and mobile wallet flow", () => {
    expect(deriveReferralAttributionSource({ origin: "manual", isMobileWalletFlow: false })).toBe("manual");
    expect(deriveReferralAttributionSource({ origin: "auto", isMobileWalletFlow: false })).toBe("link");
    expect(deriveReferralAttributionSource({ origin: "auto", isMobileWalletFlow: true })).toBe("deep_link");
  });

  it("builds referral auth metadata and preserves query params in Phantom deep links", () => {
    expect(
      buildReferralAuthMetadata({
        landingPath: "/?ref=REF-10",
        origin: "auto",
        source: "deep_link"
      })
    ).toEqual({
      landingPath: "/?ref=REF-10",
      captureOrigin: "auto",
      inferredSource: "deep_link"
    });

    expect(buildPhantomBrowseDeepLink("https://example.com/?ref=REF-10")).toContain(
      encodeURIComponent("https://example.com/?ref=REF-10")
    );
  });

  it("builds empty referral auth payloads for blank codes", () => {
    expect(buildReferralAuthPayload({
      referralCode: " ",
      origin: "manual",
      landingPath: "/marketplace",
      isMobileWalletFlow: false
    })).toEqual({
      normalizedReferralCode: "",
      referralSource: undefined,
      referralMetadata: undefined
    });
  });

  it("builds manual referral auth payloads", () => {
    expect(buildReferralAuthPayload({
      referralCode: " ref-123 ",
      origin: "manual",
      landingPath: "/marketplace?ref=ref-123",
      isMobileWalletFlow: false
    })).toEqual({
      normalizedReferralCode: "REF-123",
      referralSource: "manual",
      referralMetadata: {
        landingPath: "/marketplace?ref=ref-123",
        captureOrigin: "manual",
        inferredSource: "manual"
      }
    });
  });

  it("builds deep-link attribution for auto mobile wallet flows", () => {
    expect(buildReferralAuthPayload({
      referralCode: " auto-123 ",
      origin: "auto",
      landingPath: "/?ref=auto-123",
      isMobileWalletFlow: true
    })).toEqual({
      normalizedReferralCode: "AUTO-123",
      referralSource: "deep_link",
      referralMetadata: {
        landingPath: "/?ref=auto-123",
        captureOrigin: "auto",
        inferredSource: "deep_link"
      }
    });
  });
});
