import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  })
}));

vi.mock("next/navigation", () => ({
  notFound: navigationMocks.notFound
}));

vi.mock("@/features/investor-portfolio/presentation/portfolio-module", () => ({
  PortfolioModule: () => null
}));

vi.mock("@/features/staking-distribution/presentation/stake-module", () => ({
  StakeModule: () => null
}));

vi.mock("@/features/staking-distribution/presentation/rentas-module", () => ({
  RentasModule: () => null
}));

vi.mock("@/features/profile/presentation/historial-module", () => ({
  HistorialModule: () => null
}));

vi.mock("@/features/admin/presentation/treasury-console", () => ({
  TreasuryConsole: () => null
}));

vi.mock("@/features/admin/presentation/distributions-console", () => ({
  DistributionsConsole: () => null
}));

vi.mock("@/features/admin/presentation/core-candy-machine-panel", () => ({
  CoreCandyMachinePanel: () => null
}));

vi.mock("@/features/admin/presentation/mint-orchestrator-signing-panel", () => ({
  MintOrchestratorSigningPanel: () => null
}));

vi.mock("@/features/admin/presentation/admin-module-placeholder", () => ({
  AdminModulePlaceholder: () => null
}));

vi.mock("@/components/ui/card", () => ({
  Card: () => null
}));

vi.mock("@/lib/i18n-server", () => ({
  getServerLocale: vi.fn(async () => "en")
}));

vi.mock("@/lib/i18n", () => ({
  localize: (_locale: string, text: { en: string }) => text.en
}));

const originalNodeEnv = process.env.NODE_ENV;
const originalFlag = process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES;

function setNodeEnv(value: string | undefined): void {
  const env = process.env as Record<string, string | undefined>;

  if (typeof value === "undefined") {
    delete env.NODE_ENV;
    return;
  }

  env.NODE_ENV = value;
}

async function loadSyncPages() {
  const [treasury, distributions] = await Promise.all([
    import("../../apps/web/src/app/admin/treasury/page"),
    import("../../apps/web/src/app/admin/distributions/page")
  ]);

  return {
    alwaysVisiblePages: [distributions.default],
    releaseControlledPages: [treasury.default]
  };
}

async function loadAsyncPages() {
  const [mint, settings] = await Promise.all([
    import("@/app/admin/mint/page"),
    import("@/app/admin/settings/page")
  ]);

  return [mint.default, settings.default];
}

describe("release-controlled routes", () => {
  beforeEach(() => {
    navigationMocks.notFound.mockClear();
  });

  afterEach(() => {
    setNodeEnv(originalNodeEnv);

    if (originalFlag === undefined) {
      delete process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES;
    } else {
      process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES = originalFlag;
    }
  });

  it("returns notFound for release-controlled routes in production-like builds", async () => {
    setNodeEnv("production");
    delete process.env.NEXT_PUBLIC_ENABLE_DEV_ONLY_MODULES;

    const { alwaysVisiblePages, releaseControlledPages } = await loadSyncPages();
    const asyncPages = await loadAsyncPages();

    for (const page of alwaysVisiblePages) {
      try {
        page();
      } catch (error) {
        expect(error instanceof Error ? error.message : String(error)).not.toContain("NEXT_NOT_FOUND");
      }
    }
    expect(navigationMocks.notFound).not.toHaveBeenCalled();

    for (const page of releaseControlledPages) {
      expect(() => page()).toThrow("NEXT_NOT_FOUND");
    }

    for (const page of asyncPages) {
      await expect(page()).rejects.toThrow("NEXT_NOT_FOUND");
    }
  });
});
