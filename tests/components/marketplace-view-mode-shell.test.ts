// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

import { MarketplaceViewModeShell } from "@/components/marketplace/MarketplaceViewModeShell";
import type { MarketplaceViewMode } from "@/lib/marketplace-view-mode";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function renderShell(): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      createElement(MarketplaceViewModeShell, {
        render: (mode: MarketplaceViewMode) => createElement("div", { "data-testid": "marketplace-mode" }, mode)
      })
    );
  });

  return { container, root };
}

describe("components/marketplace/MarketplaceViewModeShell", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("keeps the current mode in state and advances when the button is clicked", () => {
    const { container, root } = renderShell();

    expect(container.textContent).toContain("combined-map-top");

    const button = container.querySelector("button");
    expect(button).toBeTruthy();

    act(() => {
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("list-only");

    act(() => {
      root.unmount();
    });
  });
});
