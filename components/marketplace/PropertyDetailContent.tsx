"use client";

import { motion } from "motion/react";

import { Card } from "@/components/ui/card";
import { H2 } from "@/components/ui/typography";
import { useI18n } from "@/components/i18n/locale-provider";
import { PropertyDetailGoogleMapsCard } from "@/components/marketplace/PropertyDetailGoogleMapsCard";
import { PropertyDetailHeroSection } from "@/components/marketplace/PropertyDetailHeroSection";
import { PropertyDetailInvestmentSummaryCard } from "@/components/marketplace/PropertyDetailInvestmentSummaryCard";
import {
  formatMarketplaceDetailDate,
  formatMarketplaceDetailLocation,
  formatMarketplaceDetailMonths,
  formatMarketplaceDetailPercent,
  formatMarketplaceDetailUsd,
  shouldRenderMarketplaceDetailMetric
} from "@/components/marketplace/property-detail-formatters";
import type { PropertyDetail } from "@/lib/property-service";
import { createDetailOpenMotionVariants } from "@/lib/motion";

type PropertyDetailContentProps = {
  property: PropertyDetail;
  imageClassName?: string;
  layoutId?: string;
};

export function PropertyDetailContent({ property, imageClassName = "h-64 md:h-80", layoutId }: PropertyDetailContentProps) {
  const { locale, t } = useI18n();
  const motionVariants = createDetailOpenMotionVariants();

  return (
    <>
      <PropertyDetailHeroSection property={property} locale={locale} imageClassName={imageClassName} layoutId={layoutId} />

      <motion.section className="mt-6 grid gap-4 md:grid-cols-2" variants={motionVariants} initial="initial" animate="animate" exit="exit">
        <PropertyDetailInvestmentSummaryCard property={property} />

        <Card className="space-y-3">
          <H2 className="text-2xl text-white">{t({ en: "Property information", es: "Informacion de la propiedad", pt: "Informacoes da propriedade" })}</H2>
          <p className="text-sm text-slate-300">{property.investmentNotes}</p>
          <p className="text-sm text-slate-300">
            {t({ en: "Detailed location", es: "Ubicacion detallada", pt: "Localizacao detalhada" })}: {formatMarketplaceDetailLocation(property.detailedLocation, property.postalCode)}
          </p>
          {property.postalCode ? (
            <p className="text-sm text-slate-300">
              {t({ en: "Postal code", es: "Codigo postal", pt: "Codigo postal" })}: {property.postalCode}
            </p>
          ) : null}
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
            {property.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>

        <PropertyDetailGoogleMapsCard property={property} />
      </motion.section>

      <motion.section className="mt-6 grid gap-4 md:grid-cols-2" variants={motionVariants} initial="initial" animate="animate" exit="exit">
        <Card className="space-y-3">
          <H2 className="text-2xl text-white">{t({ en: "Deal economics", es: "Economia del deal", pt: "Economia do deal" })}</H2>
          <div className="grid gap-2 text-sm text-slate-300">
            {shouldRenderMarketplaceDetailMetric(property.economics.purchasePriceUsd) ? <p>{t({ en: "Purchase price", es: "Purchase Price", pt: "Purchase Price" })}: {formatMarketplaceDetailUsd(property.economics.purchasePriceUsd, locale)}</p> : null}
            {shouldRenderMarketplaceDetailMetric(property.economics.afterRepairValueUsd) ? <p>{t({ en: "After Repair Value (ARV)", es: "After Repair Value (ARV)", pt: "After Repair Value (ARV)" })}: {formatMarketplaceDetailUsd(property.economics.afterRepairValueUsd, locale)}</p> : null}
            {shouldRenderMarketplaceDetailMetric(property.economics.rehabBudgetUsd) ? <p>{t({ en: "Rehab budget", es: "Rehab Budget", pt: "Rehab Budget" })}: {formatMarketplaceDetailUsd(property.economics.rehabBudgetUsd, locale)}</p> : null}
            {shouldRenderMarketplaceDetailMetric(property.economics.closingCostsUsd) ? <p>{t({ en: "Closing costs", es: "Closing Costs", pt: "Closing Costs" })}: {formatMarketplaceDetailUsd(property.economics.closingCostsUsd, locale)}</p> : null}
            {shouldRenderMarketplaceDetailMetric(property.economics.holdingCostsUsd) ? <p>{t({ en: "Holding & misc.", es: "Holding & Misc.", pt: "Holding & Misc." })}: {formatMarketplaceDetailUsd(property.economics.holdingCostsUsd, locale)}</p> : null}
            {shouldRenderMarketplaceDetailMetric(property.economics.sellingCostsUsd) ? <p>{t({ en: "Selling costs", es: "Selling Costs", pt: "Selling Costs" })}: {formatMarketplaceDetailUsd(property.economics.sellingCostsUsd, locale)}</p> : null}
            {shouldRenderMarketplaceDetailMetric(property.economics.totalProjectCostUsd) ? <p>{t({ en: "Total project cost", es: "Total Project Cost", pt: "Total Project Cost" })}: {formatMarketplaceDetailUsd(property.economics.totalProjectCostUsd, locale)}</p> : null}
            {shouldRenderMarketplaceDetailMetric(property.economics.minimumCapitalRequiredUsd) ? <p>{t({ en: "Minimum capital required", es: "Capital minimo requerido", pt: "Capital minimo requerido" })}: {formatMarketplaceDetailUsd(property.economics.minimumCapitalRequiredUsd, locale)}</p> : null}
          </div>
        </Card>

        <Card className="space-y-3">
          <H2 className="text-2xl text-white">{t({ en: "Fees and projected return", es: "Fees y retorno proyectado", pt: "Fees e retorno projetado" })}</H2>
          <div className="grid gap-2 text-sm text-slate-300">
            {shouldRenderMarketplaceDetailMetric(property.economics.structuringFeeUsd) ? <p>{t({ en: "Structuring fee", es: "Structuring Fee", pt: "Structuring Fee" })}: {formatMarketplaceDetailUsd(property.economics.structuringFeeUsd, locale)}</p> : null}
            {shouldRenderMarketplaceDetailMetric(property.economics.grossProfitProjectedUsd) ? <p>{t({ en: "Net profit (before distribution)", es: "Net Profit (before distribution)", pt: "Net Profit (before distribution)" })}: {formatMarketplaceDetailUsd(property.economics.grossProfitProjectedUsd, locale)}</p> : null}
            {shouldRenderMarketplaceDetailMetric(property.economics.managementFeeUsd) ? <p>{t({ en: "Management fee", es: "Management Fee", pt: "Management Fee" })}: {formatMarketplaceDetailUsd(property.economics.managementFeeUsd, locale)}</p> : null}
            {shouldRenderMarketplaceDetailMetric(property.economics.brokerFeeUsd) ? <p>{t({ en: "Broker fee", es: "Broker Fee", pt: "Broker Fee" })}: {formatMarketplaceDetailUsd(property.economics.brokerFeeUsd, locale)}</p> : null}
            {shouldRenderMarketplaceDetailMetric(property.economics.netInvestorProfitUsd) ? <p>{t({ en: "Net profit for investor", es: "Net Profit for Investor", pt: "Net Profit for Investor" })}: {formatMarketplaceDetailUsd(property.economics.netInvestorProfitUsd, locale)}</p> : null}
            {property.economics.projectedNetRoiPct !== null ? <p>{t({ en: "Projected ROI", es: "ROI proyectado", pt: "ROI projetado" })}: {formatMarketplaceDetailPercent(property.economics.projectedNetRoiPct, locale)}</p> : null}
          </div>
        </Card>
      </motion.section>

      <motion.section className="mt-6 grid gap-4 md:grid-cols-2" variants={motionVariants} initial="initial" animate="animate" exit="exit">
        <Card className="space-y-3">
          <H2 className="text-2xl text-white">{t({ en: "Execution and exit", es: "Ejecucion y salida", pt: "Execucao e saida" })}</H2>
          <div className="grid gap-2 text-sm text-slate-300">
            {property.project.stage ? <p>{t({ en: "Project stage", es: "Etapa del proyecto", pt: "Etapa do projeto" })}: {property.project.stage}</p> : null}
            {property.project.developerName ? <p>{t({ en: "Operator / developer", es: "Operador / desarrollador", pt: "Operador / desenvolvedor" })}: {property.project.developerName}</p> : null}
            {property.project.exitStrategy ? <p>{t({ en: "Exit strategy", es: "Estrategia de salida", pt: "Estrategia de saida" })}: {property.project.exitStrategy}</p> : null}
            <p>{t({ en: "Duration", es: "Duracion", pt: "Duracao" })}: {formatMarketplaceDetailMonths(property.project.durationMonths, locale)}</p>
          </div>
        </Card>

        <Card className="space-y-3">
          <H2 className="text-2xl text-white">{t({ en: "Transparency and governance", es: "Transparencia y gobernanza", pt: "Transparencia e governanca" })}</H2>
          <p className="text-sm text-slate-300">
            {property.governance.riskNotes || property.investmentNotes}
          </p>
        </Card>
      </motion.section>

      <motion.section className="mt-6 grid gap-4 md:grid-cols-2" variants={motionVariants} initial="initial" animate="animate" exit="exit">
        <Card className="space-y-3">
          <H2 className="text-2xl text-white">{t({ en: "Documents", es: "Documentos", pt: "Documentos" })}</H2>
          <ul className="space-y-2">
            {property.documents.map((document) => (
              <li key={document.id}>
                <a
                  href={document.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-cyan-300 underline-offset-4 hover:underline"
                >
                  {document.label}
                </a>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="space-y-3">
          <H2 className="text-2xl text-white">{t({ en: "Blockchain info", es: "Blockchain info", pt: "Blockchain info" })}</H2>
          <p className="text-sm text-slate-300">Network: {property.blockchain.network}</p>
          <p className="break-all text-sm text-slate-300">Collection: {property.blockchain.collectionAddress}</p>
          <p className="break-all text-sm text-slate-300">Mint: {property.blockchain.assetMintAddress}</p>
          <a href={property.blockchain.explorerUrl} target="_blank" rel="noreferrer" className="text-sm text-cyan-300 hover:underline">
            {t({ en: "View on explorer", es: "Ver en explorer", pt: "Ver no explorer" })}
          </a>
          <p className="text-sm text-slate-300">
            {t({ en: "Last on-chain update", es: "Ultima actualizacion on-chain", pt: "Ultima atualizacao on-chain" })}:{" "}
            {formatMarketplaceDetailDate(property.blockchain.lastOnchainUpdate, locale)}
          </p>
          {property.blockchain.syncStatus === "unavailable" ? (
            <p className="rounded-md bg-amber-500/15 p-2 text-xs text-amber-100">
              {t({
                en: "Blockchain data is not available yet for this asset.",
                es: "Datos blockchain no disponibles todavia para este activo.",
                pt: "Dados blockchain ainda nao disponiveis para este ativo."
              })}
            </p>
          ) : null}
        </Card>
      </motion.section>
    </>
  );
}
