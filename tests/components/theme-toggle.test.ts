// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localeMocks = vi.hoisted(() => ({
  useI18n: vi.fn()
}));

vi.mock("@/components/i18n/locale-provider", () => ({
  useI18n: localeMocks.useI18n
}));

vi.mock("@/features/shared/ui/locale-provider", () => ({
  useI18n: localeMocks.useI18n
}));

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { THEME_STORAGE_KEY } from "@/lib/theme";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function renderToggle(): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(createElement(ThemeToggle));
  });

  return { container, root };
}

const storage = new Map<string, string>();
const localStorageMock = {
  getItem: vi.fn((key: string) => storage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => {
    storage.set(key, String(value));
  }),
  removeItem: vi.fn((key: string) => {
    storage.delete(key);
  }),
  clear: vi.fn(() => {
    storage.clear();
  }),
  get length() {
    return storage.size;
  },
  key: vi.fn((idx: number) => Array.from(storage.keys())[idx] ?? null)
};

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
  configurable: true
});

describe("components/theme/theme-toggle", () => {
  beforeEach(() => {
    localeMocks.useI18n.mockReturnValue({
      locale: "es",
      setLocale: vi.fn(),
      t: (text: { en: string; es: string; pt: string }) => text.es
    });

    document.documentElement.setAttribute("data-theme", "dark");
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
  });

  afterEach(() => {
    document.body.innerHTML = "";
    window.localStorage.clear();
    document.documentElement.setAttribute("data-theme", "dark");
    vi.clearAllMocks();
  });

  it("switches the theme and updates the stored mode", async () => {
    const { container, root } = renderToggle();
    const button = container.querySelector("button");

    await act(async () => {
      button?.click();
      await Promise.resolve();
    });

    await new Promise((resolve) => setTimeout(resolve, 250));

    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    expect(container.textContent).toContain("Cambiar a modo oscuro");

    act(() => {
      root.unmount();
    });
  });

  it("keeps a stable desktop width so locale copy does not resize the header", () => {
    const { container, root } = renderToggle();
    const wrapper = container.firstElementChild;
    const button = container.querySelector("button");

    expect(wrapper?.className).toContain("sm:w-[17rem]");
    expect(button?.className).toContain("w-full");
    expect(button?.className).toContain("whitespace-nowrap");

    act(() => {
      root.unmount();
    });
  });
});
