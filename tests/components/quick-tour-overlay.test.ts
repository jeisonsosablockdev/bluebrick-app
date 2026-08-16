// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localeMocks = vi.hoisted(() => ({
  useI18n: vi.fn()
}));

const navigationMocks = vi.hoisted(() => ({
  pathname: "/profile/perfil",
  push: vi.fn()
}));

vi.mock("@/components/i18n/locale-provider", () => ({
  useI18n: localeMocks.useI18n
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigationMocks.pathname,
  useRouter: () => ({ push: navigationMocks.push })
}));

import { QuickTourOverlay } from "@/features/profile/presentation/quick-tour-overlay";

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

function renderOverlay(): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(createElement(QuickTourOverlay));
  });

  return { container, root };
}

function getPrimaryTourButton(container: HTMLDivElement): HTMLButtonElement | null {
  return container.querySelector(".quick-tour-actions button:last-child");
}

function getDescriptionStrongText(container: HTMLDivElement): string | null {
  return container.querySelector(".quick-tour-description strong")?.textContent ?? null;
}

describe("features/profile/presentation/quick-tour-overlay", () => {
  beforeEach(() => {
    navigationMocks.pathname = "/profile/perfil";
    localeMocks.useI18n.mockReturnValue({
      locale: "es",
      setLocale: vi.fn(),
      t: (text: { es: string }) => text.es
    });

    vi.stubGlobal("fetch", vi.fn(async () => createJsonResponse({
      data: {
        firstName: null,
        country: null,
        email: null
      }
    })));

    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    document.body.innerHTML = "";
    window.sessionStorage.clear();
  });

  it("renders the requested bold phrases across the profile tour steps", async () => {
    const { container, root } = renderOverlay();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(getDescriptionStrongText(container)).toBe("Editar perfil");

    const expectedHighlights = [
      "nombre y apellido",
      "Agrega un número de contacto y email",
      "cuéntanos un poco de quién eres",
      "tu dirección",
      "Guardar cambios"
    ];

    for (const expected of expectedHighlights) {
      await act(async () => {
        getPrimaryTourButton(container)?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        await Promise.resolve();
      });

      expect(getDescriptionStrongText(container)).toBe(expected);
    }

    act(() => {
      root.unmount();
    });
  });

  it("does not render on the marketplace route", async () => {
    navigationMocks.pathname = "/marketplace";

    const { container, root } = renderOverlay();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.querySelector(".quick-tour-card")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();

    act(() => {
      root.unmount();
    });
  });
});
