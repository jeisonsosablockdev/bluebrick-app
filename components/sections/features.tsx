"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { motion } from "motion/react";
import { MOTION_FAST_OPACITY_TRANSITION } from "@/lib/motion";
import { getHomeContent } from "@/app/data";
import { useI18n } from "@/components/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { H2, Lead } from "@/components/ui/typography";

function FeatureIcon({ type }: { type: string }): ReactNode {
  const baseClasses = "h-9 w-9 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]";
  
  if (type === "🧩") {
    // Fraccionamiento Seguro: Standalone prism/token
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="M3.27 6.96L12 12.01l8.73-5.05" />
        <path d="M12 22.08V12" />
      </svg>
    );
  }
  
  if (type === "📈") {
    // Ingresos Recurrentes: Minimalist scaling chart
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}>
        <path d="M3 3v18h18" />
        <path d="M7 16l4-4 4 2 6-8" />
        <path d="M14 6h7v7" />
      </svg>
    );
  }
  
  // Inversion Flexible: Lightning bolt
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={baseClasses}>
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

export function FeaturesSection() {
  const { locale, t } = useI18n();
  const { features } = getHomeContent(locale);

  return (
    <section className="py-12">
      <div className="mb-8 text-center">
        <H2 className="text-white">
          {t({ en: "Fractional ownership,", es: "Propiedad fraccionada,", pt: "Propriedade fracionada," })}{" "}
          <span className="bg-gradientPrimary bg-clip-text text-transparent">
            {t({ en: "transparent experience", es: "transparencia visible", pt: "transparencia visivel" })}
          </span>
        </H2>
        <Lead className="mx-auto mt-3 max-w-2xl">
          {t({
            en: "Three capabilities designed to inform and guide your platform experience.",
            es: "Tres capacidades diseñadas para informar y guiar tu experiencia en la plataforma.",
            pt: "Tres capacidades desenhadas para informar e orientar sua experiencia na plataforma."
          })}
        </Lead>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="landing-depth-card flex h-full flex-col justify-between gap-4">
            <div>
              <div className="mb-4">
                <FeatureIcon type={feature.icon ?? ""} />
              </div>
              <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{feature.description}</p>
            </div>
            <Link
              href={feature.actionHref ?? "/transparencia"}
              className="w-full inline-flex"
              aria-label={`${feature.action} - ${feature.title}`}
            >
              <motion.span
                className="w-full text-center inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-all bg-gradientPrimary text-white shadow-glow hover:opacity-95 cursor-pointer"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.985 }}
                transition={MOTION_FAST_OPACITY_TRANSITION}
              >
                <span>
                  {feature.action}
                  <span className="sr-only"> about {feature.title}</span>
                </span>
              </motion.span>
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
}
