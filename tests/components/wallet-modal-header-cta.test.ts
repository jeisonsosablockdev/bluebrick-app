// @vitest-environment jsdom

import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localeMocks = vi.hoisted(() => ({
  useI18n: vi.fn()
}));

const walletMocks = vi.hoisted(() => ({
  useWallet: vi.fn()
}));

const authClientMocks = vi.hoisted(() => ({
  fetchAuthMe: vi.fn(),
  startSiws: vi.fn()
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => createElement("img", props)
}));

vi.mock("next/link", () => ({
  default: ({ children, href, ...props }: { children?: ReactNode; href?: string } & Record<string, unknown>) =>
    createElement("a", { href, ...props }, children)
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams()
}));

vi.mock("@/components/i18n/locale-provider", () => ({
  useI18n: localeMocks.useI18n
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: walletMocks.useWallet
}));

vi.mock("@/lib/auth-client", () => ({
  fetchAuthMe: authClientMocks.fetchAuthMe,
  startSiws: authClientMocks.startSiws
}));

vi.mock("@/components/theme/theme-toggle", () => ({
  ThemeToggle: () => createElement("div", null, "theme-toggle")
}));

vi.mock("@/components/i18n/language-switcher", () => ({
  LanguageSwitcher: () => createElement("div", null, "language-switcher")
}));

vi.mock("@/components/onboarding/onboarding-reward-decision-modal", () => ({
  OnboardingRewardDecisionModal: () => null
}));

vi.mock("@/lib/referrals/client-state", () => ({
  buildPhantomBrowseDeepLink: vi.fn(() => "phantom://browse"),
  buildReferralAuthMetadata: vi.fn(() => ({})),
  buildStoredReferralHint: vi.fn(() => null),
  clearStoredReferralHint: vi.fn(),
  deriveReferralAttributionSource: vi.fn(() => "unknown"),
  normalizeReferralCodeInput: vi.fn((value: string) => value),
  readStoredReferralHint: vi.fn(() => null),
  writeStoredReferralHint: vi.fn()
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

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function renderWalletModal(initialAuth: AuthMeResponse = {
  authenticated: false,
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

describe("components/WalletModal header CTA", () => {
  beforeEach(() => {
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
      pubkey: null
    });

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
    document.body.innerHTML = "";
  });

  it("renders the ingresar CTA with a wallet icon", async () => {
    const { container, root } = renderWalletModal();

    await act(async () => {
      await Promise.resolve();
    });

    const button = Array.from(container.querySelectorAll("button")).find((candidate) =>
      candidate.textContent?.includes("Ingresar")
    );

    expect(button).toBeTruthy();
    expect(button?.textContent).toContain("Ingresar");
    expect(button?.querySelector("svg")).toBeTruthy();

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

    const button = Array.from(container.querySelectorAll("button")).find((candidate) =>
      candidate.textContent?.includes("Wallet")
    );

    expect(button).toBeTruthy();
    expect(button?.textContent).toContain("Wallet");
    expect(button?.querySelector("svg")).toBeTruthy();

    act(() => {
      root.unmount();
    });
  });
});
