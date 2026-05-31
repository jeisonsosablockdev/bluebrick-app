// @vitest-environment jsdom

import { act, createElement, type ReactNode } from "react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localeMocks = vi.hoisted(() => ({
  useI18n: vi.fn()
}));

const walletMocks = vi.hoisted(() => ({
  useWallet: vi.fn()
}));

const navigationMocks = vi.hoisted(() => ({
  pathname: "/",
  searchParams: new URLSearchParams(),
  push: vi.fn(),
  replace: vi.fn()
}));

const authClientMocks = vi.hoisted(() => ({
  fetchAuthMe: vi.fn(),
  persistReferralIntent: vi.fn(),
  startSiws: vi.fn()
}));

const referralStateMocks = vi.hoisted(() => ({
  buildPhantomBrowseDeepLink: vi.fn(() => "phantom://browse"),
  buildReferralAuthMetadata: vi.fn(() => ({})),
  buildStoredReferralHint: vi.fn(() => null),
  clearStoredReferralHint: vi.fn(),
  deriveReferralAttributionSource: vi.fn(() => "unknown"),
  normalizeReferralCodeInput: vi.fn((value: string) => value),
  readStoredReferralHint: vi.fn(() => null),
  writeStoredReferralHint: vi.fn()
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => createElement("img", props)
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children?: ReactNode; href?: string } & Record<string, unknown>) =>
    createElement("a", { href, ...props }, children)
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMocks.pathname,
  useRouter: () => ({ push: navigationMocks.push, replace: navigationMocks.replace }),
  useSearchParams: () => navigationMocks.searchParams
}));

vi.mock("@/components/i18n/locale-provider", () => ({
  useI18n: localeMocks.useI18n
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: walletMocks.useWallet
}));

vi.mock("@/lib/auth-client", () => ({
  fetchAuthMe: authClientMocks.fetchAuthMe,
  persistReferralIntent: authClientMocks.persistReferralIntent,
  startSiws: authClientMocks.startSiws
}));

vi.mock("@/components/theme/theme-toggle", () => ({
  ThemeToggle: () => createElement("div", null, "theme-toggle")
}));

vi.mock("@/components/i18n/language-switcher", () => ({
  LanguageSwitcher: () => createElement("div", null, "language-switcher")
}));

vi.mock("@/components/onboarding/onboarding-reward-decision-modal", () => ({
  OnboardingRewardDecisionModal: ({
    open,
    walletConnected
  }: {
    open: boolean;
    walletConnected?: boolean;
  }) => open ? createElement("div", { "data-testid": "post-auth-decision" }, walletConnected ? "wallet-decision" : "account-decision") : null
}));

vi.mock("@/lib/referrals/client-state", () => ({
  buildPhantomBrowseDeepLink: referralStateMocks.buildPhantomBrowseDeepLink,
  buildReferralAuthMetadata: referralStateMocks.buildReferralAuthMetadata,
  buildStoredReferralHint: referralStateMocks.buildStoredReferralHint,
  clearStoredReferralHint: referralStateMocks.clearStoredReferralHint,
  deriveReferralAttributionSource: referralStateMocks.deriveReferralAttributionSource,
  normalizeReferralCodeInput: referralStateMocks.normalizeReferralCodeInput,
  readStoredReferralHint: referralStateMocks.readStoredReferralHint,
  writeStoredReferralHint: referralStateMocks.writeStoredReferralHint
}));

vi.mock("@/lib/auth-sync", () => ({
  AUTH_SYNC_STORAGE_KEY: "auth-sync",
  broadcastAuthSync: vi.fn(),
  createAuthSyncBroadcastChannel: vi.fn(() => null),
  parseAuthSyncPayload: vi.fn(() => false),
  parseAuthSyncPayloadFromUnknown: vi.fn(() => false)
}));

vi.mock("@/lib/solana", () => ({
  getWalletModalAutoClose: vi.fn(() => false)
}));

import { WalletModal } from "@/components/WalletModal";
import type { AuthMeResponse } from "@/lib/auth-client";
import { WALLET_MODAL_OPEN_EVENT } from "@/lib/auth-ui-events";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function renderWalletModal(initialAuth: AuthMeResponse = {
  authenticated: false,
  federatedAvailable: true,
  pubkey: null
}): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      createElement(WalletModal, {
        initialAuth
      })
    );
  });

  return { container, root };
}

