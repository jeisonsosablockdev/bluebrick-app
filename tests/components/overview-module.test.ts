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

import { OverviewModule } from "@/components/dashboard/overview-module";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function renderModule(): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(createElement(OverviewModule));
  });

  return { container, root };
}

function createOverviewResponse(overrides: Record<string, unknown> = {}): Response {
  return {
    ok: true,
    json: async () => ({
      ok: true,
      data: {
        walletPublicKey: "Wallet111",
        accountStatus: "wallet_bound",
        profile: {
          kycStatus: "verified",
          complianceStatus: "fully_verified",
          profileCompletedAt: "2026-06-05T00:00:00.000Z"
        },
        summary: {
          historicalInvestedMinor: "1000",
          historicalInvestedCurrency: "LAMPORTS",
          currentlyOwnedFractions: 2,
          readyToStakeCount: 1,
          readyToUnstakeCount: 1,
          syncPendingCount: 0,
          unsupportedCount: 0,
          preparedDistributionMinor: "250",
          preparedDistributionCurrency: "USDC111"
        },
        holdingsPreview: [
          {
            assetAddress: "Asset111",
            propertyId: "property-1",
            propertyTitle: "Torre Magnolia",
            collectionAddress: "Collection111",
            visibleState: "ready_to_stake",
            imageUrl: null
          }
        ],
        recentActivity: [
          {
            id: "event-1",
            type: "stake",
            propertyTitle: "Torre Magnolia",
            txSignature: "sig-1",
            validationStatus: "validated",
            occurredAt: "2026-06-03T00:00:00.000Z"
          }
        ],
        dataQuality: {
          status: "ready",
          degradedSources: [],
          refreshedAt: "2026-06-05T00:00:00.000Z"
        },
        ...overrides
      }
    })
  } as Response;
}

async function flush(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

describe("components/dashboard/overview-module", () => {
  beforeEach(() => {
    localeMocks.useI18n.mockReturnValue({
      locale: "en",
      setLocale: vi.fn(),
      t: (text: { en: string }) => text.en
    });
    vi.stubGlobal("fetch", vi.fn(async () => createOverviewResponse()));
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("loads the protected overview endpoint and does not render legacy mock metrics", async () => {
    const { container, root } = renderModule();

    await flush();

    expect(fetch).toHaveBeenCalledWith("/api/protected/overview", {
      method: "GET",
      cache: "no-store"
    });
    expect(container.textContent).toContain("Historical invested");
    expect(container.textContent).toContain("1,000");
    expect(container.textContent).toContain("Currently owned Fractions");
    expect(container.textContent).toContain("Torre Magnolia");
    expect(container.textContent).not.toContain("$48,500.00");
    expect(container.textContent).not.toContain("$365.10");
    expect(container.textContent).not.toContain("Portfolio Value");

    act(() => {
      root.unmount();
    });
  });

  it("renders empty state for wallets without BRIDS holdings", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => createOverviewResponse({
      summary: {
        historicalInvestedMinor: "0",
        historicalInvestedCurrency: "LAMPORTS",
        currentlyOwnedFractions: 0,
        readyToStakeCount: 0,
        readyToUnstakeCount: 0,
        syncPendingCount: 0,
        unsupportedCount: 0,
        preparedDistributionMinor: "0",
        preparedDistributionCurrency: null
      },
      holdingsPreview: [],
      recentActivity: [],
      dataQuality: {
        status: "empty",
        degradedSources: [],
        refreshedAt: "2026-06-05T00:00:00.000Z"
      }
    })));

    const { container, root } = renderModule();

    await flush();

    expect(container.textContent).toContain("No BRIDS NFTs in this wallet yet");

    act(() => {
      root.unmount();
    });
  });

  it("renders partial and sync pending states from the server DTO", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => createOverviewResponse({
      summary: {
        historicalInvestedMinor: "1000",
        historicalInvestedCurrency: "LAMPORTS",
        currentlyOwnedFractions: 1,
        readyToStakeCount: 0,
        readyToUnstakeCount: 0,
        syncPendingCount: 1,
        unsupportedCount: 0,
        preparedDistributionMinor: "0",
        preparedDistributionCurrency: null
      },
      dataQuality: {
        status: "partial",
        degradedSources: ["distributions"],
        refreshedAt: "2026-06-05T00:00:00.000Z"
      }
    })));

    const { container, root } = renderModule();

    await flush();

    expect(container.textContent).toContain("Partial data");
    expect(container.textContent).toContain("distributions");
    expect(container.textContent).toContain("Sync pending");

    act(() => {
      root.unmount();
    });
  });

  it("renders absent profile and distribution data as explicit states instead of placeholders", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => createOverviewResponse({
      profile: {
        kycStatus: null,
        complianceStatus: null,
        profileCompletedAt: null
      },
      summary: {
        historicalInvestedMinor: "0",
        historicalInvestedCurrency: "LAMPORTS",
        currentlyOwnedFractions: 1,
        readyToStakeCount: 1,
        readyToUnstakeCount: 0,
        syncPendingCount: 0,
        unsupportedCount: 0,
        preparedDistributionMinor: "0",
        preparedDistributionCurrency: null
      },
      recentActivity: []
    })));

    const { container, root } = renderModule();

    await flush();

    expect(container.textContent).toContain("Not available yet");
    expect(container.textContent).toContain("No prepared distribution run yet");
    expect(container.textContent).toContain("No stake or unstake events recorded for this wallet yet.");
    expect(container.textContent).not.toContain("unknown");
    expect(container.textContent).not.toContain("No finalized run");

    act(() => {
      root.unmount();
    });
  });
});
