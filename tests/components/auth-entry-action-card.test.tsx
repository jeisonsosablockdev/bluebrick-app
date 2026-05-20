// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AuthEntryActionCard } from "@/components/wallet-modal/auth-entry-action-card";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function renderCard(): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  const onMailClick = vi.fn();
  const onWalletClick = vi.fn();

  act(() => {
    root.render(
      createElement(AuthEntryActionCard, {
        title: "Ingresa a tu cuenta BRIDS",
        mailLabel: "Mail",
        walletLabel: "Wallet",
        mailIcon: createElement("span", null, "mail-icon"),
        walletIcon: createElement("span", null, "wallet-icon"),
        onMailClick,
        onWalletClick
      })
    );
  });

  return { container, root };
}

describe("components/wallet-modal/auth-entry-action-card", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("renders only direct Mail and Wallet entry actions", () => {
    const { container, root } = renderCard();

    expect(container.textContent).toContain("Ingresa a tu cuenta BRIDS");
    expect(container.textContent).toContain("Mail");
    expect(container.textContent).toContain("Wallet");
    expect(container.textContent).not.toContain("Conectar e iniciar sesion");

    act(() => {
      root.unmount();
    });
  });

  it("starts the selected action when the user clicks a direct entry button", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    const onMailClick = vi.fn();
    const onWalletClick = vi.fn();

    act(() => {
      root.render(
        createElement(AuthEntryActionCard, {
          title: "Ingresa a tu cuenta BRIDS",
          mailLabel: "Mail",
          walletLabel: "Wallet",
          mailIcon: createElement("span", null, "mail-icon"),
          walletIcon: createElement("span", null, "wallet-icon"),
          onMailClick,
          onWalletClick
        })
      );
    });

    const [mailButton, walletButton] = Array.from(container.querySelectorAll("button"));

    act(() => {
      mailButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      walletButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onMailClick).toHaveBeenCalledTimes(1);
    expect(onWalletClick).toHaveBeenCalledTimes(1);

    act(() => {
      root.unmount();
    });
  });
});
