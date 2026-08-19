// @vitest-environment jsdom

import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localeMocks = vi.hoisted(() => ({
  useI18n: vi.fn()
}));

vi.mock("@/components/i18n/locale-provider", () => ({
  useI18n: localeMocks.useI18n
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => createElement("a", { href, ...props }, children)
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: { children: ReactNode }) => createElement("button", props, children)
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: Record<string, unknown>) => createElement("input", props)
}));

import { FooterSection } from "@/features/landing/presentation/footer";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function renderFooter(): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(createElement(FooterSection));
  });
  return { container, root };
}

describe("features/landing/presentation/footer", () => {
  beforeEach(() => {
    localeMocks.useI18n.mockReturnValue({
      locale: "es",
      setLocale: vi.fn(),
      t: (text: { es: string }) => text.es
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  it("links propiedades to the marketplace and contacto to the transparency contact form", () => {
    const { container, root } = renderFooter();

    const propertiesLink = Array.from(container.querySelectorAll("a")).find((anchor) => anchor.textContent === "Propiedades");
    const contactLink = Array.from(container.querySelectorAll("a")).find((anchor) => anchor.textContent === "Contacto");

    expect(propertiesLink?.getAttribute("href")).toBe("/marketplace");
    expect(contactLink?.getAttribute("href")).toBe("/transparencia#contact-form");

    act(() => {
      root.unmount();
    });
  });
});
