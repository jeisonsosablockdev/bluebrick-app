"use client";

import Image from "next/image";

import { getHomeContent } from "@/app/data";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { H1, Lead } from "@/components/ui/typography";

export function HeroSection() {
  const { locale, t } = useI18n();
  const { heroStats } = getHomeContent(locale);

  return (
    <section className="rounded-3xl border border-white/10 bg-gradientHero p-7 md:p-12">
      <div className="grid gap-8 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.25em] text-cyan-300">
            {t({
              en: "BRIDS Real Estate Investment",
              es: "BRIDS Inversion Inmobiliaria",
              pt: "BRIDS Investimento Imobiliario"
            })}
          </p>
          <H1 className="max-w-lg text-white">
            {t({
              en: "Invest with confidence. Build long-term real estate stability.",
              es: "Invierte con tranquilidad. Gana estabilidad en bienes raices.",
              pt: "Invista com tranquilidade. Ganhe estabilidade em imoveis."
            })}
          </H1>
          <Lead className="mt-4 max-w-md">
            {t({
              en: "Your capital in real assets through a modern and transparent digital experience.",
              es: "Tu capital en activos reales con una experiencia digital moderna y transparente.",
              pt: "Seu capital em ativos reais com uma experiencia digital moderna e transparente."
            })}
          </Lead>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button>{t({ en: "Open account", es: "Abrir cuenta", pt: "Abrir conta" })}</Button>
            <Button variant="outline">{t({ en: "Explore properties", es: "Explorar propiedades", pt: "Explorar imoveis" })}</Button>
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
          />
        </Card>
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {heroStats.map((stat) => (
          <Card key={stat.label} className="bg-white/5">
            <p className="text-2xl font-bold text-cyan-300">{stat.value}</p>
            <p className="mt-1 text-xs text-slate-300">{stat.label}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
