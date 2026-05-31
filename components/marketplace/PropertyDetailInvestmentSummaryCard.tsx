"use client";

import { Card } from "@/components/ui/card";
import { H2 } from "@/components/ui/typography";
import { useI18n } from "@/components/i18n/locale-provider";
import { formatMarketplaceDetailPercent } from "@/components/marketplace/property-detail-formatters";
import type { PropertyDetail } from "@/lib/property-service";

type PropertyDetailInvestmentSummaryCardProps = {
  property: PropertyDetail;
};

export function PropertyDetailInvestmentSummaryCard({ property }: PropertyDetailInvestmentSummaryCardProps) {
  const { locale, t } = useI18n();

  return (
    <Card className="space-y-3">
      <H2 className="text-2xl text-white">
        {t({
          en: "Fractional investment summary",
          es: "Resumen de inversion fraccional",
          pt: "Resumo do investimento fracionado"
        })}
      </H2>
      <p className="text-sm text-slate-300">
        {t({ en: "Total Fraction supply", es: "Supply total Fracciones", pt: "Supply total de Frações" })}: {property.investment.supplyTotal.toLocaleString("en-US")}
      </p>
      <p className="text-sm text-slate-300">
        {t({ en: "Minted/sold Fractions", es: "Fracciones emitidos/vendidos", pt: "Frações emitidos/vendidos" })}: {property.investment.mintedOrSold.toLocaleString("en-US")}
      </p>
      <p className="text-sm text-slate-300">
        {t({ en: "Price per Fraction", es: "Precio por Fracción", pt: "Preco por Fração" })}: ${property.investment.nftPriceUsd.toFixed(2)}
      </p>
      <p className="text-sm text-slate-300">
        {t({ en: "Projected ROI", es: "ROI proyectado", pt: "ROI projetado" })}: {formatMarketplaceDetailPercent(property.economics.projectedNetRoiPct ?? property.investment.annualRoiPct, locale)}
      </p>
      <p className="text-sm text-slate-300">
        {t({ en: "Availability", es: "Disponibilidad", pt: "Disponibilidade" })}: {property.investment.availabilityLabel}
      </p>
    </Card>
  );
}
