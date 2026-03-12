"use client";

import { useI18n } from "@/components/i18n/locale-provider";
import { H2, Lead } from "@/components/ui/typography";

export function WelcomeSection() {
  const { t } = useI18n();

  return (
    <section className="py-14 text-center">
      <H2 className="text-white">
        {t({ en: "Welcome to the", es: "Bienvenido al", pt: "Bem-vindo ao" })}{" "}
        <span className="bg-gradientPrimary bg-clip-text text-transparent">
          {t({ en: "future", es: "futuro", pt: "futuro" })}
        </span>{" "}
        {t({
          en: "of real estate investment.",
          es: "de la inversion inmobiliaria.",
          pt: "do investimento imobiliario."
        })}
      </H2>
      <Lead className="mx-auto mt-3 max-w-2xl">
        {t({
          en: "Invest from home in real fractions, with legal backing and clear performance visibility.",
          es: "Invierte desde casa en fracciones reales, con respaldo legal y visualizacion clara de rendimiento.",
          pt: "Invista de casa em fracoes reais, com respaldo legal e visao clara de rendimento."
        })}
      </Lead>
    </section>
  );
}
