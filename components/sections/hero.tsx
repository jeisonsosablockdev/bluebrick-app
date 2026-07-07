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
    <section className="text-slate-100 relative w-full overflow-hidden -mt-[88px] pt-[140px] md:pt-[180px] lg:pt-[220px] pb-12 md:pb-20">
      
      {/* 
        We use a negative top margin (-mt-[88px]) to slide the Hero section UP behind the transparent navbar.
        The padding-top (pt-[88px]) pushes the text content back down so it doesn't collide with the navbar.
        The absolute background spans the entire section, covering the area behind the navbar perfectly.
      */}
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center bg-[#020813]">
        <Image 
          src="/images/BRD_02.png" 
          alt="Hero Background" 
          fill
          priority
          className="object-cover object-right-top"
        />
      </div>
      
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 lg:px-12 pb-10 md:pb-16 pt-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div className="max-w-[900px]">
            <p className="landing-hero-eyebrow mb-4 text-sm uppercase tracking-[0.25em]">
              {t({
                en: "BRIDS Real Estate Investment",
                es: "Inversión Inmobiliaria BRIDS",
                pt: "Investimento Imobiliário BRIDS",
              })}
            </p>
            <H1 className="landing-hero-title text-[clamp(2.5rem,6vw,5.5rem)] leading-tight">
              {t({
                en: "Explore real estate projects and invest in real assets.",
                es: "Explora proyectos inmobiliarios e invierte en bienes raíces.",
                pt: "Explore projetos imobiliários e invista em ativos reais.",
              })}
            </H1>
            <Lead className="landing-hero-lead mt-5 max-w-xl 2xl:max-w-2xl text-[clamp(1rem,2vw,1.35rem)]">
              {t({
                en: "Access documents, statuses, and project updates from a modern and transparent interface.",
                es: "Accede a documentos, estados y actualizaciones de proyecto desde una interfaz moderna y transparente.",
                pt: "Acesse documentos, estados e atualizacoes de projeto em uma interface moderna e transparente."
              })}
            </Lead>
            <div className="mt-8 flex flex-col sm:flex-row gap-5">
              <Link href="/marketplace" className="inline-flex">
                <Button className="px-10 py-6 text-lg 2xl:text-xl">{t({ en: "Explore properties", es: "Explorar propiedades", pt: "Explorar imoveis" })}</Button>
              </Link>
              <Link href="/transparencia" className="inline-flex">
                <Button variant="ghost" className="landing-hero-secondary-cta px-10 py-6 text-lg 2xl:text-xl">
                  {t({ en: "Transparency", es: "Transparencia", pt: "Transparencia" })}
                </Button>
              </Link>
            </div>
          </div>

          <div className="md:w-1/3" aria-hidden="true" />
        </div>

        <div className="mt-20 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {heroStats.map((stat, index) => (
            <div key={stat.label} className="landing-hero-panel landing-hero-stat rounded-2xl p-6">
              <p className="landing-hero-stat-value text-3xl 2xl:text-4xl font-bold">{stat.value}</p>
              <p className="landing-hero-stat-label mt-2 text-sm text-slate-300">{stat.label}</p>
              {index === 1 ? (
                <p className="landing-hero-stat-note mt-2 text-xs text-slate-400">
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
      </div>
    </section>
  );
}
