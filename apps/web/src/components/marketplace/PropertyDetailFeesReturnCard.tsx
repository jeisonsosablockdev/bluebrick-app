"use client";

import { Card } from "@/components/ui/card";
import { H2 } from "@/components/ui/typography";
import { useI18n } from "@/components/i18n/locale-provider";
import {
  formatMarketplaceDetailPercent,
  formatMarketplaceDetailUsd,
  shouldRenderMarketplaceDetailMetric
} from "@/components/marketplace/property-detail-formatters";
import type { PropertyEconomics } from "@/lib/property-service";

type PropertyDetailFeesReturnCardProps = {
  economics: PropertyEconomics;
};

export function PropertyDetailFeesReturnCard({ economics }: PropertyDetailFeesReturnCardProps) {
  const { locale, t } = useI18n();

  return (
    <Card className="marketplace-detail-card space-y-3">
      <H2 className="text-2xl text-white">{t({ en: "Fees and projected return", es: "Fees y retorno proyectado", pt: "Fees e retorno projetado" })}</H2>
      <div className="grid gap-2 text-sm text-slate-300">
        {shouldRenderMarketplaceDetailMetric(economics.structuringFeeUsd) ? <p>{t({ en: "Structuring fee", es: "Structuring Fee", pt: "Structuring Fee" })}: {formatMarketplaceDetailUsd(economics.structuringFeeUsd, locale)}</p> : null}
        {shouldRenderMarketplaceDetailMetric(economics.grossProfitProjectedUsd) ? <p>{t({ en: "Net profit (before distribution)", es: "Net Profit (before distribution)", pt: "Net Profit (before distribution)" })}: {formatMarketplaceDetailUsd(economics.grossProfitProjectedUsd, locale)}</p> : null}
        {shouldRenderMarketplaceDetailMetric(economics.managementFeeUsd) ? <p>{t({ en: "Management fee", es: "Management Fee", pt: "Management Fee" })}: {formatMarketplaceDetailUsd(economics.managementFeeUsd, locale)}</p> : null}
        {shouldRenderMarketplaceDetailMetric(economics.brokerFeeUsd) ? <p>{t({ en: "Broker fee", es: "Broker Fee", pt: "Broker Fee" })}: {formatMarketplaceDetailUsd(economics.brokerFeeUsd, locale)}</p> : null}
        {shouldRenderMarketplaceDetailMetric(economics.netInvestorProfitUsd) ? <p>{t({ en: "Net profit for investor", es: "Net Profit for Investor", pt: "Net Profit for Investor" })}: {formatMarketplaceDetailUsd(economics.netInvestorProfitUsd, locale)}</p> : null}
        {economics.projectedNetRoiPct !== null ? <p>{t({ en: "Projected ROI", es: "ROI proyectado", pt: "ROI projetado" })}: {formatMarketplaceDetailPercent(economics.projectedNetRoiPct, locale)}</p> : null}
      </div>
    </Card>
  );
}
