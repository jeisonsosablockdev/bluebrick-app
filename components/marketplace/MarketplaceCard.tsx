"use client";

import Image from "next/image";

import { useI18n } from "@/components/i18n/locale-provider";
import type { PropertyListItem } from "@/lib/property-service";
import { Card } from "@/components/ui/card";
import { listingStatusClasses, listingStatusLabel } from "@/components/marketplace/status-utils";

type MarketplaceCardProps = {
  property: PropertyListItem;
  onOpenDetail: (id: string) => void;
};

export function MarketplaceCard({ property, onOpenDetail }: MarketplaceCardProps) {
  const { locale, t } = useI18n();

  return (
    <Card className="overflow-hidden p-0">
      <button
        type="button"
        className="block w-full text-left"
        onClick={() => onOpenDetail(property.id)}
        aria-label={`${t({ en: "View details for", es: "Ver detalle de", pt: "Ver detalhes de" })} ${property.title}`}
      >
        <Image src={property.image} alt={property.title} width={600} height={360} className="h-44 w-full object-cover" />
      </button>
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-white">{property.title}</h3>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${listingStatusClasses(property.listingStatus)}`}>
            {listingStatusLabel(property.listingStatus, locale)}
          </span>
        </div>
        <p className="text-sm text-slate-400">{property.locationLabel}</p>
        <p className="text-sm text-cyan-200">
          {t({ en: "Fraction price", es: "Precio Fracción", pt: "Preco Fração" })}: ${property.nftPriceUsd.toFixed(2)}
        </p>
        <p className="text-sm font-semibold text-cyan-300">
          {t({ en: "Estimated ROI", es: "ROI estimado", pt: "ROI estimado" })}: {property.annualRoiPct.toFixed(1)}%
        </p>

        <button
          type="button"
          onClick={() => onOpenDetail(property.id)}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-white/25 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
        >
          {t({ en: "View details", es: "Ver detalle", pt: "Ver detalhes" })}
        </button>
      </div>
    </Card>
  );
}
