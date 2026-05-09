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

import { OnboardingRewardDecisionModal } from "@/components/onboarding/onboarding-reward-decision-modal";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function renderModal(): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      createElement(OnboardingRewardDecisionModal, {
        open: true,
        rewardAmountUsd: 10,
        qualificationDeadlineLabel: "13 de mayo de 2026",
        onExplore: vi.fn(),
        onCompleteProfile: vi.fn(),
        onClose: vi.fn()
      })
    );
  });

  return { container, root };
}

describe("components/onboarding/onboarding-reward-decision-modal", () => {
  beforeEach(() => {
    localeMocks.useI18n.mockReturnValue({
      locale: "pt",
      setLocale: vi.fn(),
      t: (text: { pt: string }) => text.pt
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders localized copy for the active locale", () => {
    const { container, root } = renderModal();

    expect(container.textContent).toContain("Bem-vindo à BRIDS");
    expect(container.textContent).toContain("Você quer explorar ou completar seu perfil?");
    expect(container.textContent).toContain("Explorar agora");
    expect(container.textContent).toContain("Continuar com meu perfil");
    expect(container.textContent).toContain("Benefício de onboarding");

    act(() => {
      root.unmount();
    });
  });
});
