// @vitest-environment jsdom

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const searchParamsMock = vi.hoisted(() => ({
  get: vi.fn()
}));

const localeMocks = vi.hoisted(() => ({
  useI18n: vi.fn(() => ({
    t: ({ en }: { en: string }) => en
  }))
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParamsMock
}));

vi.mock("@/components/i18n/locale-provider", () => ({
  useI18n: localeMocks.useI18n
}));

import { RentasModule } from "@/features/staking-distribution/presentation/rentas-module";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function renderModule(): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(createElement(RentasModule));
  });
  return { container, root };
}

describe("RentasModule: Cancel Claim Flow UI", () => {
  let handle: RenderHandle | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).fetch = vi.fn();
  });

  afterEach(() => {
    if (handle) {
      act(() => {
        handle?.root.unmount();
      });
      handle.container.remove();
      handle = null;
    }
  });

  it("renders Cancel Claim button when claim status is pending", () => {
    searchParamsMock.get.mockImplementation((param: string) => {
      if (param === "claim") return "pending";
      return null;
    });

    handle = renderModule();

    const cancelButton = Array.from(handle.container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Cancel Claim")
    );

    expect(cancelButton).not.toBeUndefined();
  });

  it("does not render Cancel Claim button when claim is completed or empty", () => {
    searchParamsMock.get.mockImplementation((param: string) => {
      if (param === "claim") return "done";
      return null;
    });

    handle = renderModule();

    const cancelButton = Array.from(handle.container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Cancel Claim")
    );

    expect(cancelButton).toBeUndefined();
  });

  it("successfully triggers cancellation and updates banner state", async () => {
    searchParamsMock.get.mockImplementation((param: string) => {
      if (param === "claim") return "pending";
      return null;
    });

    ((globalThis as any).fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        data: { id: "CLM-2026-03", status: "canceled" }
      })
    });

    handle = renderModule();

    const cancelButton = Array.from(handle.container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Cancel Claim")
    );
    expect(cancelButton).not.toBeUndefined();

    await act(async () => {
      cancelButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect((globalThis as any).fetch).toHaveBeenCalledWith("/api/claims/CLM-2026-03/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    expect(handle.container.textContent).toContain("Claim cancelled");
  });
});
