// @vitest-environment jsdom
/**
 * TDD — RED → GREEN
 * Tests for useWalletDisconnect hook.
 * @spec BRI-154 § Disconnect — wallet disconnect + logout flow
 */

import { expect, it, vi, beforeEach, type Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useWalletDisconnect } from "../../apps/web/src/features/shared/auth/application/use-wallet-disconnect";
import { ANONYMOUS_AUTH_STATE } from "../../apps/web/src/lib/auth-client";

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockRouterPush = vi.fn();
const mockRouterRefresh = vi.fn();
let mockCurrentPathname = "/";
const mockDisconnect = vi.fn().mockResolvedValue(undefined);
const mockBroadcastAuthSync = vi.fn();
const mockResolveCurrentWalletPublicKey = vi.fn(() => "TestPubKey123");

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush, refresh: mockRouterRefresh }),
  usePathname: () => mockCurrentPathname,
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({
    connected: true,
    disconnect: mockDisconnect,
  }),
}));

vi.mock("../../apps/web/src/lib/auth-client", () => ({
  ANONYMOUS_AUTH_STATE: {
    authenticated: false,
    pubkey: null,
    accountAuthenticated: false,
    federatedAuthenticated: false,
    walletAuthenticated: false,
    authMethod: "anonymous",
    accountId: null,
    workosUserId: null,
    email: null,
    federatedAvailable: false,
    sessionConflict: false,
    role: null,
  },
  fetchAuthMe: vi.fn(),
}));

vi.mock("../../apps/web/src/lib/auth-sync", () => ({
  AUTH_SYNC_STORAGE_KEY: "auth_sync",
  broadcastAuthSync: (...args: unknown[]) => mockBroadcastAuthSync(...args),
  createAuthSyncBroadcastChannel: vi.fn(() => null),
  parseAuthSyncPayload: vi.fn(),
  parseAuthSyncPayloadFromUnknown: vi.fn(),
}));

vi.mock("../../apps/web/src/lib/navigation/private-routes", () => ({
  POST_LOGOUT_PUBLIC_HREF: "/",
  shouldRedirectToPublicAfterLogout: vi.fn((pathname: string) =>
    ["/admin", "/protected", "/checkout"].some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ),
}));

vi.mock("../../apps/web/src/features/navigation/application/nav-modal-utils", () => ({
  getFriendlyWalletErrorMessage: vi.fn((_err: unknown, _t: unknown) => "Friendly error"),
}));

vi.mock("../../apps/web/src/features/shared/wallet/application/use-wallet-signing-helpers", () => ({
  useWalletSigningHelpers: () => ({
    resolveCurrentWalletPublicKey: mockResolveCurrentWalletPublicKey,
    waitForWalletPublicKey: async () => "TestPubKey123",
    waitForSignMessage: async () => null,
  }),
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const t = (text: { en: string }) => text.en;

function makeParams(overrides: Record<string, unknown> = {}) {
  return {
    authState: ANONYMOUS_AUTH_STATE,
    hasFederatedSession: false,
    hasWalletSession: false,
    walletPublicKey: "TestPubKey123",
    t,
    setPhase: vi.fn(),
    setLastError: vi.fn(),
    setIsOpen: vi.fn(),
    setAuthState: vi.fn(),
    setSuppressedWalletPublicKey: vi.fn(),
    refreshAuthState: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockDisconnect.mockResolvedValue(undefined);
  global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
});

it("given_disconnect_called_then_calls_logout_api", async () => {
  const { result } = renderHook(() => useWalletDisconnect(makeParams()));

  await act(async () => {
    await result.current.handleDisconnect();
  });

  expect(global.fetch).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
});

it("given_federated_session_then_redirects_to_sign_out", async () => {
  const assignSpy = vi.fn();
  Object.defineProperty(window, "location", {
    value: { assign: assignSpy },
    writable: true,
  });

  const { result } = renderHook(() =>
    useWalletDisconnect(makeParams({ hasFederatedSession: true }))
  );

  await act(async () => {
    await result.current.handleDisconnect();
  });

  expect(assignSpy).toHaveBeenCalledWith(
    expect.stringContaining("/sign-out?returnTo=")
  );
});

it("given_wallet_only_session_then_broadcasts_logout", async () => {
  const { result } = renderHook(() =>
    useWalletDisconnect(makeParams({ hasFederatedSession: false }))
  );

  await act(async () => {
    await result.current.handleDisconnect();
  });

  expect(mockBroadcastAuthSync).toHaveBeenCalledWith("logout", "TestPubKey123");
});

it("given_should_redirect_after_logout_then_assigns_public_href", async () => {
  mockCurrentPathname = "/admin/dashboard";

  const { result } = renderHook(() =>
    useWalletDisconnect(makeParams({ hasFederatedSession: false }))
  );

  await act(async () => {
    await result.current.handleDisconnect();
  });

  // On non-federated + private path → router.push("/")
  expect(mockRouterPush).toHaveBeenCalledWith("/");
});
