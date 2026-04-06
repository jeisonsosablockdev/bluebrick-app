"use client";

import Link from "next/link";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { H2, Lead } from "@/components/ui/typography";

export function TokenizationProcessSection() {
  const { t } = useI18n();

  const steps = [
    t({
      en: "Property due diligence and legal structure.",
      es: "Debida diligencia del inmueble y estructura legal.",
      pt: "Due diligence do imovel e estrutura legal."
    }),
    t({
      en: "Fraction model definition and issuance setup.",
      es: "Definicion del modelo fraccionado y configuracion de emision.",
      pt: "Definicao do modelo fracionado e configuracao da emissao."
    }),
    t({
      en: "Tokenized records with traceability and immutable events.",
      es: "Registros tokenizados con trazabilidad y eventos inmutables.",
      pt: "Registros tokenizados com rastreabilidade e eventos imutaveis."
    }),
    t({
      en: "Publication in marketplace for investor access.",
      es: "Publicacion en marketplace para acceso de inversionistas.",
      pt: "Publicacao no marketplace para acesso de investidores."
    })
  ];

  return (
    <section className="py-12">
      <div className="mb-8 text-center">
        <H2 className="text-white">
          {t({ en: "How tokenization works", es: "Como funciona la tokenizacion", pt: "Como funciona a tokenizacao" })}
        </H2>
        <Lead className="mx-auto mt-2 max-w-2xl">
          {t({
            en: "We explain the full process used to transform real estate assets into traceable digital fractions.",
            es: "Explicamos el proceso para convertir activos inmobiliarios en fracciones digitales trazables.",
            pt: "Explicamos o processo para transformar ativos imobiliarios em fracoes digitais rastreaveis."
          })}
        </Lead>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {steps.map((step, index) => (
          <Card key={step} className="bg-slate-950/45">
            <div className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradientPrimary text-xs font-bold text-white">
              {index + 1}
            </div>
            <p className="text-sm text-slate-200">{step}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 text-center">
        <Link href="/transparencia" className="inline-flex">
          <Button>{t({ en: "View transparency", es: "Ver transparencia", pt: "Ver transparencia" })}</Button>
        </Link>
      </div>
    </section>
  );
}
