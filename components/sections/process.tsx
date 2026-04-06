"use client";

import Link from "next/link";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { H2, Lead } from "@/components/ui/typography";

export function ProcessSection() {
  const { t } = useI18n();

  const steps = [
    t({
      en: "Sign up and verify your identity",
      es: "Registrate y valida identidad",
      pt: "Cadastre-se e valide sua identidade"
    }),
    t({
      en: "Connect your investment profile",
      es: "Completa tu perfil de acceso",
      pt: "Conecte seu perfil de investimento"
    }),
    t({
      en: "Select your target property",
      es: "Selecciona propiedad objetivo",
      pt: "Selecione o imovel alvo"
    }),
    t({
      en: "Receive periodic yield",
      es: "Recibe rendimiento periodicamente",
      pt: "Receba rendimento periodico"
    })
  ];

  return (
    <section className="rounded-3xl border border-white/10 bg-gradientPanel p-7 md:p-10">
      <div className="mb-8 text-center">
        <H2 className="text-white">{t({ en: "How to Start", es: "Como Empezar", pt: "Como Comecar" })}</H2>
        <Lead className="mx-auto mt-2 max-w-xl">
          {t({
            en: "Four simple steps to start using the platform.",
            es: "Cuatro pasos simples para comenzar a usar la plataforma.",
            pt: "Quatro passos simples para comecar a usar a plataforma."
          })}
        </Lead>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {steps.map((step, index) => (
          <Card key={step} className="bg-slate-950/45">
            <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradientPrimary text-xs font-bold text-white">
              {index + 1}
            </div>
            <p className="text-sm text-slate-200">{step}</p>
          </Card>
        ))}
      </div>

      <div className="mt-7 text-center">
        <Link href="/protected/perfil" className="inline-flex">
          <Button className="px-7">{t({ en: "Start with a free account", es: "Empieza con una cuenta gratis", pt: "Comece com uma conta gratis" })}</Button>
        </Link>
      </div>
    </section>
  );
}
