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

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: () => ({
    publicKey: { toBase58: () => "3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd" },
    connected: true
  })
}));

import { TreasuryConsole } from "@/features/admin/presentation/treasury-console";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

async function renderComponent(): Promise<RenderHandle> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => {
    root.render(createElement(TreasuryConsole));
  });
  // Allow promises to resolve
  await act(async () => {
    await new Promise((r) => setTimeout(r, 10));
  });
  return { container, root };
}

describe("TreasuryConsole: Reject, Veto & Circuit Breaker UI", () => {
  let handle: RenderHandle | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/api/admin/treasury/summary")) {
        return {
          ok: true,
          json: async () => ({
            ok: true,
            data: {
              activeRun: {
                id: "550e8400-e29b-41d4-a716-446655440000",
                status: "draft",
                totalAmount: "10,000 USDC",
                itemsCount: 1
              },
              items: [
                {
                  id: "item-001",
                  runId: "550e8400-e29b-41d4-a716-446655440000",
                  recipientWallet: "3tW8Jp3QAMqY2KM27KgddizUyS7rvc7hEsbwCU8siATd",
                  amount: "1,000 USDC",
                  status: "active"
                }
              ],
              pendingProposals: [],
              movements: []
            }
          })
        };
      }
      return {
        ok: true,
        json: async () => ({ ok: true, data: {} })
      };
    });
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

  it("renders Reject Proposal, Veto and Emergency Pause buttons in pre-seal state", async () => {
    handle = await renderComponent();

    const rejectButton = Array.from(handle.container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Rechazar") || btn.textContent?.includes("Reject")
    );
    const emergencyButton = Array.from(handle.container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Pausa") || btn.textContent?.includes("Pause")
    );
    const vetoButtons = Array.from(handle.container.querySelectorAll("button")).filter((btn) =>
      btn.textContent?.includes("Vetar") || btn.textContent?.includes("Veto")
    );

    expect(rejectButton).not.toBeUndefined();
    expect(emergencyButton).not.toBeUndefined();
    expect(vetoButtons.length).toBeGreaterThan(0);
  });

  it("handles item veto interaction and updates status badge", async () => {
    handle = await renderComponent();

    ((globalThis as any).fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ok: true,
        data: { itemId: "item-001", status: "vetoed" }
      })
    });

    const vetoButton = Array.from(handle.container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Vetar") || btn.textContent === "Veto"
    );
    expect(vetoButton).not.toBeUndefined();

    await act(async () => {
      vetoButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect((globalThis as any).fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/admin/payout-runs/550e8400-e29b-41d4-a716-446655440000/veto"),
      expect.objectContaining({ method: "POST" })
    );

    expect(handle.container.textContent).toContain("vetado");
  });

  it("handles emergency circuit breaker and displays local halted banner", async () => {
    handle = await renderComponent();

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

    const emergencyButton = Array.from(handle.container.querySelectorAll("button")).find((btn) =>
      btn.textContent?.includes("Pausa") || btn.textContent?.includes("Pause")
    );
    expect(emergencyButton).not.toBeUndefined();

    await act(async () => {
      emergencyButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect((globalThis as any).fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/admin/treasury/circuit-breaker"),
      expect.objectContaining({ method: "POST" })
    );

    expect(handle.container.textContent).toContain("Pausa");
  });
});
