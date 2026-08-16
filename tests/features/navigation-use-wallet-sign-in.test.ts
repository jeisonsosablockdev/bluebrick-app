// @vitest-environment jsdom
/**
 * TDD Primal — RED Phase
 * @spec BRI-154 § 7 Login Resolution Decision — Post-Auth Navigation
 * @spec BRI-154 § 4 Identity Linking — Wallet Link vs Sign-In endpoints
 */

import { describe, expect, it, vi, beforeEach, type Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useWalletSignIn } from "../../apps/web/src/features/shared/auth/application/use-wallet-sign-in";
import { ANONYMOUS_AUTH_STATE } from "../../apps/web/src/lib/auth-client";

const mockRouterPush = vi.fn();
const mockRouterRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush, refresh: mockRouterRefresh }),
}));

vi.mock("../../apps/web/src/lib/auth-client", () => ({
  startSiws: vi.fn(),
  fetchAuthMe: vi.fn(),
  persistReferralIntent: vi.fn().mockResolvedValue(undefined),
  ANONYMOUS_AUTH_STATE: {
    authenticated: false, accountAuthenticated: false, federatedAuthenticated: false,
    walletAuthenticated: false, pubkey: null, email: null, accountId: null,
    workosUserId: null, role: null, federatedAvailable: false, sessionConflict: false, authMethod: "anonymous",
  },
}));

vi.mock("../../apps/web/src/lib/auth-sync", () => ({
  broadcastAuthSync: vi.fn(),
  createAuthSyncBroadcastChannel: vi.fn(() => null),
  parseAuthSyncPayload: vi.fn(() => null),
  parseAuthSyncPayloadFromUnknown: vi.fn(() => null),
  AUTH_SYNC_STORAGE_KEY: "auth_sync",
}));

vi.mock("../../apps/web/src/features/referral-marketing/application/client-state", () => ({
  buildReferralAuthPayload: vi.fn(() => ({ normalizedReferralCode: "", referralSource: null, referralMetadata: null })),
  clearStoredReferralHint: vi.fn(),
  persistReferralIntent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../../apps/web/src/lib/wallet-signing-prep", () => ({
  resolveWalletSigningPreparation: vi.fn((input) => {
    // already_authenticated: wallet disconnected completely (no active key at all)
    if (!input.activePublicKey && !input.isConnected && !input.hasWalletSession) {
      return { status: "already_authenticated" };
    }
    if (input.hasWalletSessionAdapterMismatch) return { status: "mismatch" };
    // When hasWalletSession=true and connected, proceed to signing prep
    return { status: "ready_to_sign" };
  }),
}));

vi.mock("../../apps/web/src/lib/post-auth-decision", () => ({
  resolvePostAuthDecision: vi.fn((input) => {
    if (input.status === "ok" && input.profile?.onboardingReward && !input.profile?.firstName) {
      return { kind: "show", reward: input.profile.onboardingReward };
    }
    return { kind: "none" };
  }),
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({
    wallet: null, wallets: [], publicKey: { toBase58: () => "ABCDWalletPublicKey1234" },
    connected: true, connecting: false, disconnecting: false,
    connect: vi.fn().mockResolvedValue(undefined), disconnect: vi.fn(),
    select: vi.fn(), signMessage: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
  }),
}));

vi.mock("@solana/wallet-adapter-phantom", () => ({ PhantomWalletName: "Phantom" }));

vi.mock("../../apps/web/src/features/shared/wallet/application/use-wallet-signing-helpers", () => ({
  useWalletSigningHelpers: () => ({
    resolveCurrentWalletPublicKey: () => "ABCDWalletPublicKey1234",
    waitForWalletPublicKey: async () => "ABCDWalletPublicKey1234",
    resolveCurrentSignMessage: () => async (msg: Uint8Array) => msg,
    waitForSignMessage: async () => async (msg: Uint8Array) => msg,
  }),
}));

import { startSiws } from "../../apps/web/src/lib/auth-client";
const mockStartSiws = startSiws as Mock;

function makeSuccessfulSiwsResult(overrides = {}) {
  return { isNewUser: false, publicKey: "ABCDWalletPublicKey1234", referralBindingOutcome: null, ...overrides };
}

