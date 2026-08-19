// @vitest-environment jsdom
/**
 * TDD — RED → GREEN
 * Tests for useAuthSync hook.
 * @spec BRI-154 § Auth Sync — cross-tab synchronisation
 */

import { expect, it, vi, beforeEach, type Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useAuthSync } from "../../apps/web/src/features/shared/auth/application/use-auth-sync";

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockFetchAuthMe = vi.fn();

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
  fetchAuthMe: (...args: unknown[]) => mockFetchAuthMe(...args),
}));

vi.mock("../../apps/web/src/lib/auth-sync", () => ({
  AUTH_SYNC_STORAGE_KEY: "auth_sync",
  broadcastAuthSync: vi.fn(),
  createAuthSyncBroadcastChannel: vi.fn(() => null),
  parseAuthSyncPayload: vi.fn((v: unknown) => (v === "valid" ? { type: "login" } : null)),
  parseAuthSyncPayloadFromUnknown: vi.fn((v: unknown) => (v === "valid" ? { type: "login" } : null)),
}));

vi.mock("../../apps/web/src/features/shared/auth/domain/auth-state", () => ({
  areAuthMeResponsesEquivalent: vi.fn((a: unknown, b: unknown) => a === b),
}));

vi.mock("../../apps/web/src/features/navigation/application/nav-modal-utils", () => ({
  getFriendlyWalletErrorMessage: vi.fn((_err: unknown, _t: unknown) => "Friendly error"),
}));

vi.mock("../../apps/web/src/features/navigation/domain/nav-modal-types", () => ({}));

type TestAuthState = {
  authenticated: boolean;
  pubkey: string | null;
};

const ANON: TestAuthState = {
  authenticated: false,
  pubkey: null,
};

const AUTHED: TestAuthState = {
  authenticated: true,
  pubkey: "SomePublicKey1234",
};

const t = (text: { en: string }) => text.en;

function makeParams(overrides = {}) {
  return {
    initialAuth: ANON,
    isOpen: false,
    t,
    ...overrides,
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchAuthMe.mockResolvedValue(AUTHED);
});

it("given_initialAuth_changes_then_authState_updates", async () => {
  const { result, rerender } = renderHook(
    (props: { initialAuth: TestAuthState }) =>
      useAuthSync({ ...makeParams(), initialAuth: props.initialAuth as never }),
    { initialProps: { initialAuth: ANON } }
  );

  expect(result.current.authState).toEqual(ANON);

  rerender({ initialAuth: AUTHED });

  expect(result.current.authState).toEqual(AUTHED);
});

it("given_refreshAuthState_called_then_fetchAuthMe_called", async () => {
  mockFetchAuthMe.mockResolvedValue(AUTHED);

  const { result } = renderHook(() => useAuthSync(makeParams()));

  await act(async () => {
    await result.current.refreshAuthState();
  });

  expect(mockFetchAuthMe).toHaveBeenCalled();
});

it("given_refreshAuthState_deduplicates_concurrent_calls", async () => {
  let resolveFirst!: () => void;
  const firstPromise = new Promise<typeof AUTHED>((resolve) => {
    resolveFirst = () => resolve(AUTHED);
  });
  mockFetchAuthMe.mockReturnValueOnce(firstPromise);

  const { result } = renderHook(() => useAuthSync(makeParams()));

  // Fire two concurrent calls without awaiting
  let call1Done = false;
  let call2Done = false;

  act(() => {
    void result.current.refreshAuthState().then(() => { call1Done = true; });
    void result.current.refreshAuthState().then(() => { call2Done = true; });
  });

  // Only one fetchAuthMe should have been called so far
  expect(mockFetchAuthMe).toHaveBeenCalledTimes(1);

  await act(async () => {
    resolveFirst();
    await Promise.resolve();
  });

  expect(call1Done).toBe(true);
  expect(call2Done).toBe(true);
  // Still only one call
  expect(mockFetchAuthMe).toHaveBeenCalledTimes(1);
});

it("given_auth_sync_storage_event_then_refreshes_silently", async () => {
  const { parseAuthSyncPayload } = await import("../../apps/web/src/lib/auth-sync");
  (parseAuthSyncPayload as Mock).mockReturnValue({ type: "login" });

  mockFetchAuthMe.mockResolvedValue(AUTHED);

  renderHook(() => useAuthSync(makeParams({ isOpen: false })));

  // Wait for mount effects
  await act(async () => { await Promise.resolve(); });

  const callsBefore = (mockFetchAuthMe as Mock).mock.calls.length;

  await act(async () => {
    window.dispatchEvent(
      new StorageEvent("storage", { key: "auth_sync", newValue: "valid" })
    );
    await Promise.resolve();
  });

  expect((mockFetchAuthMe as Mock).mock.calls.length).toBeGreaterThan(callsBefore);
});

it("given_silent_refresh_then_no_lastError_set", async () => {
  mockFetchAuthMe.mockRejectedValueOnce(new Error("network error"));

  const { result } = renderHook(() => useAuthSync(makeParams()));

  await act(async () => {
    await result.current.refreshAuthState({ silent: true });
  });

  // silent=true means lastError must NOT be set
  expect(result.current.lastError).toBeNull();
});
