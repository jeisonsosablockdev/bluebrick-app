"use client";

import Image from "next/image";
import { motion } from "motion/react";

import { useI18n } from "@/components/i18n/locale-provider";
import type { PropertyListItem } from "@/lib/property-service";
import { Button } from "@/components/ui/button";
import { listingStatusClasses, listingStatusLabel } from "@/components/marketplace/status-utils";
import { MOTION_FAST_OPACITY_TRANSITION } from "@/lib/motion";

type MarketplaceCardProps = {
  property: PropertyListItem;
  onOpenDetail: (id: string) => void;
  prioritizeImage?: boolean;
};

function formatUsd(value: number | null, locale: string): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "N/A";
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export function MarketplaceCard({ property, onOpenDetail, prioritizeImage = false }: MarketplaceCardProps) {
  const { locale, t } = useI18n();
  const numberLocale = locale === "en" ? "en-US" : locale === "pt" ? "pt-BR" : "es-CO";
  const layoutId = `marketplace-property-${property.id}`;

  return (
    <motion.article
      className="marketplace-depth-card overflow-hidden rounded-2xl p-0"
      layoutId={layoutId}
      transition={MOTION_FAST_OPACITY_TRANSITION}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.992 }}
    >
      <motion.button
        type="button"
        className="block w-full text-left"
        onClick={() => onOpenDetail(property.id)}
        aria-label={`${t({ en: "View details for", es: "Ver detalle de", pt: "Ver detalhes de" })} ${property.title}`}
        whileTap={{ scale: 0.997 }}
      >
        <Image
          src={property.image}
          alt={property.title}
          width={600}
          height={360}
          className="h-44 w-full object-cover"
          loading={prioritizeImage ? "eager" : "lazy"}
          fetchPriority={prioritizeImage ? "high" : "auto"}
          sizes="(min-width: 1024px) 360px, (min-width: 768px) 50vw, 100vw"
        />
      </motion.button>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-white">{property.title}</h3>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${listingStatusClasses(property.listingStatus)}`}>
            {listingStatusLabel(property.listingStatus, locale)}
          </span>
        </div>
        <p className="text-sm text-slate-400">{property.locationLabel}</p>
        <p className="text-sm text-cyan-200">
          {t({ en: "Minimum capital", es: "Capital minimo", pt: "Capital minimo" })}: {formatUsd(property.minimumCapitalRequiredUsd, numberLocale)}
        </p>
        <p className="text-sm font-semibold text-cyan-300">
          {t({ en: "Estimated ROI", es: "ROI estimado", pt: "ROI estimado" })}: {property.annualRoiPct.toFixed(1)}%
        </p>
        {typeof property.projectDurationMonths === "number" && property.projectDurationMonths > 0 ? (
          <p className="text-sm text-slate-300">
            {t({ en: "Duration", es: "Duracion", pt: "Duracao" })}: {property.projectDurationMonths} {t({ en: "months", es: "meses", pt: "meses" })}
          </p>
        ) : null}

        <Button
          type="button"
          onClick={() => onOpenDetail(property.id)}
          variant="outline"
          className="marketplace-brand-pill min-h-11 w-full rounded-full"
        >
          {t({ en: "View details", es: "Ver detalle", pt: "Ver detalhes" })}
        </Button>
      </div>
    </motion.article>
  );
}
