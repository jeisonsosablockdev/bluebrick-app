import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pageMocks = vi.hoisted(() => ({
  getAuthenticatedPublicKeyFromCookies: vi.fn(),
  getServerLocale: vi.fn(),
  readMarketplaceRecordsResultForServer: vi.fn(),
  listMarketplaceProperties: vi.fn(),
  listMarketplacePropertyCities: vi.fn(),
  getRoleForWallet: vi.fn()
}));

vi.mock("@/components/WalletModal", () => ({
  WalletModal: () => createElement("div", null, "wallet-modal")
}));

vi.mock("@/components/marketplace/MarketplaceFilters", () => ({
  MarketplaceFilters: () => createElement("div", null, "marketplace-filters")
}));

vi.mock("@/components/marketplace/MarketplaceExperience", () => ({
  MarketplaceExperience: () => createElement("div", null, "marketplace-experience")
}));

vi.mock("@/components/dashboard/dashboard-charts", () => ({
  DashboardCharts: ({ context }: { context: string }) => createElement("div", { "data-testid": `dashboard-charts-${context}` }, `charts:${context}`)
}));

vi.mock("@/components/sections/footer", () => ({
  FooterSection: () => createElement("footer", { "data-testid": "app-footer" }, "app-footer")
}));

vi.mock("@/components/ui/card", () => ({
  Card: ({ children }: { children: ReactNode }) => createElement("div", null, children)
}));

vi.mock("@/components/ui/typography", () => ({
  H1: ({ children }: { children: ReactNode }) => createElement("h1", null, children),
  Lead: ({ children }: { children: ReactNode }) => createElement("p", null, children)
}));

vi.mock("@/lib/auth", () => ({
  getAuthenticatedPublicKeyFromCookies: pageMocks.getAuthenticatedPublicKeyFromCookies
}));

vi.mock("@/lib/i18n-server", () => ({
  getServerLocale: pageMocks.getServerLocale
}));

vi.mock("@/lib/i18n", () => ({
  DEFAULT_LOCALE: "es",
  localize: (_locale: string, text: { en: string }) => text.en
}));

vi.mock("@/lib/property-marketplace-server", () => ({
  readMarketplaceRecordsResultForServer: pageMocks.readMarketplaceRecordsResultForServer,
  listMarketplaceProperties: pageMocks.listMarketplaceProperties,
  listMarketplaceMapEntries: vi.fn(() => []),
  listMarketplacePropertyCities: pageMocks.listMarketplacePropertyCities
}));

vi.mock("@/lib/rbac", () => ({
  getRoleForWallet: pageMocks.getRoleForWallet
}));

import MarketplacePage from "@/app/marketplace/page";
import { dynamic, revalidate } from "@/app/marketplace/page";

const originalNodeEnv = process.env.NODE_ENV;
const originalFlag = process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES;

function setNodeEnv(value: string | undefined): void {
  const env = process.env as Record<string, string | undefined>;

  if (value === undefined) {
    delete env.NODE_ENV;
    return;
  }

  env.NODE_ENV = value;
}

async function renderMarketplacePage() {
  return renderToStaticMarkup(await MarketplacePage({
    searchParams: Promise.resolve({})
  }));
}

describe("app/marketplace/page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    pageMocks.getAuthenticatedPublicKeyFromCookies.mockResolvedValue(null);
    pageMocks.getServerLocale.mockResolvedValue("en");
    pageMocks.readMarketplaceRecordsResultForServer.mockResolvedValue({
      status: "ok",
      source: "empty",
      records: []
    });
    pageMocks.listMarketplaceProperties.mockResolvedValue([]);
    pageMocks.listMarketplacePropertyCities.mockResolvedValue([]);
    pageMocks.getRoleForWallet.mockReturnValue(undefined);
  });

  afterEach(() => {
    setNodeEnv(originalNodeEnv);

    if (originalFlag === undefined) {
      delete process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES;
    } else {
      process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES = originalFlag;
    }
  });

  it("shows marketplace placeholder charts outside production by default", async () => {
    setNodeEnv("development");
    delete process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES;

    const html = await renderMarketplacePage();

    expect(html).toContain("dashboard-charts-marketplace");
  });

  it("hides marketplace placeholder charts in production-like builds", async () => {
    setNodeEnv("production");
    delete process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES;

    const html = await renderMarketplacePage();

    expect(html).not.toContain("dashboard-charts-marketplace");
  });

  it("allows reactivating marketplace placeholder charts with the public flag", async () => {
    setNodeEnv("production");
    process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES = "true";

    const html = await renderMarketplacePage();

    expect(html).toContain("dashboard-charts-marketplace");
  });

  it("renders the shared footer on marketplace", async () => {
    const html = await renderMarketplacePage();

    expect(html).toContain("app-footer");
  });

  it("shows a safe degraded data notice while keeping marketplace content available", async () => {
    pageMocks.readMarketplaceRecordsResultForServer.mockResolvedValueOnce({
      status: "degraded",
      source: "snapshot",
      records: [],
      errorCode: "PERSISTED_MARKETPLACE_READ_FAILED"
    });
    pageMocks.listMarketplaceProperties.mockResolvedValueOnce([
      {
        id: "snapshot-001",
        title: "Snapshot Entry"
      }
    ]);

    const html = await renderMarketplacePage();

    expect(html).toContain("marketplace-experience");
    expect(html).toContain("Marketplace data is temporarily using a fallback source");
    expect(html).not.toContain("PERSISTED_MARKETPLACE_READ_FAILED");
  });

  it("keeps the marketplace route dynamic so Safari does not keep stale deployed entry imagery", () => {
    expect(dynamic).toBe("force-dynamic");
    expect(revalidate).toBe(0);
  });
});
