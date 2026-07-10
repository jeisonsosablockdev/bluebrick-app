"use client";

import { useRef } from "react";
import { useScroll, useSpring } from "framer-motion";
import { AnimatedLogoBg } from "@/components/brand/animated-logo-bg";
import Link from "next/link";
import { useI18n } from "@/components/i18n/locale-provider";
import { PropertiesSection, type FeaturedPropertyCard } from "@/components/sections/properties";

type FeaturedPropertiesSectionProps = {
  properties: FeaturedPropertyCard[];
};

export function FeaturedPropertiesSection({ properties }: FeaturedPropertiesSectionProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"]
  });

  const pathLength = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <section ref={containerRef} className="featured-properties-section relative w-full bg-[#020813] pt-20 md:pt-28 pb-20 md:pb-32 overflow-hidden flex flex-col justify-center min-h-[900px] lg:min-h-[1100px]">
      {/* Top Blue Glow Effect (Full Width) */}
      <div className="absolute top-0 left-0 right-0 h-[400px] w-full -translate-y-1/2 bg-[#00b0f9]/40 dark:bg-[#00b0f9]/20 blur-[120px] pointer-events-none" />

      {/* Bottom Purple Glow Effect (Full Width) */}
      <div className="absolute bottom-0 left-0 right-0 h-[400px] w-full translate-y-1/2 bg-[#cf84f9]/45 dark:bg-[#cf84f9]/25 blur-[120px] pointer-events-none" />

      {/* Background Animated Logo */}
      <div className="absolute top-1/2 right-[6px] md:right-[8px] -translate-y-1/2 h-[800px] md:h-[1200px] w-[600px] md:w-[800px] opacity-50 text-white pointer-events-none z-0">
        <AnimatedLogoBg pathLength={pathLength} className="w-full h-full" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-12">
        <PropertiesSection properties={properties} />

        <div className="mt-12">
          <p className="mx-auto max-w-3xl text-center text-xs text-slate-400">
            {t({
              en: "Project metrics are informational references and may change according to partner updates and applicable documentation.",
              es: "Las metricas del proyecto son referenciales e informativas y pueden cambiar segun actualizaciones del partner y documentacion aplicable.",
              pt: "As metricas do projeto sao referenciais e informativas e podem mudar conforme atualizacoes do parceiro e documentacao aplicavel."
            })}
          </p>

          <div className="mt-8 text-center">
            <Link
              href="/marketplace"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-gradientPrimary px-8 py-3 text-sm font-semibold text-white shadow-glow transition-all hover:opacity-95"
            >
              {t({ en: "View marketplace", es: "Ver marketplace", pt: "Ver marketplace" })}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
