import type { ReactElement } from "react";

import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

import type { AssetForm } from "@/components/admin/asset-creation/types";
import type { SectionT } from "@/components/admin/asset-creation/sections/section-types";

type SetStateAction<T> = T | ((prev: T) => T);

type AssetIdentificationSectionProps = {
  t: SectionT;
  form: AssetForm;
  setForm: (value: SetStateAction<AssetForm>) => void;
};

export function AssetIdentificationSection({
  t,
  form,
  setForm
}: AssetIdentificationSectionProps): ReactElement {
  return (
    <Card className="space-y-3">
      <p className="text-sm font-semibold text-white">{t({ en: "Identification", es: "Identificacion", pt: "Identificacao" })}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input placeholder="assetName" value={form.assetName} onChange={(event) => setForm((prev) => ({ ...prev, assetName: event.target.value }))} />
        <Input placeholder="slug" value={form.slug} onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))} />
        <Input placeholder="internalCode" value={form.internalCode} onChange={(event) => setForm((prev) => ({ ...prev, internalCode: event.target.value }))} />
      </div>
      <p className="text-xs text-white/60">
        {t({
          en: "Commercial asset status is derived from on-chain state and is not manually selected here.",
          es: "El estado comercial del activo se deriva del estado on-chain y no se selecciona manualmente aqui.",
          pt: "O status comercial do ativo e derivado do estado on-chain e nao e selecionado manualmente aqui."
        })}
      </p>
    </Card>
  );
}
