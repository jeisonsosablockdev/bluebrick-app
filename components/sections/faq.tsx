import { faqs } from "@/app/data";
import { Card } from "@/components/ui/card";
import { H2, Lead } from "@/components/ui/typography";

export function FaqSection() {
  return (
    <section className="py-12">
      <div className="mb-7 text-center">
        <H2 className="text-white">FAQ Preguntas Frecuentes</H2>
        <Lead className="mx-auto mt-2 max-w-xl">Resolvemos dudas sobre tokenización, retornos y seguridad.</Lead>
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
