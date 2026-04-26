import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import { formatAdminCollectionDocumentTag } from "@/components/admin/admin-collection-document-copy";
import { AdminCollectionGalleryShell } from "@/components/admin/admin-collection-gallery-shell";
import {
  AdminCollectionDetailEmptyState,
  AdminCollectionDetailSectionShell,
  AdminCollectionDetailTextContent
} from "@/components/admin/admin-collection-detail-section-primitives";
import type { CollectionBootstrapDocumentItem } from "@/lib/admin/collection-bootstrap-mapper";
import type { AdminCollectionContentRecord } from "@/lib/admin/collection-content-repository";
import { localize, type AppLocale } from "@/lib/i18n";

function DocumentsList({
  locale,
  items
}: {
  locale: AppLocale;
  items: CollectionBootstrapDocumentItem[];
}): ReactElement {
  if (items.length === 0) {
    return (
      <AdminCollectionDetailEmptyState
        message={localize(locale, {
          en: "No documents were linked yet. The editor slice will mount document controls here next.",
          es: "Aun no hay documentos vinculados. El siguiente slice montara aqui los controles de documentos.",
          pt: "Ainda nao ha documentos vinculados. O proximo slice montara aqui os controles de documentos."
        })}
      />
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/10 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex min-h-8 items-center rounded-full border border-white/15 bg-white/5 px-3 text-xs text-white/70">
                {formatAdminCollectionDocumentTag(locale, item.tag)}
              </span>
              <span className="inline-flex min-h-8 items-center rounded-full border border-white/10 bg-white/[0.03] px-3 text-xs text-white/45">
                {item.source}
              </span>
            </div>
            <p className="text-sm font-semibold text-white">{item.label}</p>
            <p className="text-sm text-white/65">{item.description || item.title}</p>
          </div>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white/85 transition-all hover:bg-white/15"
            href={item.url}
            rel="noreferrer"
            target="_blank"
          >
            {localize(locale, { en: "Open document", es: "Abrir documento", pt: "Abrir documento" })}
          </Link>
        </div>
      ))}
    </div>
  );
}

function SummarySection({
  locale,
  content
}: {
  locale: AppLocale;
  content: AdminCollectionContentRecord;
}): ReactElement {
  return (
    <AdminCollectionDetailSectionShell
      description={localize(locale, {
        en: "Long-form commercial narrative stays in its own module so the future summary editor can mount here without disturbing the page shell.",
        es: "La narrativa comercial larga vive en su propio modulo para que el futuro editor de resumen se monte aqui sin perturbar el shell.",
        pt: "A narrativa comercial longa vive em seu proprio modulo para que o futuro editor de resumo seja montado aqui sem perturbar o shell."
      })}
      eyebrow={localize(locale, { en: "Section scaffold", es: "Scaffold de seccion", pt: "Scaffold de secao" })}
      title={localize(locale, { en: "Fractional investment summary", es: "Fractional investment summary", pt: "Fractional investment summary" })}
    >
      <AdminCollectionDetailTextContent
        emptyMessage={localize(locale, {
          en: "No summary content was persisted yet. The editor slice will mount save/cancel controls here next.",
          es: "Aun no se persistio contenido de resumen. El siguiente slice montara aqui los controles save/cancel.",
          pt: "Ainda nao foi persistido conteudo de resumo. O proximo slice montara aqui os controles save/cancel."
        })}
        value={content.fractionalInvestmentSummary}
      />
    </AdminCollectionDetailSectionShell>
  );
}

function PropertyInformationSection({
  locale,
  content
}: {
  locale: AppLocale;
  content: AdminCollectionContentRecord;
}): ReactElement {
  return (
    <AdminCollectionDetailSectionShell
      description={localize(locale, {
        en: "Property information stays isolated so the future text editor can reuse the same layout and status surface.",
        es: "La informacion de propiedad queda aislada para que el futuro editor de texto reutilice el mismo layout y superficie de estado.",
        pt: "A informacao da propriedade fica isolada para que o futuro editor de texto reutilize o mesmo layout e superficie de estado."
      })}
      eyebrow={localize(locale, { en: "Section scaffold", es: "Scaffold de seccion", pt: "Scaffold de secao" })}
      title={localize(locale, { en: "Property information", es: "Property information", pt: "Property information" })}
    >
      <AdminCollectionDetailTextContent
        emptyMessage={localize(locale, {
          en: "No property information was persisted yet. This block is ready for the dedicated editor slice.",
          es: "Aun no se persistio property information. Este bloque ya esta listo para el slice del editor dedicado.",
          pt: "Ainda nao foi persistida a property information. Este bloco ja esta pronto para o slice do editor dedicado."
        })}
        value={content.propertyInformation}
      />
    </AdminCollectionDetailSectionShell>
  );
}

function DocumentsSection({
  locale,
  content
}: {
  locale: AppLocale;
  content: AdminCollectionContentRecord;
}): ReactElement {
  return (
    <AdminCollectionDetailSectionShell
      description={localize(locale, {
        en: "Documents stay rendered in a stable read-only list so the later editor can focus on mutation flows instead of rebuilding layout and metadata presentation.",
        es: "Los documentos quedan renderizados en una lista read-only estable para que el editor posterior se enfoque en los flujos de mutacion y no en rehacer layout y metadata.",
        pt: "Os documentos permanecem renderizados em uma lista read-only estavel para que o editor posterior foque nos fluxos de mutacao e nao em reconstruir layout e metadata."
      })}
      eyebrow={localize(locale, { en: "Section scaffold", es: "Scaffold de seccion", pt: "Scaffold de secao" })}
      title={localize(locale, { en: "Documents", es: "Documents", pt: "Documents" })}
    >
      <DocumentsList items={content.documents} locale={locale} />
    </AdminCollectionDetailSectionShell>
  );
}

export function AdminCollectionDetailSections({
  locale,
  content,
  summarySection,
  propertyInformationSection,
  gallerySection,
  documentsSection
}: {
  locale: AppLocale;
  content: AdminCollectionContentRecord;
  summarySection?: ReactNode;
  propertyInformationSection?: ReactNode;
  gallerySection?: ReactNode;
  documentsSection?: ReactNode;
}): ReactElement {
  return (
    <>
      {summarySection ?? <SummarySection content={content} locale={locale} />}
      {propertyInformationSection ?? <PropertyInformationSection content={content} locale={locale} />}
      {gallerySection ?? <AdminCollectionGalleryShell content={content} locale={locale} />}
      {documentsSection ?? <DocumentsSection content={content} locale={locale} />}
    </>
  );
}
