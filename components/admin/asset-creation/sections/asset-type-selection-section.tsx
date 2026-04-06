import type { ReactElement } from "react";

import { Card } from "@/components/ui/card";

import type { AssetForm, AssetType } from "@/components/admin/asset-creation/types";
import type { LocalizedCopy, SectionT } from "@/components/admin/asset-creation/sections/section-types";

type SetStateAction<T> = T | ((prev: T) => T);

type AssetTypeSelectionOption = {
  value: Exclude<AssetType, "">;
  title: LocalizedCopy;
  subtitle: LocalizedCopy;
};

type AssetTypeSelectionSectionProps = {
  t: SectionT;
  form: AssetForm;
  setForm: (value: SetStateAction<AssetForm>) => void;
  options: AssetTypeSelectionOption[];
};

export function AssetTypeSelectionSection({
  t,
  form,
  setForm,
  options
}: AssetTypeSelectionSectionProps): ReactElement {
  return (
    <Card className="space-y-3">
      <p className="text-sm font-semibold text-white">{t({ en: "Initial step: type selection", es: "Paso inicial: seleccion de tipo", pt: "Passo inicial: selecao de tipo" })}</p>
      <div className="grid gap-3 md:grid-cols-3">
        {options.map((option) => {
          const active = form.assetType === option.value;
          return (
            <button
              key={option.value}
              className={`rounded-xl border p-3 text-left ${active ? "border-cyan-400/50 bg-cyan-500/10" : "border-white/10 bg-white/5"}`}
              onClick={() => setForm((prev) => ({ ...prev, assetType: option.value }))}
              type="button"
            >
              <p className="font-medium text-white">{t(option.title)}</p>
              <p className="text-xs text-white/70">{t(option.subtitle)}</p>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
