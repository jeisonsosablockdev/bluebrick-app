"use client";

import type { ReactElement } from "react";

import { AdminCollectionTextSectionEditor } from "@/features/admin/presentation/admin-collection-text-section-editor";
import { localize, type AppLocale } from "@/lib/i18n";

type AdminCollectionSummaryEditorProps = {
  entryId: string;
  locale: AppLocale;
  initialValue: string | null;
};

export function AdminCollectionSummaryEditor({
  entryId,
  locale,
  initialValue
}: AdminCollectionSummaryEditorProps): ReactElement {
  return (
    <AdminCollectionTextSectionEditor
      copy={{
        idlePill: localize(locale, { en: "Summary editor", es: "Editor de resumen", pt: "Editor de resumo" }),
        fieldLabel: localize(locale, { en: "Summary narrative", es: "Narrativa del resumen", pt: "Narrativa do resumo" }),
        placeholder: localize(locale, {
          en: "Describe the commercial thesis, yield profile, and investor-facing highlights for this collection.",
          es: "Describe la tesis comercial, el perfil de yield y los highlights para inversionistas de esta coleccion.",
          pt: "Descreva a tese comercial, o perfil de yield e os destaques para investidores desta colecao."
        }),
        saveLabel: localize(locale, { en: "Save summary", es: "Save summary", pt: "Save summary" }),
        savingLabel: localize(locale, { en: "Saving summary", es: "Guardando resumen", pt: "Salvando resumo" }),
        dirtyMessage: localize(locale, {
          en: "Summary changes are local until you press Save summary.",
          es: "Los cambios del resumen son locales hasta que presiones Save summary.",
          pt: "As alteracoes do resumo permanecem locais ate voce pressionar Save summary."
        }),
        savingMessage: localize(locale, {
          en: "Saving the summary section only. Other sections remain untouched.",
          es: "Guardando solo la seccion de resumen. Las otras secciones no cambian.",
          pt: "Salvando apenas a secao de resumo. As outras secoes permanecem intactas."
        }),
        successMessage: localize(locale, {
          en: "Summary saved. The latest persisted value is already reflected below.",
          es: "Resumen guardado. El ultimo valor persistido ya se refleja abajo.",
          pt: "Resumo salvo. O valor persistido mais recente ja aparece abaixo."
        }),
        fallbackErrorMessage: localize(locale, {
          en: "Could not save the summary section.",
          es: "No se pudo guardar la seccion de resumen.",
          pt: "Nao foi possivel salvar a secao de resumo."
        })
      }}
      description={localize(locale, {
        en: "Commercial narrative now owns its own edit loop so the admin can save or discard summary changes without reopening the rest of the detail page.",
        es: "La narrativa comercial ahora tiene su propio loop de edicion para que el admin pueda guardar o descartar cambios del resumen sin reabrir el resto de la pagina.",
        pt: "A narrativa comercial agora tem seu proprio loop de edicao para que o admin possa salvar ou descartar alteracoes do resumo sem reabrir o restante da pagina."
      })}
      entryId={entryId}
      eyebrow={localize(locale, { en: "Editable section", es: "Seccion editable", pt: "Secao editavel" })}
      fieldId="collection-summary-editor"
      initialValue={initialValue}
      locale={locale}
      section="summary"
      title={localize(locale, { en: "Fractional investment summary", es: "Fractional investment summary", pt: "Fractional investment summary" })}
    />
  );
}
