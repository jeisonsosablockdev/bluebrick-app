"use client";

import Image from "next/image";
import { motion } from "motion/react";

import { Lead } from "@/components/ui/typography";
import { PurchaseCta } from "@/components/marketplace/PurchaseCta";
import { listingStatusClasses, listingStatusLabel } from "@/components/marketplace/status-utils";
import type { AppLocale } from "@/lib/i18n";
import { createDetailOpenMotionVariants } from "@/lib/motion";
import type { PropertyDetail } from "@/lib/property-service";

type PropertyDetailHeroSectionProps = {
  property: PropertyDetail;
  locale: AppLocale;
  imageClassName?: string;
  layoutId?: string;
};

export function PropertyDetailHeroSection({
  property,
  locale,
  imageClassName = "h-64 md:h-80",
  layoutId
}: PropertyDetailHeroSectionProps) {
  const motionVariants = createDetailOpenMotionVariants();

  return (
    <motion.section
      className="rounded-2xl border border-white/10 bg-panel p-5 md:p-6"
      variants={motionVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      layoutId={layoutId}
    >
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
    </motion.section>
  );
}
