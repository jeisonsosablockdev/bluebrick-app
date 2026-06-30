"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { MOTION_FAST_OPACITY_TRANSITION } from "@/lib/motion";
import { getHomeContent } from "@/app/data";
import { useI18n } from "@/components/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { H2, Lead } from "@/components/ui/typography";

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
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradientPrimary text-lg text-white">
                {feature.icon ?? "•"}
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
