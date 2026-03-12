 "use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
          aria-label="Buscar propiedad"
          placeholder="Buscar por nombre o ciudad"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <select
          aria-label="Filtrar por ciudad"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          className="h-[46px] w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 text-sm text-slate-100 outline-none focus:border-cyan-300/60"
        >
          <option value="">Todas las ciudades</option>
          {cityOptions.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        <select
          aria-label="Filtrar por estado"
          value={status}
          onChange={(event) => setStatus(event.target.value as ListingStatus | "")}
          className="h-[46px] w-full rounded-xl border border-white/15 bg-slate-900/70 px-4 text-sm text-slate-100 outline-none focus:border-cyan-300/60"
        >
          <option value="">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="funding">Funding</option>
          <option value="sold-out">Sold out</option>
        </select>

        <Input
          aria-label="ROI minimo"
          min={0}
          type="number"
          placeholder="ROI minimo %"
          value={minRoi}
          onChange={(event) => setMinRoi(event.target.value)}
        />
      </div>

      <div className="flex justify-end">
        <Link
          href="#"
          onClick={(event) => {
            event.preventDefault();
            clearFilters();
          }}
          className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          Clear filters
        </Link>
      </div>
    </div>
  );
}
