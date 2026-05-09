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

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: { children: ReactNode }) => createElement("button", props, children)
}));

vi.mock("@/components/ui/input", () => ({
  Input: (props: Record<string, unknown>) => createElement("input", props)
}));

import { CONTACT_FORM_SECTION_ID, ContactFormSection } from "@/components/sections/contact-form";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function renderContactForm(): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(createElement(ContactFormSection));
  });

  return { container, root };
}

describe("components/sections/contact-form", () => {
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

  it("exposes a stable section id for footer deep links", () => {
    const { container, root } = renderContactForm();

    const section = container.querySelector(`section#${CONTACT_FORM_SECTION_ID}`);

    expect(section).not.toBeNull();
    expect(section?.textContent).toContain("Contacta con nosotros");

    act(() => {
      root.unmount();
    });
  });
});
