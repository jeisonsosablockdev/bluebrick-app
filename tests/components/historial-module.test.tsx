// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localeMocks = vi.hoisted(() => ({
  useI18n: vi.fn()
}));

const navigationMocks = vi.hoisted(() => ({
  useSearchParams: vi.fn()
}));

vi.mock("@/components/i18n/locale-provider", () => ({
  useI18n: localeMocks.useI18n
}));

vi.mock("next/navigation", () => ({
  useSearchParams: navigationMocks.useSearchParams
}));

import { HistorialModule } from "@/features/profile/presentation/historial-module";

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

function renderModule(): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(createElement(HistorialModule));
  });

  return { container, root };
}

describe("features/profile/presentation/historial-module", () => {
  beforeEach(() => {
    localeMocks.useI18n.mockReturnValue({
      locale: "en",
      setLocale: vi.fn(),
      t: (text: { en: string }) => text.en
    });
    navigationMocks.useSearchParams.mockReturnValue(new URLSearchParams());

    vi.stubGlobal("fetch", vi.fn(async () => createJsonResponse({
      ok: true,
      data: {
        walletPublicKey: "Wallet11111111111111111111111111111111111",
        items: [
          {
            id: "event-1",
            propertyTitle: "Torre Magnolia Medellin",
            productAction: "stake",
            txSignature: "sig-1",
            blockTime: "2026-05-27T12:00:00.000Z",
            observedAt: "2026-05-27T12:00:01.000Z",
            validationStatus: "validated"
          },
          {
            id: "event-2",
            propertyTitle: "Vista Mar Cartagena",
            productAction: "unstake",
            txSignature: "sig-2",
            blockTime: null,
            observedAt: "2026-05-27T13:00:00.000Z",
            validationStatus: "reconcile_pending"
          }
        ]
      }
    })));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("renders persisted stake history instead of fixtures", async () => {
    const { container, root } = renderModule();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Stake history");
    expect(container.textContent).toContain("Torre Magnolia Medellin");
    expect(container.textContent).toContain("Vista Mar Cartagena");
    expect(container.textContent).toContain("Stake");
    expect(container.textContent).toContain("Unstake");

    act(() => {
      root.unmount();
    });
  });
});

