import type { Metadata } from "next";

import { WalletModal } from "@/components/WalletModal";
import { MarketplaceFilters } from "@/components/marketplace/MarketplaceFilters";
import { MarketplaceGridClient } from "@/components/marketplace/MarketplaceGridClient";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { Card } from "@/components/ui/card";
import { H1, Lead } from "@/components/ui/typography";
import { getAuthenticatedPublicKeyFromCookies } from "@/lib/auth";
import { getServerLocale } from "@/lib/i18n-server";
import { localize } from "@/lib/i18n";
import { type ListingStatus, type PropertyFilters } from "@/lib/property-service";
import { listMarketplaceProperties, listMarketplacePropertyCities } from "@/lib/property-marketplace-server";
import { getRoleForWallet } from "@/lib/rbac";
import { isMarketplaceReleaseControlledElementVisible } from "@/lib/release-module-visibility";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Marketplace",
  description: "Browse tokenized property listings with pricing, supply, and ROI context.",
  path: "/marketplace",
  section: "marketplace"
});

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

async function safeListMarketplacePropertyCities() {
  try {
    return await listMarketplacePropertyCities();
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
  const authenticatedPublicKey = await getAuthenticatedPublicKeyFromCookies();
  const locale = await getServerLocale();
  const filters = parseFilters(await searchParams);
  const properties = await safeListMarketplaceProperties(filters);
  const cityOptions = await safeListMarketplacePropertyCities();

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <WalletModal
        initialAuth={{
          authenticated: Boolean(authenticatedPublicKey),
          pubkey: authenticatedPublicKey,
          role: authenticatedPublicKey ? getRoleForWallet(authenticatedPublicKey) : undefined
        }}
      />

      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">
          {localize(locale, { en: "Marketplace", es: "Marketplace", pt: "Marketplace" })}
        </p>
        <H1 className="text-white">
          {localize(locale, {
            en: "Tokenized property marketplace",
            es: "Marketplace de propiedades tokenizadas",
            pt: "Marketplace de propriedades tokenizadas"
          })}
        </H1>
        <Lead className="max-w-3xl">
          {localize(locale, {
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
        {properties.length === 0 ? (
          <Card className="p-4 text-sm text-slate-300">
            {localize(locale, {
              en: "There are no properties matching the selected filters.",
              es: "No hay propiedades para los filtros seleccionados.",
              pt: "Nao ha propriedades para os filtros selecionados."
            })}
          </Card>
        ) : <MarketplaceGridClient properties={properties} />}
      </section>

      {isMarketplaceReleaseControlledElementVisible("placeholder-charts") ? (
        <section className="mt-8">
          <DashboardCharts context="marketplace" />
        </section>
      ) : null}
    </main>
  );
}
