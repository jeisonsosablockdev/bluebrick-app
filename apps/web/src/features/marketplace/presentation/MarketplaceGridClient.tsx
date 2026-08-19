"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";

import type { PropertyDetail, PropertyListItem } from "@/lib/property-service";
import { useI18n } from "@/components/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MarketplaceCard } from "@/features/marketplace/presentation/MarketplaceCard";
import { PropertyDetailContent } from "@/features/marketplace/presentation/PropertyDetailContent";
import { createDetailOpenMotionVariants, MOTION_FAST_OPACITY_TRANSITION } from "@/lib/motion";

type MarketplaceGridClientProps = {
  properties: PropertyListItem[];
};

type PropertyDetailResponse = {
  data?: PropertyDetail;
  error?: string;
};

const DETAIL_LOADING_PROGRESS = {
  started: 6,
  requestSent: 18,
  responseReceived: 35,
  bodyParsed: 88,
  complete: 100
} as const;

const DETAIL_LOADING_COMPLETE_PAUSE_MS = 140;

function updateLoadingProgress(setProgress: (updater: (current: number) => number) => void, nextProgress: number): void {
  setProgress((current) => Math.max(current, nextProgress));
}

async function readPropertyDetailPayload(response: Response, onProgress: (progress: number) => void): Promise<PropertyDetailResponse> {
  const contentLengthHeader = response.headers.get("content-length");
  const contentLength = contentLengthHeader ? Number(contentLengthHeader) : 0;

  if (!response.body || !Number.isFinite(contentLength) || contentLength <= 0) {
    onProgress(72);
    return (await response.json()) as PropertyDetailResponse;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    if (value) {
      chunks.push(value);
      receivedBytes += value.byteLength;
      const bodyProgress = 35 + Math.min(47, (receivedBytes / contentLength) * 47);
      onProgress(bodyProgress);
    }
  }

  const payloadBytes = new Uint8Array(receivedBytes);
  let offset = 0;

  for (const chunk of chunks) {
    payloadBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return JSON.parse(new TextDecoder().decode(payloadBytes)) as PropertyDetailResponse;
}

function waitForLoadingCompletion(): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, DETAIL_LOADING_COMPLETE_PAUSE_MS);
  });
}

export function MarketplaceGridClient({ properties }: MarketplaceGridClientProps) {
  const { t } = useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    const originalBodyOverflow = document.body.style.overflow;
    const originalDocumentOverflow = document.documentElement.style.overflow;
    const originalBodyPaddingRight = document.body.style.paddingRight;
    const documentClientWidth = document.documentElement.clientWidth;
    const scrollbarWidth = documentClientWidth > 0 ? window.innerWidth - documentClientWidth : 0;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalDocumentOverflow;
      document.body.style.paddingRight = originalBodyPaddingRight;
    };
  }, [selectedId]);

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const progressTimer = window.setInterval(() => {
      setLoadingProgress((current) => {
        if (current >= 94) {
          return current;
        }

        return Math.min(94, current + Math.max(0.35, (94 - current) * 0.055));
      });
    }, 180);

    return () => {
      window.clearInterval(progressTimer);
    };
  }, [isLoading]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }

    const controller = new AbortController();

    async function loadDetail() {
      setIsLoading(true);
      setLoadingProgress(DETAIL_LOADING_PROGRESS.started);
      setError(null);
      setDetail(null);

      try {
        updateLoadingProgress(setLoadingProgress, DETAIL_LOADING_PROGRESS.requestSent);

        const response = await fetch(`/properties/${selectedId}`, {
          method: "GET",
          signal: controller.signal
        });

        updateLoadingProgress(setLoadingProgress, DETAIL_LOADING_PROGRESS.responseReceived);

        const payload = await readPropertyDetailPayload(response, (nextProgress) => {
          updateLoadingProgress(setLoadingProgress, nextProgress);
        });

        updateLoadingProgress(setLoadingProgress, DETAIL_LOADING_PROGRESS.bodyParsed);

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

        updateLoadingProgress(setLoadingProgress, DETAIL_LOADING_PROGRESS.complete);
        await waitForLoadingCompletion();

        if (controller.signal.aborted) {
          return;
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
          setLoadingProgress(0);
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
    setLoadingProgress(0);
  }

  async function retryLoad(): Promise<void> {
    if (!selectedId) {
      return;
    }

    setDetail(null);
    setError(null);
    setIsLoading(true);
    setLoadingProgress(DETAIL_LOADING_PROGRESS.started);

    try {
      updateLoadingProgress(setLoadingProgress, DETAIL_LOADING_PROGRESS.requestSent);

      const response = await fetch(`/properties/${selectedId}`, {
        method: "GET"
      });

      updateLoadingProgress(setLoadingProgress, DETAIL_LOADING_PROGRESS.responseReceived);

      const payload = await readPropertyDetailPayload(response, (nextProgress) => {
        updateLoadingProgress(setLoadingProgress, nextProgress);
      });

      updateLoadingProgress(setLoadingProgress, DETAIL_LOADING_PROGRESS.bodyParsed);

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

      updateLoadingProgress(setLoadingProgress, DETAIL_LOADING_PROGRESS.complete);
      await waitForLoadingCompletion();
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
      setLoadingProgress(0);
    }
  }

  const detailModal = (
    <AnimatePresence>
      {selectedId ? (
        <motion.div
          key={`property-modal-${selectedId}`}
          data-testid="marketplace-detail-modal-overlay"
          className="fixed inset-0 z-50 flex items-start justify-center overflow-hidden bg-black/75 p-3 pt-7 backdrop-blur-md sm:p-6 sm:pt-8"
          role="presentation"
          onClick={closeModal}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={MOTION_FAST_OPACITY_TRANSITION}
        >
          <motion.div
            data-testid="marketplace-detail-modal-panel"
            className="marketplace-detail-modal-panel max-h-[calc(100dvh-3rem)] w-full max-w-5xl overflow-y-auto overscroll-contain rounded-2xl p-4 sm:max-h-[calc(100dvh-4rem)] sm:p-6"
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
                className="marketplace-detail-close min-h-11 rounded-full px-4 text-sm font-semibold text-white/80 transition"
                aria-label={t({ en: "Close modal", es: "Cerrar modal", pt: "Fechar modal" })}
                onClick={closeModal}
              >
                {t({ en: "Close", es: "Cerrar", pt: "Fechar" })}
              </button>
            </div>

            {isLoading ? (
              <Card className="marketplace-detail-inset space-y-4 p-4">
                <div className="flex items-center gap-3">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-cyan-300 border-t-transparent" />
                  <p className="text-sm text-white/85">
                    {t({ en: "Opening property...", es: "Abriendo propiedad...", pt: "Abrindo propriedade..." })}
                  </p>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-white/10"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(loadingProgress)}
                >
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-300"
                    initial={false}
                    animate={{ width: `${loadingProgress}%` }}
                    transition={{ duration: 0.24, ease: "easeOut" }}
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
              <Card className="marketplace-detail-inset space-y-3 p-4 text-rose-100">
                <p className="text-sm">{error}</p>
                <div className="flex gap-2">
                  <Button className="min-h-11" onClick={() => void retryLoad()}>
                    {t({ en: "Retry", es: "Reintentar", pt: "Tentar novamente" })}
                  </Button>
                  <Link
                    href={`/marketplace/${selectedId}`}
                    className="marketplace-brand-pill inline-flex min-h-11 items-center justify-center rounded-full px-4 text-sm font-semibold text-white"
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
  );

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

      {typeof document === "undefined" ? detailModal : createPortal(detailModal, document.body)}
    </>
  );
}
