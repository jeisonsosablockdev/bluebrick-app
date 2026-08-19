// @vitest-environment jsdom
/**
 * TDD — navigation-use-nav-modal-visibility
 * @spec BRI-154 § Nav Modal Visibility Hook
 */

import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { useNavModalVisibility } from "../../apps/web/src/features/navigation/application/use-nav-modal-visibility";
import type { UseNavModalVisibilityParams } from "../../apps/web/src/features/navigation/application/use-nav-modal-visibility";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
vi.mock("../../apps/web/src/lib/auth-link-status", () => ({
  getAuthLinkStatusContent: vi.fn(() => null),
}));

vi.mock("../../apps/web/src/features/navigation/application/nav-modal-utils", () => ({
  getStatusText: vi.fn(() => null),
  getWalletIntentPrimaryLabel: vi.fn(() => "Connect Phantom"),
  truncatePublicKey: vi.fn((k: string) => `${k.slice(0, 4)}...${k.slice(-4)}`),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const identity = (text: { en: string }): string => text.en;

function makeParams(overrides: Partial<UseNavModalVisibilityParams> = {}): UseNavModalVisibilityParams {
  return {
    authState: {
      authenticated: false,
      pubkey: null,
      federatedAvailable: true,
    },
    phase: "idle",
    connected: false,
    walletPublicKey: null,
    connecting: false,
    disconnecting: false,
    hasWalletAuthIntent: false,
    suppressedWalletPublicKey: null,
    statusText: null,
    lastError: null,
    authLinkStatus: null,
    t: identity,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("useNavModalVisibility", () => {
  it("given_no_session_then_shouldShowAnonymousAuthEntry_true", () => {
    const { result } = renderHook(() => useNavModalVisibility(makeParams()));

    expect(result.current.shouldShowAnonymousAuthEntry).toBe(true);
  });

  it("given_wallet_session_then_shouldShowWalletIntentCard_true", () => {
    const { result } = renderHook(() =>
      useNavModalVisibility(
        makeParams({
          authState: {
            authenticated: true,
            pubkey: "AAAA1111BBBB2222",
            walletAuthenticated: true,
            federatedAvailable: true,
          },
        })
      )
    );

    expect(result.current.hasWalletSession).toBe(true);
    expect(result.current.shouldShowWalletIntentCard).toBe(true);
  });

  it("given_federated_session_then_shouldShowDirectAuthEntry_false", () => {
    const { result } = renderHook(() =>
      useNavModalVisibility(
        makeParams({
          authState: {
            authenticated: true,
            pubkey: null,
            federatedAuthenticated: true,
            federatedAvailable: true,
          },
        })
      )
    );

    expect(result.current.hasFederatedSession).toBe(true);
    expect(result.current.shouldShowDirectAuthEntryActions).toBe(false);
  });

  it("given_admin_role_then_menuEntries_includes_dashboard", () => {
    const { result } = renderHook(() =>
      useNavModalVisibility(
        makeParams({
          authState: {
            authenticated: true,
            pubkey: "AAAA1111BBBB2222",
            walletAuthenticated: true,
            accountAuthenticated: true,
            federatedAvailable: true,
            role: "admin",
          },
        })
      )
    );

    const hrefs = result.current.menuEntries.map((e) => e.href);
    expect(hrefs).toContain("/admin");
  });

  it("given_wallet_session_then_headerWalletCtaLabel_is_Wallet", () => {
    const { result } = renderHook(() =>
      useNavModalVisibility(
        makeParams({
          authState: {
            authenticated: true,
            pubkey: "AAAA1111BBBB2222",
            walletAuthenticated: true,
            federatedAvailable: true,
          },
        })
      )
    );

    expect(result.current.headerWalletCtaLabel).toBe("Wallet");
  });
});
