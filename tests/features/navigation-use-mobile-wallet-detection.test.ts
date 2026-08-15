// @vitest-environment jsdom
/**
 * TDD — navigation-use-mobile-wallet-detection
 * @spec BRI-154 § Mobile Wallet Detection Hook
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

import { useMobileWalletDetection } from "../../apps/web/src/features/navigation/application/use-mobile-wallet-detection";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock("../../apps/web/src/lib/referrals/client-state", () => ({
  buildPhantomBrowseDeepLink: vi.fn((url: string) => `https://phantom.app/ul/browse/${encodeURIComponent(url)}`),
}));

vi.mock("../../apps/web/src/features/navigation/domain/nav-modal-constants", () => ({
  MOBILE_MEDIA_QUERY: "(max-width: 639px)",
  MOBILE_USER_AGENT_PATTERN: /android|iphone|ipad|ipod|mobile/i,
  PHANTOM_USER_AGENT_PATTERN: /phantom/i,
}));

// ---------------------------------------------------------------------------
// Helpers to override jsdom window.matchMedia
// ---------------------------------------------------------------------------
function mockMatchMedia(matches: boolean): void {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("useMobileWalletDetection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: desktop, non-mobile UA, no phantom
    mockMatchMedia(false);
    Object.defineProperty(window.navigator, "userAgent", {
      writable: true,
      value: "Mozilla/5.0 (Macintosh) Chrome/120",
    });
    // Remove phantom provider
    Object.defineProperty(window, "phantom", { writable: true, value: undefined });
  });

  it("given_mobile_user_agent_then_isMobileUserAgent_true", () => {
    Object.defineProperty(window.navigator, "userAgent", {
      writable: true,
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17) Mobile/15E148",
    });

    const { result } = renderHook(() => useMobileWalletDetection());
    expect(result.current.isMobileUserAgent).toBe(true);
  });

  it("given_phantom_provider_then_isInPhantomApp_true", () => {
    Object.defineProperty(window, "phantom", {
      writable: true,
      value: { solana: { isPhantom: true } },
    });

    const { result } = renderHook(() => useMobileWalletDetection());
    expect(result.current.isInPhantomApp).toBe(true);
  });

  it("given_not_small_viewport_then_shouldShowPhantomOpenPill_false", () => {
    // viewport is NOT small (matches: false), mobile UA: true
    Object.defineProperty(window.navigator, "userAgent", {
      writable: true,
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17) Mobile/15E148",
    });
    mockMatchMedia(false);

    const { result } = renderHook(() => useMobileWalletDetection());
    expect(result.current.shouldShowPhantomOpenPill).toBe(false);
  });

  it("given_small_viewport_mobile_ua_not_in_phantom_then_shouldShowPhantomOpenPill_true", () => {
    mockMatchMedia(true);
    Object.defineProperty(window.navigator, "userAgent", {
      writable: true,
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17) Mobile/15E148",
    });
    Object.defineProperty(window, "phantom", { writable: true, value: undefined });

    const { result } = renderHook(() => useMobileWalletDetection());
    expect(result.current.shouldShowPhantomOpenPill).toBe(true);
  });
});
