// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localeMocks = vi.hoisted(() => ({ useI18n: vi.fn() }));

vi.mock("@/components/i18n/locale-provider", () => ({
  useI18n: localeMocks.useI18n
}));

import { PropertyDetailPropertyInfoCard } from "@/features/marketplace/presentation/PropertyDetailPropertyInfoCard";

describe("PropertyDetailPropertyInfoCard", () => {
  beforeEach(() => {
    localeMocks.useI18n.mockReturnValue({
      t: (text: { en: string; es: string; pt: string }) => text.es
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("renders location, postal code, notes, and highlights", () => {
    const container = document.createElement("div");
    const root = createRoot(container);

    act(() => {
      root.render(createElement(PropertyDetailPropertyInfoCard, {
        property: {
          investmentNotes: "Escrow with milestones",
          detailedLocation: "117 Hickory Creek Blvd, Brandon, FL 33511",
          postalCode: "33511",
          highlights: ["Renovated roof", "Near schools"]
        } as never
      }));
    });

    expect(container.textContent).toContain("Informacion de la propiedad");
    expect(container.textContent).toContain("Escrow with milestones");
    expect(container.textContent).toContain("117 Hickory Creek Blvd, Brandon, FL");
    expect(container.textContent).toContain("Codigo postal: 33511");
    expect(container.textContent).toContain("Renovated roof");
    expect(container.textContent).toContain("Near schools");

    act(() => root.unmount());
  });
});
