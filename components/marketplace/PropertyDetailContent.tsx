"use client";

import Image from "next/image";

import { Card } from "@/components/ui/card";
import { H2, Lead } from "@/components/ui/typography";
import { useI18n } from "@/components/i18n/locale-provider";
import { PurchaseCta } from "@/components/marketplace/PurchaseCta";
import type { AppLocale } from "@/lib/i18n";
import type { PropertyDetail } from "@/lib/property-service";
import { listingStatusClasses, listingStatusLabel } from "@/components/marketplace/status-utils";

type PropertyDetailContentProps = {
  property: PropertyDetail;
  imageClassName?: string;
};

function formatUsd(value: number | null, locale: AppLocale): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return locale === "en" ? "Unavailable" : locale === "pt" ? "Indisponivel" : "No disponible";
  }

  const normalizedLocale = locale === "en" ? "en-US" : locale === "pt" ? "pt-BR" : "es-CO";
  return new Intl.NumberFormat(normalizedLocale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function formatMonths(value: number | null, locale: AppLocale): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return locale === "en" ? "Unavailable" : locale === "pt" ? "Indisponivel" : "No disponible";
  }

  return `${value} ${locale === "en" ? "months" : "meses"}`;
}

function formatPercent(value: number | null, locale: AppLocale): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return locale === "en" ? "Unavailable" : locale === "pt" ? "Indisponivel" : "No disponible";
  }

  const normalizedLocale = locale === "en" ? "en-US" : locale === "pt" ? "pt-BR" : "es-CO";
  return `${new Intl.NumberFormat(normalizedLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)}%`;
}

