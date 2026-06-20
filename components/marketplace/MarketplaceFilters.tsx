 "use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useI18n } from "@/components/i18n/locale-provider";
import type { ListingStatus } from "@/lib/property-service";
import { Input } from "@/components/ui/input";

type MarketplaceFiltersProps = {
  currentFilters: {
    search?: string;
    city?: string;
    status?: ListingStatus;
    minRoi?: number;
  };
  cityOptions: string[];
};

export function MarketplaceFilters({ currentFilters, cityOptions }: MarketplaceFiltersProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [search, setSearch] = useState(currentFilters.search ?? "");
  const [city, setCity] = useState(currentFilters.city ?? "");
  const [status, setStatus] = useState(currentFilters.status ?? "");
  const [minRoi, setMinRoi] = useState(typeof currentFilters.minRoi === "number" ? String(currentFilters.minRoi) : "");

  const query = useMemo(() => {
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (city) {
      params.set("city", city);
    }

    if (status) {
      params.set("status", status);
    }

    if (minRoi.trim()) {
      params.set("minRoi", minRoi.trim());
    }

    return params.toString();
  }, [search, city, status, minRoi]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const target = query ? `/marketplace?${query}` : "/marketplace";
      router.replace(target);
    }, 180);

    return () => clearTimeout(timeout);
  }, [query, router]);

  function clearFilters(): void {
    setSearch("");
    setCity("");
    setStatus("");
    setMinRoi("");
    router.replace("/marketplace");
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          aria-label={t({ en: "Search property", es: "Buscar propiedad", pt: "Buscar imovel" })}
          placeholder={t({ en: "Search by name or city", es: "Buscar por nombre o ciudad", pt: "Buscar por nome ou cidade" })}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="marketplace-brand-pill h-[46px] rounded-[1.35rem]"
        />

        <select
          aria-label={t({ en: "Filter by city", es: "Filtrar por ciudad", pt: "Filtrar por cidade" })}
          value={city}
          onChange={(event) => setCity(event.target.value)}
          className="glass-control marketplace-brand-pill h-[46px] w-full rounded-[1.35rem] px-4 text-sm text-slate-100 outline-none"
        >
          <option value="">{t({ en: "All cities", es: "Todas las ciudades", pt: "Todas as cidades" })}</option>
          {cityOptions.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        <select
          aria-label={t({ en: "Filter by status", es: "Filtrar por estado", pt: "Filtrar por status" })}
          value={status}
          onChange={(event) => setStatus(event.target.value as ListingStatus | "")}
          className="glass-control marketplace-brand-pill h-[46px] w-full rounded-[1.35rem] px-4 text-sm text-slate-100 outline-none"
        >
          <option value="">{t({ en: "All statuses", es: "Todos los estados", pt: "Todos os status" })}</option>
          <option value="active">{t({ en: "Active", es: "Activo", pt: "Ativo" })}</option>
          <option value="funding">{t({ en: "Funding", es: "Funding", pt: "Captação" })}</option>
          <option value="sold-out">{t({ en: "Sold out", es: "Agotado", pt: "Esgotado" })}</option>
        </select>

        <Input
          aria-label={t({ en: "Minimum ROI", es: "ROI minimo", pt: "ROI minimo" })}
          min={0}
          type="number"
          placeholder={t({ en: "Minimum ROI %", es: "ROI minimo %", pt: "ROI minimo %" })}
          value={minRoi}
          onChange={(event) => setMinRoi(event.target.value)}
          className="marketplace-brand-pill h-[46px] rounded-[1.35rem]"
        />
      </div>

      <div className="flex justify-end">
        <Link
          href="#"
          onClick={(event) => {
            event.preventDefault();
            clearFilters();
          }}
          className="marketplace-brand-pill inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold text-white"
        >
          {t({ en: "Clear filters", es: "Limpiar filtros", pt: "Limpar filtros" })}
        </Link>
      </div>
    </div>
  );
}
