"use client";

import { getHomeContent } from "@/app/data";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
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
            {t({ en: "multiplied investment", es: "inversion multiplicada", pt: "investimento multiplicado" })}
          </span>
        </H2>
        <Lead className="mx-auto mt-3 max-w-2xl">
          {t({
            en: "Three ways to enter premium assets without complex processes.",
            es: "Tres formas de participar en activos premium sin procesos complejos.",
            pt: "Tres formas de participar de ativos premium sem processos complexos."
          })}
        </Lead>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title} className="flex h-full flex-col justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradientPrimary text-white">•</div>
              <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-300">{feature.description}</p>
            </div>
            <Button>{feature.action}</Button>
          </Card>
        ))}
      </div>
    </section>
  );
}
