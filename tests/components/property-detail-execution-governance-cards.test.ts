// @vitest-environment jsdom

import { createElement } from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localeMocks = vi.hoisted(() => ({ useI18n: vi.fn() }));

vi.mock("@/components/i18n/locale-provider", () => ({
  useI18n: localeMocks.useI18n
}));

import { PropertyDetailExecutionGovernanceCards } from "@/components/marketplace/PropertyDetailExecutionGovernanceCards";

function renderCards(project: Record<string, string | number | null>, governance: Record<string, string>, investmentNotes = "Investment fallback") {
  const container = document.createElement("div");
  const root = createRoot(container);

  act(() => {
    root.render(createElement(PropertyDetailExecutionGovernanceCards, {
      project: project as never,
      governance: governance as never,
      investmentNotes
    }));
  });

  return { container, root };
}

describe("PropertyDetailExecutionGovernanceCards", () => {
  beforeEach(() => {
    localeMocks.useI18n.mockReturnValue({
      locale: "en",
      t: (text: { en: string; es: string; pt: string }) => text.en
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("renders optional execution fields and governance risk notes", () => {
    const { container, root } = renderCards(
      {
        stage: "Rehab",
        developerName: "BRIDS Capital",
        exitStrategy: "Sale",
        durationMonths: 12
      },
      { riskNotes: "Escrow with milestone draws." }
    );

    expect(container.textContent).toContain("Execution and exit");
    expect(container.textContent).toContain("Project stage: Rehab");
    expect(container.textContent).toContain("Operator / developer: BRIDS Capital");
    expect(container.textContent).toContain("Exit strategy: Sale");
    expect(container.textContent).toContain("Duration: 12 months");
    expect(container.textContent).toContain("Transparency and governance");
    expect(container.textContent).toContain("Escrow with milestone draws.");

    act(() => root.unmount());
  });

  it("hides blank optional project fields and falls back to investment notes", () => {
    const { container, root } = renderCards(
      {
        stage: "",
        developerName: "",
        exitStrategy: "",
        durationMonths: null
      },
      { riskNotes: "" },
      "Fallback investment notes"
    );

    expect(container.textContent).not.toContain("Project stage");
    expect(container.textContent).not.toContain("Operator / developer");
    expect(container.textContent).not.toContain("Exit strategy");
    expect(container.textContent).toContain("Duration: Unavailable");
    expect(container.textContent).toContain("Fallback investment notes");

    act(() => root.unmount());
  });
});
