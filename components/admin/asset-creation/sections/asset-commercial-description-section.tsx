import type { ReactElement } from "react";

import { Card } from "@/components/ui/card";

import type { AssetForm } from "@/components/admin/asset-creation/types";
import type { SectionT } from "@/components/admin/asset-creation/sections/section-types";

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
    <Card className="space-y-3">
      <p className="text-sm font-semibold text-white">{t({ en: "Commercial description", es: "Descripcion comercial", pt: "Descricao comercial" })}</p>
      <div className="grid gap-3">
        <textarea className="min-h-20 rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-white" placeholder="shortDescription" value={form.shortDescription} onChange={(event) => setForm((prev) => ({ ...prev, shortDescription: event.target.value }))} />
        <textarea className="min-h-24 rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-white" placeholder="longDescription" value={form.longDescription} onChange={(event) => setForm((prev) => ({ ...prev, longDescription: event.target.value }))} />
        <textarea className="min-h-20 rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-white" placeholder="investmentThesis" value={form.investmentThesis} onChange={(event) => setForm((prev) => ({ ...prev, investmentThesis: event.target.value }))} />
        <textarea className="min-h-20 rounded-xl border border-white/15 bg-slate-900/70 px-4 py-3 text-sm text-white" placeholder="riskNotes" value={form.riskNotes} onChange={(event) => setForm((prev) => ({ ...prev, riskNotes: event.target.value }))} />
      </div>
    </Card>
  );
}
