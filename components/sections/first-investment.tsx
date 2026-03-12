"use client";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";

export function FirstInvestmentSection() {
  const { t } = useI18n();

  const investmentStats = [
    { value: "15K+", label: t({ en: "Investors", es: "Inversionistas", pt: "Investidores" }) },
    { value: "$2.5M+", label: t({ en: "Invested", es: "Invertido", pt: "Investido" }) },
    { value: "500+", label: t({ en: "Properties", es: "Propiedades", pt: "Imoveis" }) },
    { value: "20%", label: t({ en: "Avg ROI", es: "ROI Promedio", pt: "ROI Medio" }) }
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradientPrimary px-6 py-12 md:px-10 md:py-16">
      <div className="pointer-events-none absolute -left-6 top-5 h-16 w-16 rounded-full border border-white/20" />
      <div className="pointer-events-none absolute -right-8 bottom-12 h-16 w-16 rounded-full border border-white/20" />

      <div className="text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-2xl text-white">↗</div>
        <h3 className="text-4xl font-extrabold leading-tight text-white md:text-6xl">
          {t({
            en: "Your first investment is waiting for you.",
            es: "Tu primera inversion te esta esperando.",
            pt: "Seu primeiro investimento esta esperando por voce."
          })}
        </h3>
        <p className="mt-4 text-xl font-semibold text-white/95">
          {t({
            en: "Act before this round closes.",
            es: "Aprovecha antes que cierre la ronda.",
            pt: "Aproveite antes que esta rodada feche."
          })}
        </p>

        <div className="mt-7 flex flex-col items-center justify-center gap-4 md:flex-row">
          <Button className="bg-white px-12 py-3 text-base font-bold text-slate-900 hover:bg-white/90">
            {t({ en: "Invest Now", es: "Invierte Ahora", pt: "Invista Agora" })}
          </Button>
          <div className="text-left text-sm text-white/95">
            <p>{t({ en: "Minimum investment from $1,000 USD", es: "Inversion minima desde $1,000 USD", pt: "Investimento minimo a partir de $1,000 USD" })}</p>
            <p>{t({ en: "Average ROI between 15-25% yearly", es: "ROI promedio del 15-25% anual", pt: "ROI medio entre 15-25% ao ano" })}</p>
          </div>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-2 gap-5 text-center md:grid-cols-4">
        {investmentStats.map((stat) => (
          <div key={stat.label}>
            <p className="text-3xl font-extrabold text-white">{stat.value}</p>
            <p className="text-base text-white/90">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
