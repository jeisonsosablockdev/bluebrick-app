"use client";

import Link from "next/link";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { H2, Lead } from "@/components/ui/typography";

export function AppOverviewSection() {
  const { t } = useI18n();

  return (
    <section className="py-12">
      <div className="mb-8 text-center">
        <H2 className="text-white">
          {t({ en: "What BRIDS does", es: "Que hace BRIDS", pt: "O que a BRIDS faz" })}
        </H2>
        <Lead className="mx-auto mt-2 max-w-2xl">
          {t({
            en: "A single platform to discover opportunities, follow performance and manage your fractional strategy.",
            es: "Una sola plataforma para descubrir oportunidades, seguir el rendimiento y gestionar tu estrategia fraccionada.",
            pt: "Uma unica plataforma para descobrir oportunidades, acompanhar o desempenho e gerir sua estrategia fracionada."
          })}
        </Lead>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-950/45">
          <h3 className="text-base font-semibold text-white">
            {t({ en: "Marketplace access", es: "Acceso a marketplace", pt: "Acesso ao marketplace" })}
          </h3>
          <p className="mt-2 text-sm text-slate-300">
            {t({
              en: "Review active properties and available fractions in one place.",
              es: "Revisa propiedades activas y fracciones disponibles en un solo lugar.",
              pt: "Revise propriedades ativas e fracoes disponiveis em um unico lugar."
            })}
          </p>
        </Card>

        <Card className="bg-slate-950/45">
          <h3 className="text-base font-semibold text-white">
            {t({ en: "Recurring income tracking", es: "Seguimiento de ingresos recurrentes", pt: "Acompanhamento de renda recorrente" })}
          </h3>
          <p className="mt-2 text-sm text-slate-300">
            {t({
              en: "Track expected and delivered yield with transparent reporting.",
              es: "Monitorea rendimiento esperado y entregado con reportes transparentes.",
              pt: "Acompanhe rendimento esperado e entregue com relatorios transparentes."
            })}
          </p>
        </Card>

        <Card className="bg-slate-950/45">
          <h3 className="text-base font-semibold text-white">
            {t({ en: "Roadmap in progress", es: "Roadmap en progreso", pt: "Roadmap em progresso" })}
          </h3>
          <p className="mt-2 text-sm text-slate-300">
            {t({
              en: "Flexible liquidity is planned. In this phase, we focus on fraction sales.",
              es: "La liquidez flexible esta en roadmap. En esta fase nos enfocamos en venta de fracciones.",
              pt: "A liquidez flexivel esta no roadmap. Nesta fase focamos em venda de fracoes."
            })}
          </p>
        </Card>
      </div>

      <div className="mt-6 text-center">
        <Link href="/transparencia" className="inline-flex">
          <Button variant="outline">{t({ en: "Explore transparency", es: "Explorar transparencia", pt: "Explorar transparencia" })}</Button>
        </Link>
      </div>
    </section>
  );
}
