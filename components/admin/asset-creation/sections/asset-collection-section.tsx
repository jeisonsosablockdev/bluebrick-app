import type { ReactElement } from "react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import type { AssetForm } from "@/components/admin/asset-creation/types";
import type { SectionT } from "@/components/admin/asset-creation/sections/section-types";

type SetStateAction<T> = T | ((prev: T) => T);

type AssetCollectionSectionProps = {
  t: SectionT;
  form: AssetForm;
  setForm: (value: SetStateAction<AssetForm>) => void;
  setCollectionNameManual: (value: SetStateAction<boolean>) => void;
  setCollectionSymbolManual: (value: SetStateAction<boolean>) => void;
  onResetSuggestedValues: () => void;
};

export function AssetCollectionSection({
  t,
  form,
  setForm,
  setCollectionNameManual,
  setCollectionSymbolManual,
  onResetSuggestedValues
}: AssetCollectionSectionProps): ReactElement {
  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-white">{t({ en: "Fraction / Collection relationship", es: "Relacion Fracción / Coleccion", pt: "Relacao Fração / Colecao" })}</p>
        <Button className="min-h-11" variant="ghost" onClick={onResetSuggestedValues}>
          {t({ en: "Reset suggested values", es: "Resetear valores sugeridos", pt: "Resetar valores sugeridos" })}
        </Button>
      </div>
      <p className="text-xs text-white/60">
        {t({
          en: "collectionName and collectionSymbol are auto-suggested from slug + internalCode. You can override manually.",
          es: "collectionName y collectionSymbol se sugieren automaticamente desde slug + internalCode. Puedes sobreescribirlos manualmente.",
          pt: "collectionName e collectionSymbol sao sugeridos automaticamente por slug + internalCode. Voce pode sobrescrever manualmente."
        })}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          placeholder={t({ en: "collectionName (required to continue)", es: "collectionName (obligatorio para continuar)", pt: "collectionName (obrigatorio para continuar)" })}
          value={form.collectionName}
          onChange={(event) => {
            setCollectionNameManual(true);
            setForm((prev) => ({ ...prev, collectionName: event.target.value }));
          }}
        />
        <Input
          placeholder="collectionSymbol"
          value={form.collectionSymbol}
          onChange={(event) => {
            setCollectionSymbolManual(true);
            setForm((prev) => ({ ...prev, collectionSymbol: event.target.value }));
          }}
        />
      </div>
    </Card>
  );
}
