// @vitest-environment jsdom

import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const localeMocks = vi.hoisted(() => ({
  useI18n: vi.fn()
}));

const consoleMocks = vi.hoisted(() => ({
  useAdminNotificationCampaignConsole: vi.fn()
}));

vi.mock("@/components/i18n/locale-provider", () => ({
  useI18n: localeMocks.useI18n
}));

vi.mock("@/features/admin/presentation/use-admin-notification-campaign-console", () => ({
  useAdminNotificationCampaignConsole: consoleMocks.useAdminNotificationCampaignConsole
}));

import { AdminNotificationCampaignConsole } from "@/features/admin/presentation/admin-notification-campaign-console";

type RenderHandle = {
  container: HTMLDivElement;
  root: Root;
};

function renderConsole(): RenderHandle {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  act(() => {
    root.render(createElement(AdminNotificationCampaignConsole, { initialHealth: null }));
  });

  return { container, root };
}

describe("features/admin/presentation/admin-notification-campaign-console", () => {
  beforeEach(() => {
    localeMocks.useI18n.mockReturnValue({
      locale: "es",
      setLocale: vi.fn(),
      t: (text: { es: string }) => text.es
    });

    consoleMocks.useAdminNotificationCampaignConsole.mockReturnValue({
      errorMessage: null,
      form: {
        messageClass: "product_update",
        title: "",
        body: "",
        destinationUrl: "/protected",
        country: "",
        platformFamily: "all",
        appMode: "all"
      },
      health: {
        rollout: {
          installabilityEnabled: true,
          registrationEnabled: true,
          deliveryEnabled: true,
          adminCampaignsEnabled: true
        },
        subscriptions: {
          total: 5,
          active: 3,
          revoked: 1,
          failing: 1,
          gone: 0,
          byPlatform: {},
          newLast24h: 1
        },
        deliveries: {
          processedAttempts: 5,
          delivered: 2,
          pruned: 1,
          failed: 1,
          processedLast24h: 4
        }
      },
      isLoading: false,
      preview: {
        eligibleWalletCount: 2,
        eligibleSubscriptionCount: 3,
        excludedWalletCount: 0,
        blockedReasons: [],
        audienceCap: 100,
        audienceHash: "hash_1234567890abcdef",
        sampleWallets: [
          {
            walletPublicKey: "Wallet11111111111111111111111111111111",
            country: "CO",
            activeSubscriptionCount: 2,
            platformFamily: "ios",
            appMode: "standalone"
          }
        ]
      },
      runDryRun: vi.fn(),
      runPreview: vi.fn(),
      runQueueCampaign: vi.fn(),
      setForm: vi.fn(),
      statusMessage: "Preview cargado."
    });
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.clearAllMocks();
  });

  it("renders health, campaign controls, and preview data through the split subcomponents", () => {
    const { container, root } = renderConsole();

    expect(container.textContent).toContain("Campanas push");
    expect(container.textContent).toContain("active subscriptions");
    expect(container.textContent).toContain("eligible wallets");
    expect(container.textContent).toContain("Wallet11111111111111111111111111111111");

    act(() => {
      root.unmount();
    });
  });
});
