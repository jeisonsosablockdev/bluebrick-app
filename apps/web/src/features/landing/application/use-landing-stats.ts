"use client";

import { useMemo } from "react";
import { LANDING_HERO_STATS, type LandingHeroStat } from "../domain/landing-constants";

export function useLandingStats(marketplaceTotal: number = 0, isSpanish: boolean = true) {
  const formattedTotal = useMemo(() => {
    return new Intl.NumberFormat(isSpanish ? "es-ES" : "en-US").format(marketplaceTotal);
  }, [isSpanish, marketplaceTotal]);

  const stats = useMemo(() => {
    return LANDING_HERO_STATS.map((stat: LandingHeroStat) => {
      if (stat.id === "marketplace_total") {
        return {
          id: stat.id,
          value: formattedTotal,
          label: isSpanish ? stat.valueEs : stat.valueEn
        };
      }
      return {
        id: stat.id,
        value: isSpanish ? stat.valueEs : stat.valueEn,
        label: isSpanish ? stat.labelEs : stat.labelEn
      };
    });
  }, [formattedTotal, isSpanish]);

  return {
    formattedTotal,
    stats
  };
}
