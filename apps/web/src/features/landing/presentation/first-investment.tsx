"use client";

import Link from "next/link";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";

export function FirstInvestmentSection() {
  const { t } = useI18n();

  const investmentStats = [
    { value: "UI", label: t({ en: "Structured view", es: "Vista estructurada", pt: "Visao estruturada" }) },
    { value: "Docs", label: t({ en: "Documents", es: "Documentos", pt: "Documentos" }) },
    { value: "Status", label: t({ en: "Traceability", es: "Trazabilidad", pt: "Rastreabilidade" }) },
    { value: "Flow", label: t({ en: "Third-party integrations", es: "Integraciones de terceros", pt: "Integracoes de terceiros" }) }
  ];

  return (
    <section className="mt-20 md:mt-32 relative overflow-hidden rounded-3xl bg-gradientPrimary px-6 py-12 shadow-[0_28px_90px_rgba(47,198,255,0.22)] md:px-10 md:py-16">
      <div className="pointer-events-none absolute -left-6 top-5 h-16 w-16 rounded-full bg-white/10 blur-sm" />
      <div className="pointer-events-none absolute -right-8 bottom-12 h-16 w-16 rounded-full bg-white/10 blur-sm" />

      <div className="text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-2xl text-white">↗</div>
        <h3 className="text-4xl font-extrabold leading-tight text-white md:text-6xl">
          {t({
            en: "Experience BRIDS.",
            es: "Experimenta BRIDS.",
            pt: "Experimente BRIDS."
          })}
        </h3>
        <p className="mt-4 text-xl font-semibold text-white/95">
          {t({
            en: "Discover available projects.",
            es: "Conoce los proyectos disponibles.",
            pt: "Conheca os projetos disponiveis."
          })}
        </p>

        <div className="mt-7 flex flex-col items-center justify-center gap-4 md:flex-row">
          <Link href="/marketplace" className="inline-flex">
            <Button className="bg-white px-12 py-3 text-base font-bold text-slate-900 hover:bg-white/90">
              {t({ en: "Go to marketplace", es: "Ir al marketplace", pt: "Ir para o marketplace" })}
            </Button>
          </Link>
          <div className="text-left text-sm text-white/95">
            <p>{t({ en: "Conditions depend on each project and its applicable documentation.", es: "Las condiciones dependen de cada proyecto y su documentacion aplicable.", pt: "As condicoes dependem de cada projeto e sua documentacao aplicavel." })}</p>
            <p>{t({ en: "Some processes are operated by integrated third-party providers.", es: "Algunos procesos son operados por proveedores externos integrados.", pt: "Alguns processos sao operados por provedores externos integrados." })}</p>
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
