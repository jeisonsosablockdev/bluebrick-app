"use client";

import Link from "next/link";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";

export function PromoBannerSection() {
  const { t } = useI18n();

  return (
    <section className="rounded-3xl bg-gradientPrimary p-7 md:p-10">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <h3 className="max-w-2xl text-2xl font-bold leading-tight text-white md:text-3xl">
          {t({
            en: "Explore the BRIDS ecosystem: fractional investments, digital traceability and a flow that simplifies transactions.",
            es: "Explora BRIDS: inversiones fraccionadas, trazabilidad digital y una experiencia que facilita las transacciones.",
            pt: "Explore a BRIDS: investimentos fracionados, rastreabilidade digital e uma experiencia que facilita as transacoes."
          })}
        </h3>
        <Link href="/transparencia" className="inline-flex">
          <Button variant="ghost" className="bg-slate-950/75 px-6 text-white hover:bg-slate-950/90">
            {t({ en: "Learn more", es: "Conocer mas", pt: "Saiba mais" })}
          </Button>
        </Link>
      </div>
    </section>
  );
}
