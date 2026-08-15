import type { ReactElement } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { GuidedInputField } from "@/features/admin/presentation/asset-creation/sections/guided-field";
import type { AssetForm } from "@/features/admin/presentation/asset-creation/types";
import type { SectionT } from "@/features/admin/presentation/asset-creation/sections/section-types";

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
        <GuidedInputField
          label={t({ en: "Collection name", es: "Nombre de coleccion", pt: "Nome da colecao" })}
          hint={t({ en: "NFT collection name shown in mint and wallet surfaces.", es: "Nombre de la coleccion NFT visible en mint y wallet.", pt: "Nome da colecao NFT exibido em mint e wallet." })}
          tooltip={t({ en: "Suggested from slug and internal code, but you can override it manually.", es: "Se sugiere desde slug e internalCode, pero puedes ajustarlo manualmente.", pt: "E sugerido a partir de slug e internalCode, mas voce pode ajusta-lo manualmente." })}
          ariaLabel={t({ en: "Collection name help", es: "Ayuda de nombre de coleccion", pt: "Ajuda de nome da colecao" })}
          placeholder={t({ en: "collectionName (required to continue)", es: "collectionName (obligatorio para continuar)", pt: "collectionName (obrigatorio para continuar)" })}
          value={form.collectionName}
          onChange={(event) => {
            setCollectionNameManual(true);
            setForm((prev) => ({ ...prev, collectionName: event.target.value }));
          }}
        />
        <GuidedInputField
          label={t({ en: "Collection symbol", es: "Simbolo de coleccion", pt: "Simbolo da colecao" })}
          hint={t({ en: "Short ticker-style symbol for mint metadata.", es: "Simbolo corto estilo ticker para la metadata de mint.", pt: "Simbolo curto estilo ticker para a metadata de mint." })}
          tooltip={t({ en: "Keep it compact and compatible with token metadata expectations.", es: "Mantenlo compacto y compatible con las expectativas de metadata del token.", pt: "Mantenha compacto e compativel com as expectativas de metadata do token." })}
          ariaLabel={t({ en: "Collection symbol help", es: "Ayuda de simbolo de coleccion", pt: "Ajuda de simbolo da colecao" })}
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
