"use client";

import { motion } from "motion/react";

import { Card } from "@/components/ui/card";
import { H2 } from "@/components/ui/typography";
import { useI18n } from "@/components/i18n/locale-provider";
import { PropertyDetailDealEconomicsCard } from "@/components/marketplace/PropertyDetailDealEconomicsCard";
import { PropertyDetailDocumentsBlockchainCards } from "@/components/marketplace/PropertyDetailDocumentsBlockchainCards";
import { PropertyDetailExecutionGovernanceCards } from "@/components/marketplace/PropertyDetailExecutionGovernanceCards";
import { PropertyDetailFeesReturnCard } from "@/components/marketplace/PropertyDetailFeesReturnCard";
import { PropertyDetailGoogleMapsCard } from "@/components/marketplace/PropertyDetailGoogleMapsCard";
import { PropertyDetailHeroSection } from "@/components/marketplace/PropertyDetailHeroSection";
import { PropertyDetailInvestmentSummaryCard } from "@/components/marketplace/PropertyDetailInvestmentSummaryCard";
import { PropertyDetailMediaSection } from "@/components/marketplace/PropertyDetailMediaSection";
import { PropertyDetailPropertyInfoCard } from "@/components/marketplace/PropertyDetailPropertyInfoCard";
import type { PropertyDetail } from "@/lib/property-service";
import { createDetailOpenMotionVariants } from "@/lib/motion";

type PropertyDetailContentProps = {
  property: PropertyDetail;
  imageClassName?: string;
  layoutId?: string;
};

export function PropertyDetailContent({ property, imageClassName = "h-64 md:h-80", layoutId }: PropertyDetailContentProps) {
  const { locale } = useI18n();
  const motionVariants = createDetailOpenMotionVariants();
  const hasProjectMedia = property.galleryImages.length > 0 || property.propertyImages.length > 0;

  return (
    <>
      <PropertyDetailHeroSection property={property} locale={locale} imageClassName={imageClassName} layoutId={layoutId} />

      <motion.section className="mt-6 grid gap-4 md:grid-cols-2" variants={motionVariants} initial="initial" animate="animate" exit="exit">
        <PropertyDetailInvestmentSummaryCard property={property} />

        <PropertyDetailPropertyInfoCard property={property} />

        <PropertyDetailGoogleMapsCard property={property} />
      </motion.section>

      {hasProjectMedia ? (
        <motion.section className="mt-6" variants={motionVariants} initial="initial" animate="animate" exit="exit">
          <PropertyDetailMediaSection property={property} />
        </motion.section>
      ) : null}

      <motion.section className="mt-6 grid gap-4 md:grid-cols-2" variants={motionVariants} initial="initial" animate="animate" exit="exit">
        <PropertyDetailDealEconomicsCard economics={property.economics} />

        <PropertyDetailFeesReturnCard economics={property.economics} />
      </motion.section>

      <motion.section className="mt-6 grid gap-4 md:grid-cols-2" variants={motionVariants} initial="initial" animate="animate" exit="exit">
        <PropertyDetailExecutionGovernanceCards project={property.project} governance={property.governance} investmentNotes={property.investmentNotes} />
      </motion.section>

      <motion.section className="mt-6 grid gap-4 md:grid-cols-2" variants={motionVariants} initial="initial" animate="animate" exit="exit">
        <PropertyDetailDocumentsBlockchainCards documents={property.documents} blockchain={property.blockchain} />
      </motion.section>
    </>
  );
}
