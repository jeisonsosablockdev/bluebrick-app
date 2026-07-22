// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminCollectionBlockchainAddressCard } from "@/components/admin/admin-collection-blockchain-address-card";
import { getSolscanAccountUrl } from "@/lib/infrastructure/solana";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function renderCard(
  props: Partial<Parameters<typeof AdminCollectionBlockchainAddressCard>[0]> = {}
): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(createElement(AdminCollectionBlockchainAddressCard, {
      copiedLabel: "Copied",
      copyLabel: "Copy address",
      emptyLabel: "Not available",
      label: "Collection address",
      openLabel: "View on Solscan",
      value: "Collection111",
      ...props
    }));
  });

  return { container, root };
}

describe("components/admin/admin-collection-blockchain-address-card", () => {
  let clipboardWriteText: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clipboardWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: clipboardWriteText
      }
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders copy and explorer actions for populated addresses", async () => {
    const { container, root } = renderCard();

    const copyButton = container.querySelector("button");
    const explorerLink = container.querySelector("a");

    expect(copyButton?.textContent).toBe("Copy address");
    expect(explorerLink?.getAttribute("href")).toBe(getSolscanAccountUrl("Collection111"));
    expect(explorerLink?.getAttribute("target")).toBe("_blank");

    await act(async () => {
      copyButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(clipboardWriteText).toHaveBeenCalledWith("Collection111");
    expect(copyButton?.textContent).toBe("Copied");

    act(() => {
      root.unmount();
    });
  });

  it("omits interactive controls when the address is missing", () => {
    const { container, root } = renderCard({
      value: null
    });

    expect(container.textContent).toContain("Not available");
    expect(container.querySelector("button")).toBeNull();
    expect(container.querySelector("a")).toBeNull();

    act(() => {
      root.unmount();
    });
  });
});
