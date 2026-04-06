"use client";

import { useI18n } from "@/components/i18n/locale-provider";
import { H2, Lead } from "@/components/ui/typography";

export function WelcomeSection() {
  const { t } = useI18n();

  return (
    <section className="py-14 text-center">
      <H2 className="text-white">
        {t({ en: "Welcome to the", es: "Bienvenido a la", pt: "Bem-vindo a" })}{" "}
        <span className="bg-gradientPrimary bg-clip-text text-transparent">
          {t({ en: "future", es: "futuro", pt: "futuro" })}
        </span>{" "}
        {t({
          en: "of fractional real estate investing.",
          es: "de la inversion inmobiliaria fraccionada.",
          pt: "do investimento imobiliario fracionado."
        })}
      </H2>
      <Lead className="mx-auto mt-3 max-w-2xl">
        {t({
          en: "Discover projects from our partners with clear information and digital traceability.",
          es: "Conoce los proyectos de nuestros aliados, proyectos inmobiliarios con trazabilidad digital.",
          pt: "Conheca os projetos dos nossos parceiros, projetos imobiliarios com rastreabilidade digital."
        })}
      </Lead>
    </section>
  );
}
