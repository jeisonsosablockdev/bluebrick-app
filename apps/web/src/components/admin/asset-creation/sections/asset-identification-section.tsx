import type { ReactElement } from "react";

import { Card } from "@/components/ui/card";

import { GuidedInputField } from "@/components/admin/asset-creation/sections/guided-field";
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
        <GuidedInputField
          label={t({ en: "Asset name", es: "Nombre del activo", pt: "Nome do ativo" })}
          hint={t({ en: "Commercial name shown in admin and marketplace.", es: "Nombre comercial visible en admin y marketplace.", pt: "Nome comercial exibido no admin e no marketplace." })}
          tooltip={t({ en: "Use the human-readable project name, not the full address.", es: "Usa el nombre legible del proyecto, no la direccion completa.", pt: "Use o nome legivel do projeto, nao o endereco completo." })}
          ariaLabel={t({ en: "Asset name help", es: "Ayuda de nombre del activo", pt: "Ajuda do nome do ativo" })}
          placeholder="assetName"
          value={form.assetName}
          onChange={(event) => setForm((prev) => ({ ...prev, assetName: event.target.value }))}
        />
        <GuidedInputField
          label={t({ en: "Slug", es: "Slug", pt: "Slug" })}
          hint={t({ en: "URL-safe identifier used for entry ids and routes.", es: "Identificador seguro para URL usado en ids y rutas.", pt: "Identificador seguro para URL usado em ids e rotas." })}
          tooltip={t({ en: "Keep it short, lowercase, and unique for the asset.", es: "Mantenlo corto, en minusculas y unico para el activo.", pt: "Mantenha curto, em minusculas e unico para o ativo." })}
          ariaLabel={t({ en: "Slug help", es: "Ayuda de slug", pt: "Ajuda de slug" })}
          placeholder="slug"
          value={form.slug}
          onChange={(event) => setForm((prev) => ({ ...prev, slug: event.target.value }))}
        />
        <GuidedInputField
          label={t({ en: "Internal code", es: "Codigo interno", pt: "Codigo interno" })}
          hint={t({ en: "Operational reference from the brief or internal workflow.", es: "Referencia operativa del brief o del flujo interno.", pt: "Referencia operacional do brief ou do fluxo interno." })}
          tooltip={t({ en: "Use the deal or reference number that operations track internally.", es: "Usa el numero de deal o referencia que operaciones sigue internamente.", pt: "Use o numero do deal ou referencia que a operacao acompanha internamente." })}
          ariaLabel={t({ en: "Internal code help", es: "Ayuda de codigo interno", pt: "Ajuda de codigo interno" })}
          placeholder="internalCode"
          value={form.internalCode}
          onChange={(event) => setForm((prev) => ({ ...prev, internalCode: event.target.value }))}
        />
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
