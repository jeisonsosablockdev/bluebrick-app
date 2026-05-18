// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localeMocks = vi.hoisted(() => ({
  useI18n: vi.fn()
}));

const pwaStateMocks = vi.hoisted(() => ({
  usePwaCapabilityState: vi.fn()
}));

const enrollmentMocks = vi.hoisted(() => ({
  useWebPushEnrollment: vi.fn()
}));

vi.mock("@/components/i18n/locale-provider", () => ({
  useI18n: localeMocks.useI18n
}));

vi.mock("@/components/pwa/use-pwa-capability-state", () => ({
  usePwaCapabilityState: pwaStateMocks.usePwaCapabilityState
}));

vi.mock("@/components/pwa/use-web-push-enrollment", () => ({
  useWebPushEnrollment: enrollmentMocks.useWebPushEnrollment
}));

import { PwaCapabilityCard } from "@/components/pwa/pwa-capability-card";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function renderCard(): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(createElement(PwaCapabilityCard, { audience: "wallet-profile" }));
  });

  return { container, root };
}

describe("components/pwa/pwa-capability-card", () => {
  beforeEach(() => {
    localeMocks.useI18n.mockReturnValue({
      locale: "es",
      setLocale: vi.fn(),
      t: (text: { es: string }) => text.es
    });

    enrollmentMocks.useWebPushEnrollment.mockReturnValue({
      canDisable: false,
      canEnable: false,
      disableNotifications: vi.fn(),
      enableNotifications: vi.fn(),
      errorMessage: null,
      hasCurrentSubscription: false,
      isLoading: false,
      statusMessage: null,
      subscriptionCount: 0
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("renders an install CTA when the browser exposes the install prompt", () => {
    const promptInstall = vi.fn().mockResolvedValue("accepted");
    pwaStateMocks.usePwaCapabilityState.mockReturnValue({
      installPromptOutcome: null,
      isPromptingInstall: false,
      promptInstall,
      snapshot: {
        platform: "desktop",
        isStandalone: false,
        supportsPush: true,
        installPromptAvailable: true,
        installabilityState: "prompt-ready",
        notificationState: "ready",
        notificationPermission: "granted"
      }
    });

    const { container, root } = renderCard();
    const button = Array.from(container.querySelectorAll("button")).find((candidate) =>
      candidate.textContent?.includes("Instalar BRIDS")
    );

    act(() => {
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(promptInstall).toHaveBeenCalledTimes(1);

    act(() => {
      root.unmount();
    });
  });

  it("renders manual iOS instructions when standalone install is still required", () => {
    pwaStateMocks.usePwaCapabilityState.mockReturnValue({
      installPromptOutcome: null,
      isPromptingInstall: false,
      promptInstall: vi.fn(),
      snapshot: {
        platform: "ios",
        isStandalone: false,
        supportsPush: true,
        installPromptAvailable: false,
        installabilityState: "manual-ios",
        notificationState: "needs-install",
        notificationPermission: "default"
      }
    });

    const { container, root } = renderCard();

    expect(container.textContent).toContain("Que hacer en iOS");
    expect(container.textContent).toContain("Anadir a pantalla de inicio");

    act(() => {
      root.unmount();
    });
  });

  it("renders an enrollment CTA when push is ready for a wallet profile", () => {
    const enableNotifications = vi.fn().mockResolvedValue(undefined);
    enrollmentMocks.useWebPushEnrollment.mockReturnValue({
      canDisable: false,
      canEnable: true,
      disableNotifications: vi.fn(),
      enableNotifications,
      errorMessage: null,
      hasCurrentSubscription: false,
      isLoading: false,
      statusMessage: null,
      subscriptionCount: 0
    });
    pwaStateMocks.usePwaCapabilityState.mockReturnValue({
      installPromptOutcome: null,
      isPromptingInstall: false,
      promptInstall: vi.fn(),
      snapshot: {
        platform: "android",
        isStandalone: true,
        supportsPush: true,
        installPromptAvailable: false,
        installabilityState: "standalone",
        notificationState: "ready",
        notificationPermission: "default"
      }
    });

    const { container, root } = renderCard();
    const button = Array.from(container.querySelectorAll("button")).find((candidate) =>
      candidate.textContent?.includes("Activar notificaciones")
    );

    act(() => {
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(enableNotifications).toHaveBeenCalledTimes(1);

    act(() => {
      root.unmount();
    });
  });
});