function findButtonByText(root: ParentNode, text: string): HTMLButtonElement | undefined {
  return Array.from(root.querySelectorAll("button")).find((candidate) =>
    candidate.textContent?.includes(text)
  ) as HTMLButtonElement | undefined;
}

describe("components/WalletModal header CTA", () => {
  beforeEach(() => {
    navigationMocks.pathname = "/";
    navigationMocks.searchParams = new URLSearchParams();
    navigationMocks.push.mockReset();
    navigationMocks.replace.mockReset();
    localeMocks.useI18n.mockReturnValue({
      locale: "es",
      setLocale: vi.fn(),
      t: (text: { es: string }) => text.es
    });

    walletMocks.useWallet.mockReturnValue({
      wallet: null,
      wallets: [],
      publicKey: null,
      connected: false,
      connecting: false,
      disconnecting: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      select: vi.fn(),
      signMessage: undefined
    });

    authClientMocks.fetchAuthMe.mockResolvedValue({
      authenticated: false,
      federatedAvailable: true,
      pubkey: null
    });
    authClientMocks.persistReferralIntent.mockResolvedValue({
      id: "intent_123",
      accountId: "account_123",
      referralCode: "REF123",
      attributionSource: "link",
      capturedAt: "2026-05-10T00:00:00.000Z",
      status: "active",
      metadata: {},
      resolvedAt: null,
      promotedAttributionId: null
    });
    referralStateMocks.readStoredReferralHint.mockReturnValue(null);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          onboardingReward: {
            status: "pending_profile",
            rewardAmountUsdSnapshot: 10,
            qualificationDeadlineAt: "2026-05-17T00:00:00.000Z",
            shouldShowReminder: true,
            isProfileComplete: false
          }
        }
      })
    }));

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    });

    Object.defineProperty(window, "requestAnimationFrame", {
      writable: true,
      value: (callback: FrameRequestCallback) => window.setTimeout(() => callback(0), 0)
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("renders the ingresar CTA with a wallet icon", async () => {
    const { container, root } = renderWalletModal();

    await act(async () => {
      await Promise.resolve();
    });

    const button = findButtonByText(container, "Ingresar");

    expect(button).toBeTruthy();
    expect(button?.textContent).toContain("Ingresar");
    expect(button?.querySelector("svg")).toBeTruthy();

    act(() => {
      root.unmount();
    });
  });

  it("shows direct Mail and Wallet entry actions by default", async () => {
    const { container, root } = renderWalletModal({
      authenticated: false,
      federatedAvailable: true,
      pubkey: null
    });

    await act(async () => {
      await Promise.resolve();
    });

    const openButton = findButtonByText(container, "Ingresar");

    act(() => {
      openButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(document.body.textContent).toContain("Ingresa a tu cuenta BRIDS");
    expect(document.body.textContent).toContain("Mail");
    expect(document.body.textContent).toContain("Wallet");
    expect(document.body.textContent).not.toContain("Continuar con email");
    expect(document.body.textContent).not.toContain("Conectar e iniciar sesion");
    const mailButton = findButtonByText(document.body, "Mail");
    const walletButton = findButtonByText(document.body, "Wallet");
    expect(mailButton?.className).toContain("bg-transparent");
    expect(mailButton?.className).toContain("border-white/25");
    expect(mailButton?.className).toContain("rounded-full");
    expect(mailButton?.className).toContain("active:bg-gradientPrimary");
    expect(walletButton?.className).toContain("bg-transparent");
    expect(walletButton?.className).toContain("border-white/25");
    expect(walletButton?.className).toContain("rounded-full");
    expect(walletButton?.className).toContain("active:bg-gradientPrimary");
    expect(document.body.textContent).not.toContain("Usa WorkOS para empezar con una cuenta por email o conecta Phantom para SIWS.");
    expect(document.body.textContent).not.toContain("Conecta Phantom para continuar con la autenticacion SIWS.");

    act(() => {
      root.unmount();
    });
  });

  it("renders the open dialog outside the page container and focuses without scrolling the page", async () => {
    const focusSpy = vi.spyOn(HTMLElement.prototype, "focus");
    const { container, root } = renderWalletModal({
      authenticated: false,
      federatedAvailable: true,
      pubkey: null
    });

    await act(async () => {
      await Promise.resolve();
    });

    const openButton = findButtonByText(container, "Ingresar");

    act(() => {
      openButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      await Promise.resolve();
    });

    const dialog = document.body.querySelector('[role="dialog"][aria-labelledby="wallet-modal-title"]');

    expect(dialog).toBeTruthy();
    expect(container.contains(dialog)).toBe(false);
    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });

    act(() => {
      root.unmount();
    });

    focusSpy.mockRestore();
  });

  it("keeps the referral input hidden until the user asks for it", async () => {
    const { container, root } = renderWalletModal({
      authenticated: false,
      federatedAvailable: true,
      pubkey: null
    });

    await act(async () => {
      await Promise.resolve();
    });

    const openButton = findButtonByText(container, "Ingresar");

    act(() => {
      openButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(document.body.textContent).not.toContain("Conecta Phantom para continuar con la autenticacion SIWS.");
    expect(document.body.textContent).toContain("Ingresa tu codigo de referido (opcional)");
    expect(document.body.querySelector('input[placeholder="Pega o edita tu codigo de invitacion"]')).toBeNull();

    const referralToggle = findButtonByText(document.body, "Ingresa tu codigo de referido");

    act(() => {
      referralToggle?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(document.body.querySelector('input[placeholder="Pega o edita tu codigo de invitacion"]')).toBeTruthy();

    act(() => {
      root.unmount();
    });
  });

  it("renders wallet after SIWS authentication is already active", async () => {
    authClientMocks.fetchAuthMe.mockResolvedValue({
      authenticated: true,
      pubkey: "Wallet11111111111111111111111111111111111",
      role: "user"
    });

    const { container, root } = renderWalletModal({
      authenticated: true,
      pubkey: "Wallet11111111111111111111111111111111111",
      role: "user"
    });

    await act(async () => {
      await Promise.resolve();
    });

    const button = findButtonByText(container, "Wallet");

    expect(button).toBeTruthy();
    expect(button?.textContent).toContain("Wallet");
    expect(button?.querySelector("svg")).toBeTruthy();

    act(() => {
      root.unmount();
    });
  });

  it("allows reconnecting Phantom when SIWS is active but the adapter is disconnected", async () => {
    const connect = vi.fn(async () => undefined);
    const select = vi.fn();
    const phantomAdapter = {
      name: "Phantom",
      readyState: WalletReadyState.Installed,
      publicKey: {
        toBase58: () => "Wallet11111111111111111111111111111111111"
      },
      signMessage: vi.fn()
    };

    walletMocks.useWallet.mockReturnValue({
      wallet: { adapter: phantomAdapter },
      wallets: [{ adapter: phantomAdapter, readyState: WalletReadyState.Installed }],
      publicKey: null,
      connected: false,
      connecting: false,
      disconnecting: false,
      connect,
      disconnect: vi.fn(),
      select,
      signMessage: undefined
    });
    authClientMocks.fetchAuthMe.mockResolvedValue({
      authenticated: true,
      accountAuthenticated: true,
      walletAuthenticated: true,
      federatedAuthenticated: false,
      federatedAvailable: false,
      authMethod: "wallet",
      accountId: "account_123",
      workosUserId: null,
      email: null,
      pubkey: "Wallet11111111111111111111111111111111111",
      role: "admin"
    });

    const { container, root } = renderWalletModal({
      authenticated: true,
      accountAuthenticated: true,
      walletAuthenticated: true,
      federatedAuthenticated: false,
      federatedAvailable: false,
      authMethod: "wallet",
      accountId: "account_123",
      workosUserId: null,
      email: null,
      pubkey: "Wallet11111111111111111111111111111111111",
      role: "admin"
    });

    await act(async () => {
      await Promise.resolve();
    });

    const openButton = findButtonByText(container, "Wallet");

    act(() => {
      openButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      await Promise.resolve();
    });

    const reconnectButton = findButtonByText(document.body, "Reconectar wallet");

    expect(reconnectButton).toBeTruthy();
    expect((reconnectButton as HTMLButtonElement | undefined)?.disabled).toBe(false);

    await act(async () => {
      reconnectButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(connect).toHaveBeenCalledTimes(1);
    expect(select).not.toHaveBeenCalled();
    expect(authClientMocks.startSiws).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });

  it("shows a pending sign-in state when the wallet adapter is connected without a SIWS session", async () => {
    const signMessage = vi.fn();
    const phantomAdapter = {
      name: "Phantom",
      readyState: WalletReadyState.Installed,
      publicKey: {
        toBase58: () => "Wallet11111111111111111111111111111111111"
      },
      signMessage
    };

    walletMocks.useWallet.mockReturnValue({
      wallet: { adapter: phantomAdapter },
      wallets: [{ adapter: phantomAdapter, readyState: WalletReadyState.Installed }],
      publicKey: {
        toBase58: () => "Wallet11111111111111111111111111111111111"
      },
      connected: true,
      connecting: false,
      disconnecting: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      select: vi.fn(),
      signMessage
    });

    const { container, root } = renderWalletModal({
      authenticated: false,
      federatedAvailable: true,
      pubkey: null
    });

    await act(async () => {
      await Promise.resolve();
    });

    const openButton = findButtonByText(container, "Ingresar");

    act(() => {
      openButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(document.body.textContent).not.toContain("Ingresa a tu cuenta BRIDS");
    expect(document.body.textContent).not.toContain("Mail");
    expect(document.body.textContent).toContain("Conectada");
    expect(document.body.textContent).toContain("Iniciar sesion");
    expect(document.body.textContent).toContain("Cerrar sesion y desconectar wallet");

    act(() => {
      root.unmount();
    });
  });

  it("renders an authenticated wallet session as neutral status instead of a primary signed-in action", async () => {
    const phantomAdapter = {
      name: "Phantom",
      readyState: WalletReadyState.Installed,
      publicKey: {
        toBase58: () => "Wallet11111111111111111111111111111111111"
      },
      signMessage: vi.fn()
    };

    walletMocks.useWallet.mockReturnValue({
      wallet: { adapter: phantomAdapter },
      wallets: [{ adapter: phantomAdapter, readyState: WalletReadyState.Installed }],
      publicKey: {
        toBase58: () => "Wallet11111111111111111111111111111111111"
      },
      connected: true,
      connecting: false,
      disconnecting: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      select: vi.fn(),
      signMessage: vi.fn()
    });
    authClientMocks.fetchAuthMe.mockResolvedValue({
      authenticated: true,
      accountAuthenticated: true,
      walletAuthenticated: true,
      federatedAuthenticated: false,
      federatedAvailable: true,
      authMethod: "wallet",
      accountId: "account_123",
      workosUserId: null,
      email: null,
      pubkey: "Wallet11111111111111111111111111111111111",
      role: "user"
    });

    const { container, root } = renderWalletModal({
      authenticated: true,
      accountAuthenticated: true,
      walletAuthenticated: true,
      federatedAuthenticated: false,
      federatedAvailable: true,
      authMethod: "wallet",
      accountId: "account_123",
      workosUserId: null,
      email: null,
      pubkey: "Wallet11111111111111111111111111111111111",
      role: "user"
    });

    await act(async () => {
      await Promise.resolve();
    });

    const openButton = findButtonByText(container, "Wallet");

    act(() => {
      openButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(document.body.textContent).toContain("Sesion wallet activa");
    expect(document.body.textContent).not.toContain("Sesion iniciada");
    expect(findButtonByText(document.body, "Sesion iniciada")).toBeUndefined();
    expect(document.body.textContent).toContain("Cerrar sesion y desconectar wallet");
    expect(document.body.textContent).toContain("Copiar direccion");

    act(() => {
      root.unmount();
    });
  });

  it("disconnects the wallet adapter during sign out when an adapter public key is present", async () => {
    const disconnect = vi.fn(async () => undefined);
    const phantomAdapter = {
      name: "Phantom",
      readyState: WalletReadyState.Installed,
      publicKey: {
        toBase58: () => "Wallet11111111111111111111111111111111111"
      },
      signMessage: vi.fn()
    };

    walletMocks.useWallet.mockReturnValue({
      wallet: { adapter: phantomAdapter },
      wallets: [{ adapter: phantomAdapter, readyState: WalletReadyState.Installed }],
      publicKey: null,
      connected: false,
      connecting: false,
      disconnecting: false,
      connect: vi.fn(),
      disconnect,
      select: vi.fn(),
      signMessage: undefined
    });
    authClientMocks.fetchAuthMe.mockResolvedValue({
      authenticated: true,
      accountAuthenticated: true,
      walletAuthenticated: true,
      federatedAuthenticated: false,
      federatedAvailable: false,
      authMethod: "wallet",
      accountId: "account_123",
      workosUserId: null,
      email: null,
      pubkey: "Wallet11111111111111111111111111111111111",
      role: "user"
    });

    const { container, root } = renderWalletModal({
      authenticated: true,
      accountAuthenticated: true,
      walletAuthenticated: true,
      federatedAuthenticated: false,
      federatedAvailable: false,
      authMethod: "wallet",
      accountId: "account_123",
      workosUserId: null,
      email: null,
      pubkey: "Wallet11111111111111111111111111111111111",
      role: "user"
    });

    await act(async () => {
      await Promise.resolve();
    });

    const openButton = findButtonByText(container, "Wallet");

    act(() => {
      openButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      await Promise.resolve();
    });

    const signOutButton = findButtonByText(document.body, "Cerrar sesion y desconectar wallet");

    await act(async () => {
      signOutButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
    expect(document.body.textContent).not.toContain("Reconectar wallet");

    act(() => {
      root.unmount();
    });
  });

  it("hides federated login when WorkOS is unavailable", async () => {
    authClientMocks.fetchAuthMe.mockResolvedValue({
      authenticated: false,
      federatedAvailable: false,
      pubkey: null
    });

    const { container, root } = renderWalletModal({
      authenticated: false,
      federatedAvailable: false,
      pubkey: null
    });

    await act(async () => {
      await Promise.resolve();
    });

    const openButton = findButtonByText(container, "Ingresar");

    expect(openButton).toBeTruthy();

    act(() => {
      openButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(document.body.textContent).not.toContain("Continuar con email");
    expect(document.body.textContent).not.toContain("Mail");
    expect(document.body.textContent).not.toContain("Ingresa a tu cuenta BRIDS");

    act(() => {
      root.unmount();
    });
  });

  it("does not show disconnect or copy address when there is no active session or wallet", async () => {
    const { container, root } = renderWalletModal({
      authenticated: false,
      federatedAvailable: true,
      pubkey: null
    });

    await act(async () => {
      await Promise.resolve();
    });

    const openButton = findButtonByText(container, "Ingresar");

    act(() => {
      openButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      await Promise.resolve();
    });

    const walletTab = findButtonByText(document.body, "Wallet");

    act(() => {
      walletTab?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(document.body.textContent).not.toContain("Copiar direccion");
    expect(document.body.textContent).not.toContain("Cerrar sesion y desconectar wallet");
    expect(document.body.textContent).not.toContain("Desconectar wallet");

    act(() => {
      root.unmount();
    });
  });

  it("persists a stored referral hint after federated login without a wallet session", async () => {
    referralStateMocks.readStoredReferralHint.mockImplementation((() => ({
      referralCode: "REF123",
      origin: "manual",
      landingPath: "/marketplace",
      capturedAt: "2026-05-10T00:00:00.000Z"
    })) as never);
    referralStateMocks.deriveReferralAttributionSource.mockReturnValue("manual");

    const { root } = renderWalletModal({
      authenticated: false,
      federatedAvailable: true,
      accountAuthenticated: true,
      federatedAuthenticated: true,
      walletAuthenticated: false,
      accountId: "account_123",
      workosUserId: "user_123",
      email: "user@example.com",
      pubkey: null,
      authMethod: "federated"
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(authClientMocks.persistReferralIntent).toHaveBeenCalledWith({
      referralCode: "REF123",
      attributionSource: "manual",
      capturedAt: "2026-05-10T00:00:00.000Z",
      metadata: {}
    });
    expect(referralStateMocks.clearStoredReferralHint).toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });

  it("does not persist the same stored referral hint twice across rerenders", async () => {
    referralStateMocks.readStoredReferralHint.mockImplementation((() => ({
      referralCode: "REF123",
      origin: "manual",
      landingPath: "/marketplace",
      capturedAt: "2026-05-10T00:00:00.000Z"
    })) as never);
    referralStateMocks.deriveReferralAttributionSource.mockReturnValue("manual");

    const { root } = renderWalletModal({
      authenticated: false,
      federatedAvailable: true,
      accountAuthenticated: true,
      federatedAuthenticated: true,
      walletAuthenticated: false,
      accountId: "account_123",
      workosUserId: "user_123",
      email: "user@example.com",
      pubkey: null,
      authMethod: "federated"
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(authClientMocks.persistReferralIntent).toHaveBeenCalledTimes(1);

    act(() => {
      root.render(
        createElement(WalletModal, {
          initialAuth: {
            authenticated: false,
            federatedAvailable: true,
            accountAuthenticated: true,
            federatedAuthenticated: true,
            walletAuthenticated: false,
            accountId: "account_123",
            workosUserId: "user_123",
            email: "user@example.com",
            pubkey: null,
            authMethod: "federated"
          }
        })
      );
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(authClientMocks.persistReferralIntent).toHaveBeenCalledTimes(1);

    act(() => {
      root.unmount();
    });
  });

  it("opens the post-auth decision modal after returning from federated login without a wallet", async () => {
    navigationMocks.searchParams = new URLSearchParams("postAuthDecision=1");

    const { container, root } = renderWalletModal({
      authenticated: false,
      federatedAvailable: true,
      accountAuthenticated: true,
      federatedAuthenticated: true,
      walletAuthenticated: false,
      accountId: "account_123",
      workosUserId: "user_123",
      email: "user@example.com",
      pubkey: null,
      authMethod: "federated"
    });

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.querySelector('[data-testid="post-auth-decision"]')?.textContent).toBe("account-decision");

    act(() => {
      root.unmount();
    });
  });

  it("opens directly in wallet mode when triggered externally from profile support", async () => {
    const { container, root } = renderWalletModal({
      authenticated: false,
      federatedAvailable: true,
      pubkey: null
    });

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      window.dispatchEvent(new CustomEvent(WALLET_MODAL_OPEN_EVENT, {
        detail: { loginMethod: "wallet" }
      }));
    });

    await act(async () => {
      await Promise.resolve();
    });

    expect(document.body.textContent).toContain("Ingresa tu codigo de referido (opcional)");
    expect(document.body.textContent).not.toContain("Continuar con email");

    act(() => {
      root.unmount();
    });
  });

  it("keeps the primary navigation buttons at a stable desktop width", async () => {
    authClientMocks.fetchAuthMe.mockResolvedValue({
      authenticated: true,
      accountAuthenticated: true,
      federatedAuthenticated: false,
      federatedAvailable: false,
      walletAuthenticated: true,
      authMethod: "wallet",
      accountId: "account_123",
      email: null,
      pubkey: "So11111111111111111111111111111111111111112",
      role: "admin"
    });

    const { container, root } = renderWalletModal({
      authenticated: true,
      accountAuthenticated: true,
      walletAuthenticated: true,
      federatedAuthenticated: false,
      federatedAvailable: false,
      role: "admin",
      pubkey: "So11111111111111111111111111111111111111112"
    });

    await act(async () => {
      await Promise.resolve();
    });

    const marketplaceLink = container.querySelector('a[href="/marketplace"]');
    const profileLink = container.querySelector('a[href="/protected"]');
    const dashboardLink = container.querySelector('a[href="/admin"]');

    expect(marketplaceLink?.className).toContain("sm:w-[6.75rem]");
    expect(profileLink?.className).toContain("sm:w-[6.75rem]");
    expect(dashboardLink?.className).toContain("sm:w-[6.75rem]");
    expect(marketplaceLink?.className).toContain("sm:justify-center");
    expect(profileLink?.className).toContain("sm:justify-center");
    expect(dashboardLink?.className).toContain("sm:justify-center");

    act(() => {
      root.unmount();
    });
  });
});
