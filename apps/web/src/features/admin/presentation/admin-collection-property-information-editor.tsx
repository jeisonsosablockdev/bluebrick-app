"use client";

import type { ReactElement } from "react";

import { AdminCollectionTextSectionEditor } from "@/features/admin/presentation/admin-collection-text-section-editor";
import { localize, type AppLocale } from "@/lib/i18n";

type AdminCollectionPropertyInformationEditorProps = {
  entryId: string;
  locale: AppLocale;
  initialValue: string | null;
};

export function AdminCollectionPropertyInformationEditor({
  entryId,
  locale,
  initialValue
}: AdminCollectionPropertyInformationEditorProps): ReactElement {
  return (
    <AdminCollectionTextSectionEditor
      copy={{
        idlePill: localize(locale, { en: "Property editor", es: "Editor de propiedad", pt: "Editor da propriedade" }),
        fieldLabel: localize(locale, { en: "Property description", es: "Descripcion de la propiedad", pt: "Descricao da propriedade" }),
        placeholder: localize(locale, {
          en: "Describe the property, location context, building condition, and investor-facing fundamentals for this collection.",
          es: "Describe la propiedad, el contexto de ubicacion, la condicion del edificio y los fundamentos para inversionistas de esta coleccion.",
          pt: "Descreva a propriedade, o contexto de localizacao, a condicao do edificio e os fundamentos para investidores desta colecao."
        }),
        saveLabel: localize(locale, { en: "Save property information", es: "Guardar property information", pt: "Salvar property information" }),
        savingLabel: localize(locale, { en: "Saving property information", es: "Guardando property information", pt: "Salvando property information" }),
        dirtyMessage: localize(locale, {
          en: "Property information changes remain local until you save this section.",
          es: "Los cambios de property information permanecen locales hasta que guardes esta seccion.",
          pt: "As alteracoes de property information permanecem locais ate voce salvar esta secao."
        }),
        savingMessage: localize(locale, {
          en: "Saving only the property information section. Summary, gallery, and documents remain untouched.",
          es: "Guardando solo la seccion de property information. Summary, gallery y documents no cambian.",
          pt: "Salvando apenas a secao de property information. Summary, gallery e documents permanecem intactos."
        }),
        successMessage: localize(locale, {
          en: "Property information saved. The latest persisted text is already reflected below.",
          es: "Property information guardada. El ultimo texto persistido ya se refleja abajo.",
          pt: "Property information salva. O texto persistido mais recente ja aparece abaixo."
        }),
        fallbackErrorMessage: localize(locale, {
          en: "Could not save the property information section.",
          es: "No se pudo guardar la seccion de property information.",
          pt: "Nao foi possivel salvar a secao de property information."
        })
      }}
      description={localize(locale, {
        en: "Property context has its own save boundary so operational details can evolve independently from summary, media, and documents.",
        es: "El contexto de la propiedad tiene su propio limite de guardado para que los detalles operativos evolucionen de forma independiente del summary, media y documentos.",
        pt: "O contexto da propriedade tem seu proprio limite de salvamento para que os detalhes operacionais evoluam de forma independente do summary, midia e documentos."
      })}
      entryId={entryId}
      eyebrow={localize(locale, { en: "Editable section", es: "Seccion editable", pt: "Secao editavel" })}
      fieldId="collection-property-information-editor"
      initialValue={initialValue}
      locale={locale}
      section="propertyInformation"
      title={localize(locale, { en: "Property information", es: "Property information", pt: "Property information" })}
    />
  );
}
