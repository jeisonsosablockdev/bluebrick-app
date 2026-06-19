"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { H1, Lead } from "@/components/ui/typography";

type HeroSectionProps = {
  marketplaceTotal: number;
};

export function HeroSection({ marketplaceTotal }: HeroSectionProps) {
  const { locale, t } = useI18n();

  const formattedMarketplaceTotal = useMemo(() => {
    return new Intl.NumberFormat(locale).format(marketplaceTotal);
  }, [locale, marketplaceTotal]);

  const heroStats = useMemo(
    () => [
      {
        value: t({
          en: "Be a pioneer",
          es: "Se pionero",
          pt: "Seja pioneiro"
        }),
        label: t({
          en: "Discover projects in our marketplace.",
          es: "Conoce los proyectos en nuestro marketplace.",
          pt: "Conheca os projetos no nosso marketplace."
        })
      },
      {
        value: formattedMarketplaceTotal,
        label: t({
          en: "Marketplace properties",
          es: "Propiedades en marketplace",
          pt: "Propriedades no marketplace"
        })
      },
      {
        value: "24/7",
        label: t({
          en: "Digital traceability",
          es: "Trazabilidad digital",
          pt: "Rastreabilidade digital"
        })
      },
      {
        value: "$200",
        label: t({
          en: "Average fraction cost",
          es: "Costo promedio de fraccion",
          pt: "Custo medio da fracao"
        })
      }
    ],
    [formattedMarketplaceTotal, t]
  );

  return (
    <section className="landing-hero-shell rounded-[2rem] p-7 text-slate-100 md:p-12">
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <div>
          <p className="landing-hero-eyebrow mb-3 text-xs uppercase tracking-[0.25em]">
            {t({
              en: "BRIDS Real Estate Investment",
              es: "BRIDS Plataforma Tecnologica",
              pt: "BRIDS Investimento Imobiliario"
            })}
          </p>
          <H1 className="landing-hero-title max-w-lg">
            {t({
              en: "Explore real estate projects and invest in real assets.",
              es: "Explora proyectos inmobiliarios e invierte en bienes raices.",
              pt: "Explore projetos imobiliarios e invista em ativos reais."
            })}
          </H1>
          <Lead className="landing-hero-lead mt-4 max-w-md">
            {t({
              en: "Access documents, statuses, and project updates from a modern and transparent interface.",
              es: "Accede a documentos, estados y actualizaciones de proyecto desde una interfaz moderna y transparente.",
              pt: "Acesse documentos, estados e atualizacoes de projeto em uma interface moderna e transparente."
            })}
          </Lead>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/marketplace" className="inline-flex">
              <Button>{t({ en: "Explore properties", es: "Explorar propiedades", pt: "Explorar imoveis" })}</Button>
            </Link>
            <Link href="/transparencia" className="inline-flex">
              <Button variant="ghost" className="landing-hero-secondary-cta">
                {t({ en: "Transparency", es: "Transparencia", pt: "Transparencia" })}
              </Button>
            </Link>
          </div>
        </div>

        <div className="landing-hero-panel landing-hero-media relative overflow-hidden rounded-[1.75rem] p-0">
          <Image
            src="https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?q=80&w=1400&auto=format&fit=crop"
            alt={t({ en: "Modern residence", es: "Residencia moderna", pt: "Residencia moderna" })}
            width={700}
            height={420}
            className="h-full w-full object-cover"
            priority
            fetchPriority="high"
            sizes="(min-width: 1024px) 560px, (min-width: 768px) 50vw, 100vw"
          />
          <div aria-hidden="true" className="landing-hero-media-overlay" />
        </div>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {heroStats.map((stat, index) => (
          <div key={stat.label} className="landing-hero-panel landing-hero-stat rounded-2xl p-5">
            <p className="landing-hero-stat-value text-2xl font-bold">{stat.value}</p>
            <p className="landing-hero-stat-label mt-1 text-xs">{stat.label}</p>
            {index === 1 ? (
              <p className="landing-hero-stat-note mt-1 text-[11px]">
                {t({
                  en: "Live total from marketplace records.",
                  es: "Total en vivo desde registros del marketplace.",
                  pt: "Total ao vivo a partir dos registros do marketplace."
                })}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
