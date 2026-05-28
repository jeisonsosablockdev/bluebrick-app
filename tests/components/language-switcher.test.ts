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

import { LanguageSwitcher } from "@/components/i18n/language-switcher";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function renderSwitcher(): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(createElement(LanguageSwitcher));
  });

  return { container, root };
}

describe("components/i18n/language-switcher", () => {
  beforeEach(() => {
    localeMocks.useI18n.mockReturnValue({
      locale: "es",
      setLocale: vi.fn(),
      t: (text: { en: string; es: string; pt: string }) => text.es
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("renders the language buttons and forwards locale changes", () => {
    const setLocale = vi.fn();
    localeMocks.useI18n.mockReturnValue({
      locale: "es",
      setLocale,
      t: (text: { en: string; es: string; pt: string }) => text.es
    });

    const { container, root } = renderSwitcher();
    const buttons = Array.from(container.querySelectorAll("button"));
    const portugueseButton = buttons.find((button) => button.textContent?.includes("PT"));

    act(() => {
      portugueseButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(setLocale).toHaveBeenCalledWith("pt");
    expect(container.textContent).toContain("ES");

    act(() => {
      root.unmount();
    });
  });
});
