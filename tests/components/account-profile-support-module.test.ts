// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localeMocks = vi.hoisted(() => ({
  useI18n: vi.fn()
}));

const navigationMocks = vi.hoisted(() => ({
  push: vi.fn()
}));

const authUiEventMocks = vi.hoisted(() => ({
  dispatchOpenWalletModal: vi.fn()
}));

vi.mock("@/components/i18n/locale-provider", () => ({
  useI18n: localeMocks.useI18n
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: navigationMocks.push })
}));

vi.mock("@/lib/auth-ui-events", () => ({
  dispatchOpenWalletModal: authUiEventMocks.dispatchOpenWalletModal
}));

import { AccountProfileSupportModule } from "@/components/dashboard/account-profile-support-module";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function renderModule(email: string | null = "user@example.com"): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(createElement(AccountProfileSupportModule, { email }));
  });

  return { container, root };
}

describe("components/dashboard/account-profile-support-module", () => {
  beforeEach(() => {
    localeMocks.useI18n.mockReturnValue({
      locale: "es",
      setLocale: vi.fn(),
      t: (text: { es: string }) => text.es
    });
    navigationMocks.push.mockReset();
    authUiEventMocks.dispatchOpenWalletModal.mockReset();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("opens the wallet modal directly from the action button", () => {
    const { container, root } = renderModule();

    const button = Array.from(container.querySelectorAll("button")).find((candidate) =>
      candidate.textContent?.includes("Conectar wallet ahora")
    );

    act(() => {
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(authUiEventMocks.dispatchOpenWalletModal).toHaveBeenCalledWith({ loginMethod: "wallet" });

    act(() => {
      root.unmount();
    });
  });

  it("returns to protected overview when the modal is closed", () => {
    const { container, root } = renderModule();

    const button = Array.from(container.querySelectorAll("button")).find((candidate) =>
      candidate.getAttribute("aria-label") === "Cerrar modal"
    );

    act(() => {
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(navigationMocks.push).toHaveBeenCalledWith("/protected");

    act(() => {
      root.unmount();
    });
  });
});
