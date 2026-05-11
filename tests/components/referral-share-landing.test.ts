// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  replace: vi.fn(),
  useRouter: vi.fn()
}));

vi.mock("next/navigation", () => ({
  useRouter: navigationMocks.useRouter
}));

import { ReferralShareLanding } from "@/components/referrals/referral-share-landing";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function renderLanding(): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(
      createElement(ReferralShareLanding, {
        referralCode: "REF-CODE-222",
        referrerWalletDisplay: "Abcd...Wxyz"
      })
    );
  });

  return { container, root };
}

describe("components/referrals/referral-share-landing", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    navigationMocks.replace.mockReset();
    navigationMocks.useRouter.mockReturnValue({
      replace: navigationMocks.replace
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = "";
  });

  it("redirects to the home onboarding flow with the referral code", () => {
    const { root } = renderLanding();

    act(() => {
      vi.advanceTimersByTime(1200);
    });

    expect(navigationMocks.replace).toHaveBeenCalledWith("/?ref=REF-CODE-222");

    act(() => {
      root.unmount();
    });
  });

  it("renders a manual continue link for non-redirecting browsers", () => {
    const { container, root } = renderLanding();

    const continueLink = Array.from(container.querySelectorAll("a")).find((link) =>
      link.textContent?.includes("Continue to BRIDS")
    );

    expect(continueLink?.getAttribute("href")).toBe("/?ref=REF-CODE-222");
    expect(container.textContent).toContain("Invitation from Abcd...Wxyz");

    act(() => {
      root.unmount();
    });
  });
});