function shouldRenderMetric(value: number | null): boolean {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function formatDate(dateValue: string | null, locale: AppLocale): string {
  if (!dateValue) {
    return locale === "en" ? "Unavailable" : locale === "pt" ? "Indisponivel" : "No disponible";
  }

  const parsed = new Date(dateValue);

  if (Number.isNaN(parsed.valueOf())) {
    return locale === "en" ? "Unavailable" : locale === "pt" ? "Indisponivel" : "No disponible";
  }

  const dateLocale = locale === "en" ? "en-US" : locale === "pt" ? "pt-BR" : "es-CO";

  return parsed.toLocaleString(dateLocale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function PropertyDetailContent({ property, imageClassName = "h-64 md:h-80" }: PropertyDetailContentProps) {
  const { locale, t } = useI18n();

  return (
    <>
      <section className="rounded-2xl border border-white/10 bg-panel p-5 md:p-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Image src={property.image} alt={property.title} width={900} height={600} className={`w-full rounded-xl object-cover ${imageClassName}`} />
          <div className="space-y-4">
            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${listingStatusClasses(property.listingStatus)}`}>
              {listingStatusLabel(property.listingStatus, locale)}
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-white">{property.title}</h1>
            <Lead>{property.locationLabel}</Lead>
            <p className="text-sm text-slate-300">{property.shortDescription}</p>
            <PurchaseCta propertyId={property.id} nftPriceUsd={property.investment.nftPriceUsd} />
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
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
            {t({ en: "Projected ROI", es: "ROI proyectado", pt: "ROI projetado" })}: {formatPercent(property.economics.projectedNetRoiPct ?? property.investment.annualRoiPct, locale)}
          </p>
          <p className="text-sm text-slate-300">
            {t({ en: "Availability", es: "Disponibilidad", pt: "Disponibilidade" })}: {property.investment.availabilityLabel}
          </p>
        </Card>

        <Card className="space-y-3">
          <H2 className="text-2xl text-white">{t({ en: "Property information", es: "Informacion de la propiedad", pt: "Informacoes da propriedade" })}</H2>
          <p className="text-sm text-slate-300">{property.investmentNotes}</p>
          <p className="text-sm text-slate-300">
            {t({ en: "Detailed location", es: "Ubicacion detallada", pt: "Localizacao detalhada" })}: {property.detailedLocation}
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
            {property.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="space-y-3">
          <H2 className="text-2xl text-white">{t({ en: "Deal economics", es: "Economia del deal", pt: "Economia do deal" })}</H2>
          <div className="grid gap-2 text-sm text-slate-300">
            {shouldRenderMetric(property.economics.purchasePriceUsd) ? <p>{t({ en: "Purchase price", es: "Purchase Price", pt: "Purchase Price" })}: {formatUsd(property.economics.purchasePriceUsd, locale)}</p> : null}
            {shouldRenderMetric(property.economics.afterRepairValueUsd) ? <p>{t({ en: "After Repair Value (ARV)", es: "After Repair Value (ARV)", pt: "After Repair Value (ARV)" })}: {formatUsd(property.economics.afterRepairValueUsd, locale)}</p> : null}
            {shouldRenderMetric(property.economics.rehabBudgetUsd) ? <p>{t({ en: "Rehab budget", es: "Rehab Budget", pt: "Rehab Budget" })}: {formatUsd(property.economics.rehabBudgetUsd, locale)}</p> : null}
            {shouldRenderMetric(property.economics.closingCostsUsd) ? <p>{t({ en: "Closing costs", es: "Closing Costs", pt: "Closing Costs" })}: {formatUsd(property.economics.closingCostsUsd, locale)}</p> : null}
            {shouldRenderMetric(property.economics.holdingCostsUsd) ? <p>{t({ en: "Holding & misc.", es: "Holding & Misc.", pt: "Holding & Misc." })}: {formatUsd(property.economics.holdingCostsUsd, locale)}</p> : null}
            {shouldRenderMetric(property.economics.sellingCostsUsd) ? <p>{t({ en: "Selling costs", es: "Selling Costs", pt: "Selling Costs" })}: {formatUsd(property.economics.sellingCostsUsd, locale)}</p> : null}
            {shouldRenderMetric(property.economics.totalProjectCostUsd) ? <p>{t({ en: "Total project cost", es: "Total Project Cost", pt: "Total Project Cost" })}: {formatUsd(property.economics.totalProjectCostUsd, locale)}</p> : null}
            {shouldRenderMetric(property.economics.minimumCapitalRequiredUsd) ? <p>{t({ en: "Minimum capital required", es: "Capital minimo requerido", pt: "Capital minimo requerido" })}: {formatUsd(property.economics.minimumCapitalRequiredUsd, locale)}</p> : null}
          </div>
        </Card>

        <Card className="space-y-3">
          <H2 className="text-2xl text-white">{t({ en: "Fees and projected return", es: "Fees y retorno proyectado", pt: "Fees e retorno projetado" })}</H2>
          <div className="grid gap-2 text-sm text-slate-300">
            {shouldRenderMetric(property.economics.structuringFeeUsd) ? <p>{t({ en: "Structuring fee", es: "Structuring Fee", pt: "Structuring Fee" })}: {formatUsd(property.economics.structuringFeeUsd, locale)}</p> : null}
            {shouldRenderMetric(property.economics.grossProfitProjectedUsd) ? <p>{t({ en: "Net profit (before distribution)", es: "Net Profit (before distribution)", pt: "Net Profit (before distribution)" })}: {formatUsd(property.economics.grossProfitProjectedUsd, locale)}</p> : null}
            {shouldRenderMetric(property.economics.managementFeeUsd) ? <p>{t({ en: "Management fee", es: "Management Fee", pt: "Management Fee" })}: {formatUsd(property.economics.managementFeeUsd, locale)}</p> : null}
            {shouldRenderMetric(property.economics.brokerFeeUsd) ? <p>{t({ en: "Broker fee", es: "Broker Fee", pt: "Broker Fee" })}: {formatUsd(property.economics.brokerFeeUsd, locale)}</p> : null}
            {shouldRenderMetric(property.economics.netInvestorProfitUsd) ? <p>{t({ en: "Net profit for investor", es: "Net Profit for Investor", pt: "Net Profit for Investor" })}: {formatUsd(property.economics.netInvestorProfitUsd, locale)}</p> : null}
            {property.economics.projectedNetRoiPct !== null ? <p>{t({ en: "Projected ROI", es: "ROI proyectado", pt: "ROI projetado" })}: {formatPercent(property.economics.projectedNetRoiPct, locale)}</p> : null}
          </div>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="space-y-3">
          <H2 className="text-2xl text-white">{t({ en: "Execution and exit", es: "Ejecucion y salida", pt: "Execucao e saida" })}</H2>
          <div className="grid gap-2 text-sm text-slate-300">
            {property.project.stage ? <p>{t({ en: "Project stage", es: "Etapa del proyecto", pt: "Etapa do projeto" })}: {property.project.stage}</p> : null}
            {property.project.developerName ? <p>{t({ en: "Operator / developer", es: "Operador / desarrollador", pt: "Operador / desenvolvedor" })}: {property.project.developerName}</p> : null}
            {property.project.exitStrategy ? <p>{t({ en: "Exit strategy", es: "Estrategia de salida", pt: "Estrategia de saida" })}: {property.project.exitStrategy}</p> : null}
            <p>{t({ en: "Duration", es: "Duracion", pt: "Duracao" })}: {formatMonths(property.project.durationMonths, locale)}</p>
          </div>
        </Card>

        <Card className="space-y-3">
          <H2 className="text-2xl text-white">{t({ en: "Transparency and governance", es: "Transparencia y gobernanza", pt: "Transparencia e governanca" })}</H2>
          <p className="text-sm text-slate-300">
            {property.governance.riskNotes || property.investmentNotes}
          </p>
        </Card>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
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
            {formatDate(property.blockchain.lastOnchainUpdate, locale)}
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
      </section>
    </>
  );
}
