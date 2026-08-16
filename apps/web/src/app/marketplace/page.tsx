import type { Metadata } from "next";
import { Suspense } from "react";

import { MainTopNavigationModal } from "@/components/main-top-navigation-modal";
import { MarketplaceFilters } from "@/features/marketplace/presentation/MarketplaceFilters";
import { MarketplaceExperience } from "@/features/marketplace/presentation/MarketplaceExperience";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { Card } from "@/components/ui/card";
import { H1, Lead } from "@/components/ui/typography";
import { FooterSection } from "@/features/landing/presentation/footer";
import { DEFAULT_LOCALE, localize } from "@/lib/i18n";
import { type ListingStatus, type PropertyFilters } from "@/lib/property-service";
import {
  listMarketplaceMapEntries,
  listMarketplaceProperties,
  listMarketplacePropertyCities,
  readMarketplaceRecordsResultForServer,
  type MarketplaceRecordsResult
} from "@/lib/property-marketplace-server";
import { isMarketplaceReleaseControlledElementVisible } from "@/lib/release-module-visibility";
import { createPageMetadata } from "@/lib/seo";
import { WalletRuntimeProvider } from "@/components/wallet/wallet-runtime-provider";
import { getMarketplaceMapboxAccessToken, getMarketplaceMapboxStyleUrl } from "@/lib/marketplace-mapbox-config";

export const metadata: Metadata = createPageMetadata({
  title: "Marketplace",
  description: "Browse tokenized property listings with pricing, supply, and ROI context.",
  path: "/marketplace",
  section: "marketplace"
});
export const dynamic = "force-dynamic";
export const revalidate = 0;

type MarketplacePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function safeListMarketplaceProperties(filters: PropertyFilters) {
  try {
    return await listMarketplaceProperties(filters);
  } catch {
    return [];
  }
}

async function safeReadMarketplaceRecordsResult(): Promise<Pick<MarketplaceRecordsResult, "status" | "source" | "errorCode">> {
  try {
    const result = await readMarketplaceRecordsResultForServer();
    return {
      status: result.status,
      source: result.source,
      errorCode: result.errorCode
    };
  } catch {
    return {
      status: "ok",
      source: "empty"
    };
  }
}

async function safeListMarketplacePropertyCities() {
  try {
    return await listMarketplacePropertyCities();
  } catch {
    return [];
  }
}

async function safeListMarketplaceMapEntries(filters: PropertyFilters) {
  try {
    return await listMarketplaceMapEntries(filters);
  } catch {
    return [];
  }
}

function readValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function parseFilters(raw: Record<string, string | string[] | undefined>): PropertyFilters {
  const search = readValue(raw.search)?.trim();
  const city = readValue(raw.city)?.trim();
  const statusRaw = readValue(raw.status)?.trim().toLowerCase();
  const minRoiRaw = readValue(raw.minRoi)?.trim();
  const minRoi = minRoiRaw ? Number(minRoiRaw) : undefined;

  const allowedStatus: ListingStatus[] = ["active", "funding", "sold-out"];
  const status = statusRaw && allowedStatus.includes(statusRaw as ListingStatus) ? (statusRaw as ListingStatus) : undefined;

  return {
    search: search || undefined,
    city: city || undefined,
    status,
    minRoi: typeof minRoi === "number" && Number.isFinite(minRoi) && minRoi >= 0 ? minRoi : undefined
  };
}

export default async function MarketplacePage({ searchParams }: MarketplacePageProps) {
  const filters = parseFilters(await searchParams);
  const readResult = await safeReadMarketplaceRecordsResult();
  const properties = await safeListMarketplaceProperties(filters);
  const mapSources = await safeListMarketplaceMapEntries(filters);
  const cityOptions = await safeListMarketplacePropertyCities();
  const mapboxAccessToken = getMarketplaceMapboxAccessToken();
  const mapboxStyleUrl = getMarketplaceMapboxStyleUrl();
  const isDataDegraded = readResult.status === "degraded";

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <WalletRuntimeProvider>
        <Suspense fallback={null}>
          <MainTopNavigationModal />
        </Suspense>

        <section className="space-y-3">
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
            {localize(DEFAULT_LOCALE, { en: "Marketplace", es: "Marketplace", pt: "Marketplace" })}
          </p>
          <H1 className="text-white">
            {localize(DEFAULT_LOCALE, {
              en: "Tokenized property marketplace",
              es: "Marketplace de propiedades tokenizadas",
              pt: "Marketplace de propriedades tokenizadas"
            })}
          </H1>
          <Lead className="max-w-3xl">
            {localize(DEFAULT_LOCALE, {
              en: "Review availability, supply and investment data before purchasing Fraction fractions.",
              es: "Revisa disponibilidad, supply y datos relevantes de inversion antes de comprar fracciones Fracción.",
              pt: "Revise disponibilidade, supply e dados relevantes de investimento antes de comprar fracoes Fração."
            })}
          </Lead>
        </section>

        <section className="mt-6">
          <MarketplaceFilters currentFilters={filters} cityOptions={cityOptions} />
        </section>

        <section className="mt-6">
          {isDataDegraded ? (
            <Card className="marketplace-depth-inset mb-4 p-4 text-sm text-amber-100">
              {localize(DEFAULT_LOCALE, {
                en: "Marketplace data is temporarily using a fallback source. Listings remain available while we refresh the primary source.",
                es: "Los datos del marketplace estan usando temporalmente una fuente de respaldo. Las propiedades siguen disponibles mientras actualizamos la fuente principal.",
                pt: "Os dados do marketplace estao usando temporariamente uma fonte de backup. As propriedades continuam disponiveis enquanto atualizamos a fonte principal."
              })}
            </Card>
          ) : null}

          {properties.length === 0 ? (
            <Card className="marketplace-depth-inset p-4 text-sm text-slate-300">
              {localize(DEFAULT_LOCALE, {
                en: "There are no properties matching the selected filters.",
                es: "No hay propiedades para los filtros seleccionados.",
                pt: "Nao ha propriedades para os filtros selecionados."
              })}
            </Card>
          ) : (
            <MarketplaceExperience
              properties={properties}
              mapSources={mapSources}
              mapboxAccessToken={mapboxAccessToken}
              mapboxStyleUrl={mapboxStyleUrl}
            />
          )}
        </section>

        {isMarketplaceReleaseControlledElementVisible("placeholder-charts") ? (
          <section className="mt-8">
            <DashboardCharts context="marketplace" />
          </section>
        ) : null}

        <FooterSection />
      </WalletRuntimeProvider>
    </main>
  );
}
