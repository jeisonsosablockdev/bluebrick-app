"use client";

import { getHomeContent } from "@/app/data";
import { useI18n } from "@/components/i18n/locale-provider";
import { Card } from "@/components/ui/card";
import { H2, Lead } from "@/components/ui/typography";

export function FaqSection() {
  const { locale, t } = useI18n();
  const { faqs } = getHomeContent(locale);

  return (
    <section className="py-12">
      <div className="mb-7 text-center">
        <H2 className="text-white">
          {t({ en: "FAQ Frequently Asked Questions", es: "FAQ Preguntas Frecuentes", pt: "FAQ Perguntas Frequentes" })}
        </H2>
        <Lead className="mx-auto mt-2 max-w-xl">
          {t({
            en: "We answer common questions about tokenization, processes and platform security.",
            es: "Resolvemos dudas sobre tokenizacion, procesos y seguridad de plataforma.",
            pt: "Respondemos duvidas sobre tokenizacao, processos e seguranca da plataforma."
          })}
        </Lead>
      </div>

      <div className="space-y-3">
        {faqs.map((faq) => (
          <Card key={faq.question} className="bg-slate-950/50">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-white">{faq.question}</h3>
              {faq.topic ? (
                <span className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-200">
                  {faq.topic}
                </span>
              ) : null}
            </div>
            <p className="mt-2 text-sm text-slate-300">{faq.answer}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
