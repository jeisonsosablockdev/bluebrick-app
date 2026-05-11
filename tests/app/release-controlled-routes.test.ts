import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigationMocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  })
}));

vi.mock("next/navigation", () => ({
  notFound: navigationMocks.notFound
}));

vi.mock("@/components/dashboard/portfolio-module", () => ({
  PortfolioModule: () => null
}));

vi.mock("@/components/dashboard/stake-module", () => ({
  StakeModule: () => null
}));

vi.mock("@/components/dashboard/rentas-module", () => ({
  RentasModule: () => null
}));

vi.mock("@/components/dashboard/historial-module", () => ({
  HistorialModule: () => null
}));

vi.mock("@/components/admin/treasury-console", () => ({
  TreasuryConsole: () => null
}));

vi.mock("@/components/admin/distributions-console", () => ({
  DistributionsConsole: () => null
}));

vi.mock("@/components/admin/core-candy-machine-panel", () => ({
  CoreCandyMachinePanel: () => null
}));

vi.mock("@/components/admin/mint-orchestrator-signing-panel", () => ({
  MintOrchestratorSigningPanel: () => null
}));

vi.mock("@/components/admin/admin-module-placeholder", () => ({
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
  const [portfolio, stake, rentas, historial, treasury, distributions] = await Promise.all([
    import("@/app/protected/portfolio/page"),
    import("@/app/protected/stake/page"),
    import("@/app/protected/rentas/page"),
    import("@/app/protected/historial/page"),
    import("@/app/admin/treasury/page"),
    import("@/app/admin/distributions/page")
  ]);

  return [portfolio.default, stake.default, rentas.default, historial.default, treasury.default, distributions.default];
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

    const syncPages = await loadSyncPages();
    const asyncPages = await loadAsyncPages();

    for (const page of syncPages) {
      expect(() => page()).toThrow("NEXT_NOT_FOUND");
    }

    for (const page of asyncPages) {
      await expect(page()).rejects.toThrow("NEXT_NOT_FOUND");
    }
  });
});
