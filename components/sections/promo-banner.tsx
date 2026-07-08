"use client";

import Link from "next/link";
import { motion } from "motion/react";

import { useI18n } from "@/components/i18n/locale-provider";
import { MOTION_FAST_OPACITY_TRANSITION } from "@/lib/motion";

export function PromoBannerSection() {
  const { t } = useI18n();

  return (
    <section className="mt-20 md:mt-32 rounded-3xl bg-gradientPrimary p-7 md:p-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <h3 className="max-w-2xl text-2xl font-bold leading-tight text-white md:text-3xl">
          {t({
            en: "Explore the BRIDS ecosystem: fractional investments, digital traceability and a flow that simplifies transactions.",
            es: "Explora BRIDS: inversiones fraccionadas, trazabilidad digital y una experiencia que facilita las transacciones.",
            pt: "Explore a BRIDS: investimentos fracionados, rastreabilidade digital e uma experiencia que facilita as transacoes."
          })}
        </h3>
        <Link
          href="/transparencia"
          className="inline-flex"
          aria-label={t({
            en: "Learn more about transparency and platform capabilities",
            es: "Conocer más sobre transparencia y capacidades de la plataforma",
            pt: "Saiba mais sobre transparência e capacidades da plataforma"
          })}
        >
          <motion.span
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950/75 px-6 text-sm font-semibold text-white hover:bg-slate-950/90 transition-all cursor-pointer"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.985 }}
            transition={MOTION_FAST_OPACITY_TRANSITION}
          >
            <span>
              {t({ en: "Learn more", es: "Conocer mas", pt: "Saiba mais" })}
              <span className="sr-only">
                {t({
                  en: " about transparency and platform capabilities",
                  es: " sobre transparencia y capacidades de la plataforma",
                  pt: " sobre transparência e capacidades da plataforma"
                })}
              </span>
            </span>
          </motion.span>
        </Link>
      </div>
    </section>
  );
}
