"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { PropertyDetail, PropertyListItem } from "@/lib/property-service";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarketplaceCard } from "@/components/marketplace/MarketplaceCard";
import { PropertyDetailContent } from "@/components/marketplace/PropertyDetailContent";

type MarketplaceGridClientProps = {
  properties: PropertyListItem[];
};

type PropertyDetailResponse = {
  data?: PropertyDetail;
  error?: string;
};

export function MarketplaceGridClient({ properties }: MarketplaceGridClientProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    const controller = new AbortController();

    async function loadDetail() {
      setIsLoading(true);
      setError(null);
      setDetail(null);

      try {
        const response = await fetch(`/properties/${selectedId}`, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal
        });

        const payload = (await response.json()) as PropertyDetailResponse;

        if (!response.ok || !payload.data) {
          throw new Error(payload.error ?? "No se pudo cargar el detalle.");
        }

        setDetail(payload.data);
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(fetchError instanceof Error ? fetchError.message : "Error inesperado al cargar detalle.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      controller.abort();
    };
  }, [selectedId]);

  function closeModal(): void {
    setSelectedId(null);
    setDetail(null);
    setError(null);
    setIsLoading(false);
  }

  async function retryLoad(): Promise<void> {
    if (!selectedId) {
      return;
    }

    setDetail(null);
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/properties/${selectedId}`, {
        method: "GET",
        cache: "no-store"
      });
      const payload = (await response.json()) as PropertyDetailResponse;

      if (!response.ok || !payload.data) {
        throw new Error(payload.error ?? "No se pudo cargar el detalle.");
      }

      setDetail(payload.data);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Error inesperado al cargar detalle.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <MarketplaceCard key={property.id} property={property} onOpenDetail={setSelectedId} />
        ))}
      </div>

      {selectedId ? (
        <div className="fixed inset-0 z-50 bg-black/70 p-2 sm:p-4" role="presentation" onClick={closeModal}>
          <div
            className="mx-auto h-full w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/20 bg-[#0b1021] p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Detalle de propiedad"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-cyan-300">Detalle de Propiedad</p>
              <button
                type="button"
                className="min-h-11 rounded-md px-3 text-white/80 transition hover:bg-white/10"
                aria-label="Cerrar modal"
                onClick={closeModal}
              >
                Cerrar
              </button>
            </div>

            {isLoading ? (
              <Card className="h-72 animate-pulse bg-slate-900/70">
                <span className="sr-only">Cargando detalle</span>
              </Card>
            ) : null}

            {error ? (
              <Card className="space-y-3 border-rose-400/30 bg-rose-500/10 p-4 text-rose-100">
                <p className="text-sm">{error}</p>
                <div className="flex gap-2">
                  <Button className="min-h-11" onClick={() => void retryLoad()}>
                    Reintentar
                  </Button>
                  <Link
                    href={`/marketplace/${selectedId}`}
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/25 px-4 text-sm font-semibold text-white"
                  >
                    Abrir pagina completa
                  </Link>
                </div>
              </Card>
            ) : null}

            {detail ? <PropertyDetailContent property={detail} imageClassName="h-56 md:h-72" /> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
