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
            en: "We answer common questions about tokenization, returns and security.",
            es: "Resolvemos dudas sobre tokenizacion, retornos y seguridad.",
            pt: "Respondemos duvidas sobre tokenizacao, retornos e seguranca."
          })}
        </Lead>
      </div>

      <div className="space-y-3">
        {faqs.map((faq) => (
          <Card key={faq.question} className="bg-slate-950/50">
            <h3 className="text-base font-semibold text-white">{faq.question}</h3>
            <p className="mt-2 text-sm text-slate-300">{faq.answer}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
