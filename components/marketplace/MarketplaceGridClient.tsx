"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import type { PropertyDetail, PropertyListItem } from "@/lib/property-service";
import { useI18n } from "@/components/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarketplaceCard } from "@/components/marketplace/MarketplaceCard";
import { PropertyDetailContent } from "@/components/marketplace/PropertyDetailContent";
import { createDetailOpenMotionVariants, MOTION_FAST_OPACITY_TRANSITION } from "@/lib/motion";

type MarketplaceGridClientProps = {
  properties: PropertyListItem[];
};

type PropertyDetailResponse = {
  data?: PropertyDetail;
  error?: string;
};

export function MarketplaceGridClient({ properties }: MarketplaceGridClientProps) {
  const { t } = useI18n();
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
          signal: controller.signal
        });

        const payload = (await response.json()) as PropertyDetailResponse;

        if (!response.ok || !payload.data) {
          throw new Error(
            payload.error
            ?? t({
              en: "Could not load property details.",
              es: "No se pudo cargar el detalle.",
              pt: "Nao foi possivel carregar os detalhes."
            })
          );
        }

        setDetail(payload.data);
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : t({
              en: "Unexpected error while loading details.",
              es: "Error inesperado al cargar detalle.",
              pt: "Erro inesperado ao carregar detalhes."
            })
        );
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
  }, [selectedId, t]);

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
        method: "GET"
      });
      const payload = (await response.json()) as PropertyDetailResponse;

      if (!response.ok || !payload.data) {
        throw new Error(
          payload.error
          ?? t({
            en: "Could not load property details.",
            es: "No se pudo cargar el detalle.",
            pt: "Nao foi possivel carregar os detalhes."
          })
        );
      }

      setDetail(payload.data);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : t({
            en: "Unexpected error while loading details.",
            es: "Error inesperado al cargar detalle.",
            pt: "Erro inesperado ao carregar detalhes."
          })
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {properties.map((property, index) => (
          <MarketplaceCard
            key={property.id}
            property={property}
            onOpenDetail={setSelectedId}
            prioritizeImage={index === 0}
          />
        ))}
      </div>

      <AnimatePresence>
        {selectedId ? (
          <motion.div
            key={`property-modal-${selectedId}`}
            className="fixed inset-0 z-50 bg-black/70 p-2 backdrop-blur-sm sm:p-4"
            role="presentation"
            onClick={closeModal}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={MOTION_FAST_OPACITY_TRANSITION}
          >
            <motion.div
              className="glass-modal-surface mx-auto h-full w-full max-w-5xl overflow-y-auto rounded-2xl p-4 sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-label={t({ en: "Property details", es: "Detalle de propiedad", pt: "Detalhes do imovel" })}
              onClick={(event) => event.stopPropagation()}
              variants={createDetailOpenMotionVariants()}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-cyan-300">
                  {t({ en: "Property Details", es: "Detalle de Propiedad", pt: "Detalhes do Imovel" })}
                </p>
                <button
                  type="button"
                  className="min-h-11 rounded-md px-3 text-white/80 transition hover:bg-white/10"
                  aria-label={t({ en: "Close modal", es: "Cerrar modal", pt: "Fechar modal" })}
                  onClick={closeModal}
                >
                  {t({ en: "Close", es: "Cerrar", pt: "Fechar" })}
                </button>
              </div>

              {isLoading ? (
                <Card className="space-y-4 border-white/10 bg-slate-900/70 p-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
                    <p className="text-sm text-white/85">
                      {t({ en: "Opening property...", es: "Abriendo propiedad...", pt: "Abrindo propriedade..." })}
                    </p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-300"
                      initial={{ width: "18%" }}
                      animate={{ width: ["28%", "74%", "92%"] }}
                      transition={{ duration: 1.6, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="h-56 animate-pulse rounded-2xl bg-white/8" />
                    <div className="space-y-3">
                      <div className="h-6 w-3/4 animate-pulse rounded bg-white/10" />
                      <div className="h-4 w-full animate-pulse rounded bg-white/10" />
                      <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
                      <div className="h-11 w-40 animate-pulse rounded-full bg-white/10" />
                    </div>
                  </div>
                </Card>
              ) : null}

              {error ? (
                <Card className="space-y-3 border-rose-400/30 bg-rose-500/10 p-4 text-rose-100">
                  <p className="text-sm">{error}</p>
                  <div className="flex gap-2">
                    <Button className="min-h-11" onClick={() => void retryLoad()}>
                      {t({ en: "Retry", es: "Reintentar", pt: "Tentar novamente" })}
                    </Button>
                    <Link
                      href={`/marketplace/${selectedId}`}
                      className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/25 px-4 text-sm font-semibold text-white"
                    >
                      {t({ en: "Open full page", es: "Abrir pagina completa", pt: "Abrir pagina completa" })}
                    </Link>
                  </div>
                </Card>
              ) : null}

              {detail ? <PropertyDetailContent property={detail} imageClassName="h-56 md:h-72" layoutId={`marketplace-property-${selectedId}`} /> : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
