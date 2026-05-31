"use client";

import { motion } from "motion/react";

import { Card } from "@/components/ui/card";
import { H2 } from "@/components/ui/typography";
import { useI18n } from "@/components/i18n/locale-provider";
import { PropertyDetailDealEconomicsCard } from "@/components/marketplace/PropertyDetailDealEconomicsCard";
import { PropertyDetailExecutionGovernanceCards } from "@/components/marketplace/PropertyDetailExecutionGovernanceCards";
import { PropertyDetailFeesReturnCard } from "@/components/marketplace/PropertyDetailFeesReturnCard";
import { PropertyDetailGoogleMapsCard } from "@/components/marketplace/PropertyDetailGoogleMapsCard";
import { PropertyDetailHeroSection } from "@/components/marketplace/PropertyDetailHeroSection";
import { PropertyDetailInvestmentSummaryCard } from "@/components/marketplace/PropertyDetailInvestmentSummaryCard";
import { PropertyDetailPropertyInfoCard } from "@/components/marketplace/PropertyDetailPropertyInfoCard";
import {
  formatMarketplaceDetailDate,
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

        <PropertyDetailPropertyInfoCard property={property} />

        <PropertyDetailGoogleMapsCard property={property} />
      </motion.section>

      <motion.section className="mt-6 grid gap-4 md:grid-cols-2" variants={motionVariants} initial="initial" animate="animate" exit="exit">
        <PropertyDetailDealEconomicsCard economics={property.economics} />

        <PropertyDetailFeesReturnCard economics={property.economics} />
      </motion.section>

      <motion.section className="mt-6 grid gap-4 md:grid-cols-2" variants={motionVariants} initial="initial" animate="animate" exit="exit">
        <PropertyDetailExecutionGovernanceCards project={property.project} governance={property.governance} investmentNotes={property.investmentNotes} />
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