function makeParams(overrides: Record<string, unknown> = {}) {
  return {
    authState: ANONYMOUS_AUTH_STATE,
    isPhantomInstalled: true,
    hasFederatedSession: false,
    hasWalletSession: false,
    hasWalletSessionAdapterMismatch: false,
    referralCode: "",
    referralOrigin: "auto" as const,
    currentLandingPath: "/",
    isMobileUserAgent: false,
    isInPhantomApp: false,
    signInStatement: "Sign this message to authenticate.",
    walletLinkStatement: "Sign this message to link your wallet.",
    t: (text: { en: string }) => text.en,
    setPhase: vi.fn(),
    setLastError: vi.fn(),
    setIsOpen: vi.fn(),
    setPostAuthDecisionReward: vi.fn(),
    setAuthState: vi.fn(),
    setSuppressedWalletPublicKey: vi.fn(),
    setHasWalletAuthIntent: vi.fn(),
    refreshAuthState: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("useWalletSignIn — post-auth navigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ data: { firstName: "Juan", email: "juan@brids.io", phone: "+57300000000", onboardingReward: null } }),
    });
  });

  it("given_walletSignIn_succeeds_new_user_then_navigates_to_profile", async () => {
    // @spec BRI-154 § 7 — Nuevo usuario debe ir a /profile, no a /protected
    mockStartSiws.mockResolvedValueOnce(makeSuccessfulSiwsResult({ isNewUser: true }));
    const { result } = renderHook(() => useWalletSignIn(makeParams()));
    await act(async () => { await result.current.handleWalletPrimaryAction(); });
    expect(mockRouterPush).toHaveBeenCalledWith("/profile");
    expect(mockRouterPush).not.toHaveBeenCalledWith("/protected");
  });

  it("given_walletSignIn_succeeds_returning_user_then_navigates_to_profile", async () => {
    // @spec BRI-154 § 7 — Usuario existente debe ir a /profile
    mockStartSiws.mockResolvedValueOnce(makeSuccessfulSiwsResult({ isNewUser: false }));
    const { result } = renderHook(() => useWalletSignIn(makeParams()));
    await act(async () => { await result.current.handleWalletPrimaryAction(); });
    expect(mockRouterPush).toHaveBeenCalledWith("/profile");
  });

  it("given_postAuthDecision_show_then_sets_reward_and_does_not_navigate", async () => {
    // @spec BRI-154 § 7 — Perfil incompleto con reward: muestra modal sin navegar
    mockStartSiws.mockResolvedValueOnce(makeSuccessfulSiwsResult());
    const reward = { status: "pending_profile", rewardAmountUsdSnapshot: 10, qualificationDeadlineAt: new Date().toISOString(), shouldShowReminder: true, isProfileComplete: false };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ data: { firstName: null, email: null, phone: null, onboardingReward: reward } }),
    });
    const mockSetReward = vi.fn();
    const { result } = renderHook(() => useWalletSignIn(makeParams({ setPostAuthDecisionReward: mockSetReward })));
    await act(async () => { await result.current.handleWalletPrimaryAction(); });
    expect(mockSetReward).toHaveBeenCalled();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("given_federated_session_active_then_uses_link_wallet_endpoint", async () => {
    // @spec BRI-154 § 4 — Sesión federada activa: usa endpoint de link
    mockStartSiws.mockResolvedValueOnce(makeSuccessfulSiwsResult());
    const { result } = renderHook(() => useWalletSignIn(makeParams({ hasFederatedSession: true })));
    await act(async () => { await result.current.handleWalletPrimaryAction(); });
    expect(mockStartSiws).toHaveBeenCalledWith(expect.objectContaining({ verifyPath: "/api/auth/link/wallet/verify" }));
    expect(mockStartSiws).not.toHaveBeenCalledWith(expect.objectContaining({ verifyPath: "/api/auth/verify" }));
  });
});

describe("useWalletSignIn — error handling", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("given_phantom_not_installed_then_setLastError_called_with_friendly_message", async () => {
    // @spec BRI-154 § UX — Phantom no instalado: error amigable
    const mockSetLastError = vi.fn();
    const { result } = renderHook(() => useWalletSignIn(makeParams({ isPhantomInstalled: false, setLastError: mockSetLastError })));
    await act(async () => { await result.current.handleWalletPrimaryAction(); });
    expect(mockSetLastError).toHaveBeenCalledWith(expect.stringMatching(/[Pp]hantom/));
    expect(mockRouterPush).not.toHaveBeenCalled();
  });

  it("given_already_authenticated_wallet_then_closes_modal_without_signing", async () => {
    // @spec BRI-154 § 5 — Wallet ya autenticada: cierra modal sin firmar
    const mockSetIsOpen = vi.fn();
    const { result } = renderHook(() =>
      useWalletSignIn(makeParams({
        hasWalletSession: true,
        setIsOpen: mockSetIsOpen,
        authState: { ...ANONYMOUS_AUTH_STATE, authenticated: true, walletAuthenticated: true, pubkey: "ABCDWalletPublicKey1234" },
      }))
    );
    await act(async () => { await result.current.handleWalletPrimaryAction(); });
    expect(mockStartSiws).not.toHaveBeenCalled();
    expect(mockSetIsOpen).toHaveBeenCalledWith(false);
  });
});
