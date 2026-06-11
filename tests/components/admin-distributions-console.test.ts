// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localeMocks = vi.hoisted(() => ({
  useI18n: vi.fn()
}));

vi.mock("@/components/i18n/locale-provider", () => ({
  useI18n: localeMocks.useI18n
}));

vi.mock("@/lib/release-module-visibility", () => ({
  isReleaseControlledRouteVisible: vi.fn(() => true)
}));

import { DistributionsConsole } from "@/components/admin/distributions-console";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function createJsonResponse(payload: unknown): Response {
  return {
    ok: true,
    json: async () => payload
  } as Response;
}

function renderConsole(): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(createElement(DistributionsConsole));
  });

  return { container, root };
}

describe("components/admin/distributions-console", () => {
  beforeEach(() => {
    localeMocks.useI18n.mockReturnValue({
      locale: "en",
      setLocale: vi.fn(),
      t: (text: { en: string }) => text.en
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("loads distribution runs from the admin API instead of rendering mock batches", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => createJsonResponse({
      ok: true,
      data: [
        {
          id: "run-1",
          periodKey: "2026-05",
          collectionAddress: "Collection111",
          propertyId: "property-1",
          totalAmountMinor: "1000",
          tokenMint: "USDC111",
          status: "finalized",
          itemCount: 2,
          totalWallets: 2,
          outputChecksum: "sha256:ready",
          createdAt: "2026-06-05T00:00:00.000Z",
          finalizedAt: "2026-06-05T01:00:00.000Z"
        }
      ]
    })));

    const { container, root } = renderConsole();
    await act(async () => {
      await Promise.resolve();
    });

    expect(fetch).toHaveBeenCalledWith("/api/admin/distributions/runs", expect.objectContaining({ cache: "no-store" }));
    expect(container.textContent).toContain("run-1");
    expect(container.textContent).toContain("Finalized");
    expect(container.textContent).not.toContain("D-2026-03");

    act(() => root.unmount());
  });

  it("shows an empty state when no prepared runs exist", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => createJsonResponse({
      ok: true,
      data: []
    })));

    const { container, root } = renderConsole();
    await act(async () => {
      await Promise.resolve();
    });

    expect(container.textContent).toContain("No distribution runs yet");

    act(() => root.unmount());
  });
});
