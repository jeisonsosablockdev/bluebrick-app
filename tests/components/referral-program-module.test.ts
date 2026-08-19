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

import { ReferralProgramModule } from "@/features/referral-marketing/presentation/referral-program-module";

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
    root.render(createElement(ReferralProgramModule));
  });

  return { container, root };
}

describe("features/referral-marketing/presentation/referral-program-module", () => {
  let clipboardWriteText: ReturnType<typeof vi.fn>;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localeMocks.useI18n.mockReturnValue({
      locale: "en",
      setLocale: vi.fn(),
      t: (text: { en: string }) => text.en
    });

    clipboardWriteText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: clipboardWriteText
      }
    });

    fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);

      if (url.includes("/api/protected/referrals/summary")) {
        return createJsonResponse({
          ok: true,
          data: {
            referralCode: "REF-CODE-111",
            sharePath: "/r/REF-CODE-111",
            pendingInviteesCount: 2,
            completedInviteesCount: 1,
            notificationCount: 1,
            totalAccruedUsdc: 10,
            totalPendingDistributionUsdc: 20,
            totalPaidUsdc: 30,
            nextMilestone: {
              targetCount: 3,
              progressCount: 1,
              progressPercent: 33
            }
          }
        });
      }

      if (url.includes("offset=5")) {
        return createJsonResponse({
          ok: true,
          data: {
            items: [
              {
                inviteeWalletDisplay: "Next...Page",
                state: "pending",
                attributionStatus: "bound_pending_kyc",
                rewardStatus: null,
                rewardAmountUsdc: 0,
                boundDay: "2026-05-04",
                qualifiedDay: null
              }
            ],
            totalCount: 6,
            limit: 5,
            offset: 5,
            hasMore: false
          }
        });
      }

      return createJsonResponse({
        ok: true,
        data: {
          items: [
            {
              inviteeWalletDisplay: "Abcd...Wxyz",
              state: "completed",
              attributionStatus: "kyc_verified",
              rewardStatus: "accrued",
              rewardAmountUsdc: 10,
              boundDay: "2026-05-03",
              qualifiedDay: "2026-05-10"
            }
          ],
          totalCount: 6,
          limit: 5,
          offset: 0,
          hasMore: true
        }
      });
    });

    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("loads the referral dashboard and copies the functional share URL", async () => {
    const { container, root } = renderModule();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(container.textContent).toContain("Share and track your referrals");
    expect(container.textContent).toContain("REF-CODE-111");
    expect(container.textContent).toContain("Abcd...Wxyz");

    const copyButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Copy link")
    );

    await act(async () => {
      copyButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(clipboardWriteText).toHaveBeenCalledWith("http://localhost:3000/r/REF-CODE-111");

    act(() => {
      root.unmount();
    });
  });

  it("fetches the next invitee page when pagination advances", async () => {
    const { container, root } = renderModule();

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const nextButton = Array.from(container.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("Next")
    );

    await act(async () => {
      nextButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/protected/referrals/invitees?limit=5&offset=5"),
      expect.objectContaining({
        method: "GET",
        cache: "no-store"
      })
    );
    expect(container.textContent).toContain("Next...Page");

    act(() => {
      root.unmount();
    });
  });
});
