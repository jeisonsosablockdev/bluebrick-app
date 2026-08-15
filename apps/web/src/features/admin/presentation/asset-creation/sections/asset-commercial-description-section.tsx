import type { ReactElement } from "react";

import { Card } from "@/components/ui/card";

import { GuidedTextareaField } from "@/features/admin/presentation/asset-creation/sections/guided-field";
import type { AssetForm } from "@/features/admin/presentation/asset-creation/types";
import type { SectionT } from "@/features/admin/presentation/asset-creation/sections/section-types";

type SetStateAction<T> = T | ((prev: T) => T);

type AssetCommercialDescriptionSectionProps = {
  t: SectionT;
  form: AssetForm;
  setForm: (value: SetStateAction<AssetForm>) => void;
};

export function AssetCommercialDescriptionSection({
  t,
  form,
  setForm
}: AssetCommercialDescriptionSectionProps): ReactElement {
  return (
    <Card className="space-y-5 p-4 sm:p-5 xl:p-6">
      <div className="max-w-3xl space-y-1">
        <p className="text-sm font-semibold text-white">{t({ en: "Commercial description", es: "Descripcion comercial", pt: "Descricao comercial" })}</p>
        <p className="text-sm leading-6 text-white/60">
          {t({
            en: "Define the narrative that investors will read across cards, detail pages, and the marketplace listing.",
            es: "Define la narrativa que los inversionistas leerán en las cards, el detalle y la publicacion del marketplace.",
            pt: "Defina a narrativa que os investidores vao ler nos cards, na pagina de detalhe e na listagem do marketplace."
          })}
        </p>
      </div>
      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <GuidedTextareaField
              label={t({ en: "Short description", es: "Descripcion corta", pt: "Descricao curta" })}
              hint={t({ en: "Brief marketplace summary for cards and compact views.", es: "Resumen breve para cards y vistas compactas del marketplace.", pt: "Resumo breve para cards e vistas compactas do marketplace." })}
              tooltip={t({ en: "Keep it concise and commercial. This is the fastest investor-facing summary.", es: "Mantenla breve y comercial. Es el resumen mas rapido para el inversionista.", pt: "Mantenha concisa e comercial. Este e o resumo mais rapido para o investidor." })}
              ariaLabel={t({ en: "Short description help", es: "Ayuda de descripcion corta", pt: "Ajuda de descricao curta" })}
              className="min-h-[168px] w-full resize-y leading-6"
              placeholder="shortDescription"
              value={form.shortDescription}
              onChange={(event) => setForm((prev) => ({ ...prev, shortDescription: event.target.value }))}
            />
          </div>
        </div>
        <div className="xl:col-span-7">
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <GuidedTextareaField
              label={t({ en: "Long description", es: "Descripcion larga", pt: "Descricao longa" })}
              hint={t({ en: "Full project narrative for admin review and marketplace detail.", es: "Narrativa completa del proyecto para revision admin y detalle del marketplace.", pt: "Narrativa completa do projeto para revisao admin e detalhe do marketplace." })}
              tooltip={t({ en: "Use this field for the broader execution story, not raw tables.", es: "Usa este campo para la historia completa de ejecucion, no para tablas crudas.", pt: "Use este campo para a historia completa de execucao, nao para tabelas cruas." })}
              ariaLabel={t({ en: "Long description help", es: "Ayuda de descripcion larga", pt: "Ajuda de descricao longa" })}
              className="min-h-[168px] w-full resize-y leading-6"
              placeholder="longDescription"
              value={form.longDescription}
              onChange={(event) => setForm((prev) => ({ ...prev, longDescription: event.target.value }))}
            />
          </div>
        </div>
        <div className="xl:col-span-7">
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <GuidedTextareaField
              label={t({ en: "Investment thesis", es: "Tesis de inversion", pt: "Tese de investimento" })}
              hint={t({ en: "Explain why the asset should create value for investors.", es: "Explica por que el activo deberia crear valor para inversionistas.", pt: "Explique por que o ativo deve criar valor para investidores." })}
              tooltip={t({ en: "Capture the return logic, upside, or strategic rationale in plain language.", es: "Captura la logica de retorno, upside o racional estrategico en lenguaje claro.", pt: "Capture a logica de retorno, upside ou racional estrategico em linguagem clara." })}
              ariaLabel={t({ en: "Investment thesis help", es: "Ayuda de tesis de inversion", pt: "Ajuda de tese de investimento" })}
              className="min-h-[176px] w-full resize-y leading-6"
              placeholder="investmentThesis"
              value={form.investmentThesis}
              onChange={(event) => setForm((prev) => ({ ...prev, investmentThesis: event.target.value }))}
            />
          </div>
        </div>
        <div className="xl:col-span-5">
          <div className="rounded-2xl border border-white/10 bg-slate-950/30 p-4">
            <GuidedTextareaField
              label={t({ en: "Risk notes", es: "Notas de riesgo", pt: "Notas de risco" })}
              hint={t({ en: "Summarize the main execution, market, or governance risks.", es: "Resume los principales riesgos de ejecucion, mercado o gobernanza.", pt: "Resuma os principais riscos de execucao, mercado ou governanca." })}
              tooltip={t({ en: "Highlight the main caution points that admin and investors should understand.", es: "Destaca los principales puntos de cautela que admin e inversionistas deben entender.", pt: "Destaque os principais pontos de cautela que admin e investidores devem entender." })}
              ariaLabel={t({ en: "Risk notes help", es: "Ayuda de notas de riesgo", pt: "Ajuda de notas de risco" })}
              className="min-h-[176px] w-full resize-y leading-6"
              placeholder="riskNotes"
              value={form.riskNotes}
              onChange={(event) => setForm((prev) => ({ ...prev, riskNotes: event.target.value }))}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
