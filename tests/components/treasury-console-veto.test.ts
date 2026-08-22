// @vitest-environment jsdom

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localeMocks = vi.hoisted(() => ({
  useI18n: vi.fn(() => ({
    t: ({ en }: { en: string }) => en
  }))
}));

const releaseMocks = vi.hoisted(() => ({
  isReleaseControlledRouteVisible: vi.fn(() => true)
}));

vi.mock("@/components/i18n/locale-provider", () => ({
  useI18n: localeMocks.useI18n
}));

vi.mock("@/lib/release-module-visibility", () => ({
  isReleaseControlledRouteVisible: releaseMocks.isReleaseControlledRouteVisible
}));

import { TreasuryConsole } from "@/features/admin/presentation/treasury-console";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function renderComponent(): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(createElement(TreasuryConsole));
  });
  return { container, root };
}

describe("TreasuryConsole: Reject, Veto & Circuit Breaker UI", () => {
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

  it("renders Reject Proposal, Veto and Emergency Pause buttons in pre-seal state", () => {
    handle = renderComponent();

    const rejectButton = Array.from(handle.container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Reject Proposal")
    );
    const emergencyButton = Array.from(handle.container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Emergency Pause")
    );
    const vetoButtons = Array.from(handle.container.querySelectorAll("button")).filter((btn) =>
      btn.textContent?.includes("Veto")
    );

    expect(rejectButton).not.toBeUndefined();
    expect(emergencyButton).not.toBeUndefined();
    expect(vetoButtons.length).toBeGreaterThan(0);
  });

  it("handles item veto interaction and updates status badge", async () => {
    ((globalThis as any).fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        data: { itemId: "item-001", status: "vetoed" }
      })
    });

    handle = renderComponent();

    const vetoButton = Array.from(handle.container.querySelectorAll("button")).find((btn) =>
      btn.textContent === "Veto"
    );
    expect(vetoButton).not.toBeUndefined();

    await act(async () => {
      vetoButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect((globalThis as any).fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/admin/payout-runs/550e8400-e29b-41d4-a716-446655440000/veto"),
      expect.objectContaining({ method: "POST" })
    );

    expect(handle.container.textContent).toContain("Item item-001 vetoed successfully.");
  });

  it("handles emergency circuit breaker and displays local halted banner", async () => {
    ((globalThis as any).fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        data: {
          runId: "550e8400-e29b-41d4-a716-446655440000",
          localPaused: true,
          emergencyPausePayload: { nonce: 1234, expiresAt: 1755800300 }
        }
      })
    });

    handle = renderComponent();

    const emergencyButton = Array.from(handle.container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Emergency Pause")
    );
    expect(emergencyButton).not.toBeUndefined();

    await act(async () => {
      emergencyButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect((globalThis as any).fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/admin/payout-runs/550e8400-e29b-41d4-a716-446655440000/circuit-breaker"),
      expect.objectContaining({ method: "POST" })
    );

    expect(handle.container.textContent).toContain("Circuit Breaker Active");
    expect(handle.container.textContent).toContain("Local Bot Halted");
  });
});
