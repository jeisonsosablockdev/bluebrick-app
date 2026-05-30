"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
    <section className="rounded-3xl border border-white/10 bg-gradientHero p-7 md:p-12">
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-cyan-300">
            {t({
              en: "BRIDS Real Estate Investment",
              es: "BRIDS Plataforma Tecnologica",
              pt: "BRIDS Investimento Imobiliario"
            })}
          </p>
          <H1 className="max-w-lg text-white">
            {t({
              en: "Explore real estate projects and invest in real assets.",
              es: "Explora proyectos inmobiliarios e invierte en bienes raices.",
              pt: "Explore projetos imobiliarios e invista em ativos reais."
            })}
          </H1>
          <Lead className="mt-4 max-w-md">
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
              <Button variant="outline">{t({ en: "Transparency", es: "Transparencia", pt: "Transparencia" })}</Button>
            </Link>
          </div>
        </div>

        <Card className="overflow-hidden p-0">
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
        </Card>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {heroStats.map((stat, index) => (
          <Card key={stat.label} className="bg-white/5">
            <p className="text-2xl font-bold text-cyan-300">{stat.value}</p>
            <p className="mt-1 text-xs text-slate-300">{stat.label}</p>
            {index === 1 ? (
              <p className="mt-1 text-[11px] text-slate-400">
                {t({
                  en: "Live total from marketplace records.",
                  es: "Total en vivo desde registros del marketplace.",
                  pt: "Total ao vivo a partir dos registros do marketplace."
                })}
              </p>
            ) : null}
          </Card>
        ))}
      </div>
    </section>
  );
}
