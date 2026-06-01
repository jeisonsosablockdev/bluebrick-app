// @vitest-environment jsdom

import { act, createElement, type ReactNode } from "react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type ReferralAttributionSourceFixture = "link" | "manual" | "deep_link" | "unknown";

type ReferralHintFixture = {
  referralCode: string;
  origin: ReferralAttributionSourceFixture;
  landingPath: string;
  capturedAt: string;
};

type StartSiwsMockInput = {
  onStatus?: (status: "signing" | "verifying") => void;
};

type StartSiwsMockOutput = Promise<{
  publicKey: string;
  isNewUser: boolean;
  referralBindingOutcome?: string | null;
}>;

const TEST_WALLET_PUBLIC_KEY = "Wallet11111111111111111111111111111111111";

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
  refresh: vi.fn(),
  replace: vi.fn()
}));

const authClientMocks = vi.hoisted(() => ({
  fetchAuthMe: vi.fn(),
  persistReferralIntent: vi.fn(),
  startSiws: vi.fn<(input: StartSiwsMockInput) => StartSiwsMockOutput>()
}));

const referralStateMocks = vi.hoisted(() => ({
  buildPhantomBrowseDeepLink: vi.fn(() => "phantom://browse"),
  buildReferralAuthPayload: vi.fn((input: { referralCode: string }) => ({
    normalizedReferralCode: input.referralCode.trim(),
    referralSource: input.referralCode.trim() ? "manual" : undefined,
    referralMetadata: input.referralCode.trim() ? {} : undefined
  })),
  buildReferralAuthMetadata: vi.fn(() => ({})),
  buildStoredReferralHint: vi.fn(() => null),
  clearStoredReferralHint: vi.fn(),
  deriveReferralAttributionSource: vi.fn<() => ReferralAttributionSourceFixture>(() => "unknown"),
  normalizeReferralCodeInput: vi.fn((value: string) => value),
  readStoredReferralHint: vi.fn<() => ReferralHintFixture | null>(() => null),
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
  useRouter: () => ({
    push: navigationMocks.push,
    refresh: navigationMocks.refresh,
    replace: navigationMocks.replace
  }),
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
  buildReferralAuthPayload: referralStateMocks.buildReferralAuthPayload,
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

function findElementByText(root: ParentNode, text: string): HTMLElement | undefined {
  return Array.from(root.querySelectorAll<HTMLElement>("*")).find((candidate) =>
    candidate.textContent?.trim() === text
  );
}

function createWalletAuthSession(overrides: Partial<AuthMeResponse> = {}): AuthMeResponse {
  return {
    authenticated: true,
    accountAuthenticated: true,
    walletAuthenticated: true,
    federatedAuthenticated: false,
    federatedAvailable: false,
    authMethod: "wallet",
    accountId: "account_123",
    workosUserId: null,
    email: null,
    pubkey: TEST_WALLET_PUBLIC_KEY,
    role: "user",
    ...overrides
  };
}

function mockAuthenticatedPhantomWalletSession(options: {
  connected?: boolean;
  role?: AuthMeResponse["role"];
} = {}): { disconnect: ReturnType<typeof vi.fn>; signMessage: ReturnType<typeof vi.fn> } {
  const connected = options.connected ?? true;
  const disconnect = vi.fn(async () => undefined);
  const signMessage = vi.fn();
  const phantomAdapter = {
    name: "Phantom",
    readyState: WalletReadyState.Installed,
    publicKey: {
      toBase58: () => TEST_WALLET_PUBLIC_KEY
    },
    signMessage
  };

  walletMocks.useWallet.mockReturnValue({
    wallet: { adapter: phantomAdapter },
    wallets: [{ adapter: phantomAdapter, readyState: WalletReadyState.Installed }],
    publicKey: connected
      ? {
          toBase58: () => TEST_WALLET_PUBLIC_KEY
        }
      : null,
    connected,
    connecting: false,
    disconnecting: false,
    connect: vi.fn(),
    disconnect,
    select: vi.fn(),
    signMessage: connected ? signMessage : undefined
  });

  authClientMocks.fetchAuthMe.mockResolvedValue(createWalletAuthSession({ role: options.role ?? "user" }));

  return { disconnect, signMessage };
}

describe("components/WalletModal header CTA", () => {
  beforeEach(() => {
    navigationMocks.pathname = "/";
    navigationMocks.searchParams = new URLSearchParams();
    navigationMocks.push.mockReset();
    navigationMocks.refresh.mockReset();
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

  it("does not spin the modal status indicator when reduced motion is requested", async () => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: query.includes("prefers-reduced-motion"),
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    });

    walletMocks.useWallet.mockReturnValue({
      wallet: null,
      wallets: [],
      publicKey: null,
      connected: false,
      connecting: true,
      disconnecting: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
      select: vi.fn(),
      signMessage: undefined
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

    const statusIndicator = Array.from(document.body.querySelectorAll("span")).find((candidate) =>
      candidate.className.includes("border-cyan-300")
    );

    expect(document.body.textContent).toContain("Conectando...");
    expect(statusIndicator?.className).not.toContain("animate-spin");

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

    const reconnectButton = findButtonByText(document.body, "Reconectar Phantom");

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

  it("keeps the generic sign-in chooser when autoConnect restores a wallet without a SIWS session", async () => {
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

    expect(document.body.textContent).toContain("Ingresa a tu cuenta BRIDS");
    expect(document.body.textContent).toContain("Mail");
    expect(document.body.textContent).toContain("Wallet");
    expect(document.body.textContent).not.toContain("Conectada");
    expect(document.body.textContent).not.toContain("Cerrar sesion y desconectar wallet");

    act(() => {
      root.unmount();
    });
  });

  it("shows connected-wallet pending actions only for an explicit wallet intent", async () => {
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

    const { root } = renderWalletModal({
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

    expect(document.body.textContent).not.toContain("Ingresa a tu cuenta BRIDS");
    expect(document.body.textContent).not.toContain("Mail");
    expect(document.body.textContent).toContain("Prueba de wallet");
    expect(document.body.textContent).toContain("Prueba que esta wallet es tuya");
    expect(document.body.textContent).toContain("Wallet seleccionada");
    expect(document.body.textContent).toContain("Solicitar firma en Phantom");
    expect(document.body.textContent).not.toContain("Iniciar sesion");
    expect(document.body.textContent).toContain("Cancelar y desconectar wallet");
    const signInButton = findButtonByText(document.body, "Solicitar firma en Phantom");
    const disconnectButton = findButtonByText(document.body, "Cancelar y desconectar wallet");
    const actionGroup = disconnectButton?.parentElement;
    const pendingBadge = findElementByText(document.body, "Pendiente");
    expect(signInButton?.className).toContain("w-full");
    expect(disconnectButton?.className).toContain("w-full");
    expect(actionGroup?.className).toContain("grid-cols-1");
    expect(actionGroup?.className).not.toContain("sm:grid-cols-2");
    expect(pendingBadge?.className).toContain("bg-white");

    act(() => {
      root.unmount();
    });
  });

  it("communicates Phantom signing progress without a generic sign-in CTA", async () => {
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
    authClientMocks.startSiws.mockImplementation((input) => {
      input.onStatus?.("signing");
      return new Promise(() => undefined);
    });

    const { root } = renderWalletModal({
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

    const signatureButton = findButtonByText(document.body, "Solicitar firma en Phantom");

    await act(async () => {
      signatureButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(document.body.textContent).toContain("Confirma la firma en Phantom");
    expect(document.body.textContent).toContain("Esperando en Phantom");
    expect(document.body.textContent).toContain("Esperando confirmacion en Phantom");
    expect(document.body.textContent).not.toContain("Iniciar sesion");
    expect(findButtonByText(document.body, "Esperando confirmacion en Phantom")?.disabled).toBe(true);

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
    const signOutButton = findButtonByText(document.body, "Cerrar sesion y desconectar wallet");
    const actionGroup = signOutButton?.parentElement;
    const activeBadge = findElementByText(document.body, "Activa");
    expect(signOutButton?.className).toContain("w-full");
    expect(actionGroup?.className).toContain("grid-cols-1");
    expect(actionGroup?.className).not.toContain("sm:grid-cols-2");
    expect(activeBadge?.className).toContain("bg-white");
    expect(activeBadge?.className).not.toContain("emerald");

    act(() => {
      root.unmount();
    });
  });

  it("does not treat a connected adapter as active when it differs from the SIWS session wallet", async () => {
    const phantomAdapter = {
      name: "Phantom",
      readyState: WalletReadyState.Installed,
      publicKey: {
        toBase58: () => "Wallet22222222222222222222222222222222222"
      },
      signMessage: vi.fn()
    };

    walletMocks.useWallet.mockReturnValue({
      wallet: { adapter: phantomAdapter },
      wallets: [{ adapter: phantomAdapter, readyState: WalletReadyState.Installed }],
      publicKey: {
        toBase58: () => "Wallet22222222222222222222222222222222222"
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

    expect(document.body.textContent).toContain("Wallet no coincide");
    expect(document.body.textContent).toContain("Wallet conectada no coincide");
    expect(document.body.textContent).toContain("Cerrar sesion y desconectar wallet");
    expect(document.body.textContent).not.toContain("Copiar direccion");
    expect(findButtonByText(document.body, "Solicitar firma en Phantom")).toBeUndefined();
    expect(findElementByText(document.body, "Activa")).toBeUndefined();

    act(() => {
      root.unmount();
    });
  });

  it("disconnects the wallet adapter during sign out when an adapter public key is present", async () => {
    const { disconnect } = mockAuthenticatedPhantomWalletSession({ connected: false });

    const { container, root } = renderWalletModal(createWalletAuthSession());

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
    expect(navigationMocks.refresh).toHaveBeenCalledTimes(1);
    expect(navigationMocks.push).not.toHaveBeenCalled();
    expect(document.body.textContent).not.toContain("Reconectar wallet");

    act(() => {
      root.unmount();
    });
  });

  it("redirects private admin route sign out to public main instead of refreshing forbidden content", async () => {
    navigationMocks.pathname = "/admin/dashboard";
    const { disconnect } = mockAuthenticatedPhantomWalletSession({ role: "admin" });

    const { container, root } = renderWalletModal(createWalletAuthSession({ role: "admin" }));

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
    expect(navigationMocks.push).toHaveBeenCalledWith("/");
    expect(navigationMocks.refresh).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });

  it("visibly leaves the connected-wallet pending state after disconnect succeeds", async () => {
    const disconnect = vi.fn(async () => undefined);
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
      disconnect,
      select: vi.fn(),
      signMessage
    });

    const { root } = renderWalletModal({
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

    const disconnectButton = findButtonByText(document.body, "Cancelar y desconectar wallet");

    await act(async () => {
      disconnectButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(disconnect).toHaveBeenCalledTimes(1);
    expect(document.body.textContent).not.toContain("Conectada");
    expect(document.body.textContent).toContain("Ingresa a tu cuenta BRIDS");
    expect(document.body.textContent).toContain("Mail");
    expect(document.body.textContent).toContain("Wallet");

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
    expect(document.body.textContent).not.toContain("Cancelar y desconectar wallet");
    expect(document.body.textContent).not.toContain("Desconectar wallet");

    act(() => {
      root.unmount();
    });
  });

  it("persists a stored referral hint after federated login without a wallet session", async () => {
    referralStateMocks.readStoredReferralHint.mockReturnValue({
      referralCode: "REF123",
      origin: "manual",
      landingPath: "/marketplace",
      capturedAt: "2026-05-10T00:00:00.000Z"
    });
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
    referralStateMocks.readStoredReferralHint.mockReturnValue({
      referralCode: "REF123",
      origin: "manual",
      landingPath: "/marketplace",
      capturedAt: "2026-05-10T00:00:00.000Z"
    });
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
