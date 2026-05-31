"use client";

import { Card } from "@/components/ui/card";
import { H2 } from "@/components/ui/typography";
import { useI18n } from "@/components/i18n/locale-provider";
import {
  formatMarketplaceDetailUsd,
  shouldRenderMarketplaceDetailMetric
} from "@/components/marketplace/property-detail-formatters";
import type { PropertyEconomics } from "@/lib/property-service";

type PropertyDetailDealEconomicsCardProps = {
  economics: PropertyEconomics;
};

export function PropertyDetailDealEconomicsCard({ economics }: PropertyDetailDealEconomicsCardProps) {
  const { locale, t } = useI18n();

  return (
    <Card className="space-y-3">
      <H2 className="text-2xl text-white">{t({ en: "Deal economics", es: "Economia del deal", pt: "Economia do deal" })}</H2>
      <div className="grid gap-2 text-sm text-slate-300">
        {shouldRenderMarketplaceDetailMetric(economics.purchasePriceUsd) ? <p>{t({ en: "Purchase price", es: "Purchase Price", pt: "Purchase Price" })}: {formatMarketplaceDetailUsd(economics.purchasePriceUsd, locale)}</p> : null}
        {shouldRenderMarketplaceDetailMetric(economics.afterRepairValueUsd) ? <p>{t({ en: "After Repair Value (ARV)", es: "After Repair Value (ARV)", pt: "After Repair Value (ARV)" })}: {formatMarketplaceDetailUsd(economics.afterRepairValueUsd, locale)}</p> : null}
        {shouldRenderMarketplaceDetailMetric(economics.rehabBudgetUsd) ? <p>{t({ en: "Rehab budget", es: "Rehab Budget", pt: "Rehab Budget" })}: {formatMarketplaceDetailUsd(economics.rehabBudgetUsd, locale)}</p> : null}
        {shouldRenderMarketplaceDetailMetric(economics.closingCostsUsd) ? <p>{t({ en: "Closing costs", es: "Closing Costs", pt: "Closing Costs" })}: {formatMarketplaceDetailUsd(economics.closingCostsUsd, locale)}</p> : null}
        {shouldRenderMarketplaceDetailMetric(economics.holdingCostsUsd) ? <p>{t({ en: "Holding & misc.", es: "Holding & Misc.", pt: "Holding & Misc." })}: {formatMarketplaceDetailUsd(economics.holdingCostsUsd, locale)}</p> : null}
        {shouldRenderMarketplaceDetailMetric(economics.sellingCostsUsd) ? <p>{t({ en: "Selling costs", es: "Selling Costs", pt: "Selling Costs" })}: {formatMarketplaceDetailUsd(economics.sellingCostsUsd, locale)}</p> : null}
        {shouldRenderMarketplaceDetailMetric(economics.totalProjectCostUsd) ? <p>{t({ en: "Total project cost", es: "Total Project Cost", pt: "Total Project Cost" })}: {formatMarketplaceDetailUsd(economics.totalProjectCostUsd, locale)}</p> : null}
        {shouldRenderMarketplaceDetailMetric(economics.minimumCapitalRequiredUsd) ? <p>{t({ en: "Minimum capital required", es: "Capital minimo requerido", pt: "Capital minimo requerido" })}: {formatMarketplaceDetailUsd(economics.minimumCapitalRequiredUsd, locale)}</p> : null}
      </div>
    </Card>
  );
}
