"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { H2 } from "@/components/ui/typography";
import { Boxes, LineChart, Target } from "lucide-react";

export function AppCapabilitiesSection() {
  const { t } = useI18n();

  const steps = [
    t({
      en: "Property due diligence and legal structure.",
      es: "Debida diligencia del inmueble y estructura legal.",
      pt: "Due diligence do imóvel e estrutura legal."
    }),
    t({
      en: "Fraction model definition and issuance setup.",
      es: "Definición del modelo fraccionado y configuración de emisión.",
      pt: "Definição do modelo fracionado e configuração da emissão."
    }),
    t({
      en: "Tokenized records with traceability and immutable events.",
      es: "Registros tokenizados con trazabilidad y eventos inmutables.",
      pt: "Registros tokenizados com rastreabilidade e eventos imutáveis."
    }),
    t({
      en: "Publication in marketplace for investor access.",
      es: "Publicación en marketplace para acceso de inversionistas.",
      pt: "Publicação no marketplace para acesso de investidores."
    })
  ];

  return (
    <section className="w-full bg-gradient-to-r from-[#5b64f9] to-[#9245e3] py-20 md:py-32">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-12">
        
        {/* Top Block: Overview (Modal style "Build full-scale AI systems.") */}
        <div className="mb-24 md:mb-32">
          <div className="mb-10">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
              {t({ en: "Ecosystem", es: "Ecosistema", pt: "Ecossistema" })}
            </p>
            <H2 className="text-white text-4xl md:text-5xl lg:text-6xl tracking-tight">
              {t({ en: "What BRIDS does.", es: "Qué hace BRIDS.", pt: "O que a BRIDS faz." })}
            </H2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="landing-depth-card border-white/40 dark:border-slate-800/50 bg-white/90 dark:bg-[#0d1424] p-8 flex flex-col justify-between h-[280px]">
              <Boxes className="h-10 w-10 text-gradientPrimary mb-6" />
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                  {t({ en: "Marketplace access", es: "Acceso a marketplace", pt: "Acesso ao marketplace" })}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t({
                    en: "Review active properties and available fractions in one place.",
                    es: "Revisa propiedades activas y fracciones disponibles en un solo lugar.",
                    pt: "Revise propriedades ativas e frações disponíveis em um único lugar."
                  })}
                </p>
              </div>
            </Card>

            <Card className="landing-depth-card border-white/40 dark:border-slate-800/50 bg-white/90 dark:bg-[#0d1424] p-8 flex flex-col justify-between h-[280px]">
              <LineChart className="h-10 w-10 text-gradientPrimary mb-6" />
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                  {t({ en: "Recurring income tracking", es: "Seguimiento de ingresos recurrentes", pt: "Acompanhamento de renda recorrente" })}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t({
                    en: "Track expected and delivered yield with transparent reporting.",
                    es: "Monitorea rendimiento esperado y entregado con reportes transparentes.",
                    pt: "Acompanhe rendimento esperado e entregue com relatórios transparentes."
                  })}
                </p>
              </div>
            </Card>

            <Card className="landing-depth-card border-white/40 dark:border-slate-800/50 bg-white/90 dark:bg-[#0d1424] p-8 flex flex-col justify-between h-[280px]">
              <Target className="h-10 w-10 text-gradientPrimary mb-6" />
              <div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">
                  {t({ en: "Roadmap in progress", es: "Roadmap en progreso", pt: "Roadmap em progresso" })}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t({
                    en: "Flexible liquidity is planned. In this phase, we focus on fraction sales.",
                    es: "La liquidez flexible está en roadmap. En esta fase nos enfocamos en venta de fracciones.",
                    pt: "A liquidez flexível está no roadmap. Nesta fase focamos em venda de frações."
                  })}
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom Block: Tokenization Process (Modal style "Engineered for inference.") */}
        <div className="grid gap-12 lg:grid-cols-12 lg:items-start lg:gap-16">
          
          {/* Left Column (1/3 width on Desktop) */}
          <div className="lg:col-span-4 flex flex-col items-start">
            <H2 className="text-white text-3xl md:text-4xl tracking-tight mb-6">
              {t({ en: "How tokenization works.", es: "Cómo funciona la tokenización.", pt: "Como funciona a tokenização." })}
            </H2>
            <p className="text-base text-slate-100 dark:text-white leading-relaxed mb-8">
              {t({
                en: "We explain the full process used to transform real estate assets into traceable digital fractions.",
                es: "Explicamos el proceso paso a paso para convertir activos inmobiliarios en fracciones digitales completamente trazables y seguras.",
                pt: "Explicamos o processo passo a passo para transformar ativos imobiliários em frações digitais completamente rastreáveis e seguras."
              })}
            </p>
            <Link href="/transparencia" className="inline-flex">
              <Button variant="outline" className="rounded-full px-6 border-white/30 text-white hover:bg-white hover:text-slate-900 dark:border-slate-600 dark:hover:bg-slate-800 dark:hover:text-white bg-transparent">
                {t({ en: "Explore transparency", es: "Explorar transparencia", pt: "Explorar transparência" })}
              </Button>
            </Link>
          </div>

          {/* Right Column (2/3 width on Desktop) - 2x2 Grid */}
          <div className="lg:col-span-8 grid gap-4 sm:grid-cols-2">
            {steps.map((step, index) => (
              <Card key={index} className="landing-depth-card border-white/40 dark:border-slate-800/50 bg-white/90 dark:bg-[#0d1424]/50 p-6 flex flex-col sm:flex-row gap-4 sm:items-start">
                <div className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 dark:bg-slate-800 text-xs font-bold border border-slate-700">
                  <span style={{ color: "white" }}>{index + 1}</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 pt-1 leading-relaxed">{step}</p>
              </Card>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
