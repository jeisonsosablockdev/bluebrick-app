"use client";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";

export function PromoBannerSection() {
  const { t } = useI18n();

  return (
    <section className="rounded-3xl bg-gradientPrimary p-7 md:p-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <h3 className="max-w-2xl text-2xl font-bold leading-tight text-white md:text-3xl">
          {t({
            en: "Explore the BRIDS tokenized ecosystem: fractional investments, passive income and financial freedom.",
            es: "Explora el ecosistema tokenizado de BRIDS: inversiones fraccionadas, ingresos pasivos y libertad financiera.",
            pt: "Explore o ecossistema tokenizado da BRIDS: investimentos fracionados, renda passiva e liberdade financeira."
          })}
        </h3>
        <Button variant="ghost" className="bg-slate-950/75 px-6 text-white hover:bg-slate-950/90">
          {t({ en: "Learn more", es: "Conocer mas", pt: "Saiba mais" })}
        </Button>
      </div>
    </section>
  );
}
