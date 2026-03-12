import { MarketplaceFilters } from "@/components/marketplace/MarketplaceFilters";
import { MarketplaceGridClient } from "@/components/marketplace/MarketplaceGridClient";
import { Card } from "@/components/ui/card";
import { H1, Lead } from "@/components/ui/typography";
import { listProperties, PROPERTY_CITIES, type ListingStatus, type PropertyFilters } from "@/lib/property-service";

type MarketplacePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

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
  const properties = listProperties(filters);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <section className="space-y-3">
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Marketplace</p>
        <H1 className="text-white">Marketplace de propiedades tokenizadas</H1>
        <Lead className="max-w-3xl">
          Revisa disponibilidad, supply y datos relevantes de inversion antes de comprar fracciones NFT.
        </Lead>
      </section>

      <section className="mt-6">
        <MarketplaceFilters currentFilters={filters} cityOptions={PROPERTY_CITIES} />
      </section>

      <section className="mt-6">
        {properties.length === 0 ? (
          <Card className="p-4 text-sm text-slate-300">No hay propiedades para los filtros seleccionados.</Card>
        ) : <MarketplaceGridClient properties={properties} />}
      </section>
    </main>
  );
}
