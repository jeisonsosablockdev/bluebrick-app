// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MarketplaceViewModeButton } from "@/components/marketplace/MarketplaceViewModeButton";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function renderButton(currentMode: "combined-map-top" | "list-only" | "map-only" | "combined-list-top", onCycle: () => void): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(createElement(MarketplaceViewModeButton, { currentMode, onCycle }));
  });

  return { container, root };
}

describe("components/marketplace/MarketplaceViewModeButton", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("invokes the cycle handler when the user taps the button", () => {
    const onCycle = vi.fn();
    const { container, root } = renderButton("combined-map-top", onCycle);

    const button = container.querySelector("button");
    expect(button).toBeTruthy();

    act(() => {
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(onCycle).toHaveBeenCalledTimes(1);

    act(() => {
      root.unmount();
    });
  });
});
