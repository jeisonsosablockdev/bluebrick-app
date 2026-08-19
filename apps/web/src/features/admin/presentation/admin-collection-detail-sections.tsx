import Link from "next/link";
import type { ReactElement, ReactNode } from "react";

import { formatAdminCollectionDocumentTag } from "@/features/admin/presentation/admin-collection-document-copy";
import { AdminCollectionGalleryShell } from "@/features/admin/presentation/admin-collection-gallery-shell";
import { AdminCollectionLocationShell } from "@/features/admin/presentation/admin-collection-location-shell";
import {
  AdminCollectionDetailEmptyState,
  AdminCollectionDetailSectionShell,
  AdminCollectionDetailTextContent
} from "@/features/admin/presentation/admin-collection-detail-section-primitives";
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
          en: "No documents are linked yet.",
          es: "Aun no hay documentos vinculados.",
          pt: "Ainda nao ha documentos vinculados."
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
        en: "Long-form commercial narrative stays in its own module for focused review.",
        es: "La narrativa comercial larga vive en su propio modulo para una revision enfocada.",
        pt: "A narrativa comercial longa vive em seu proprio modulo para uma revisao focada."
      })}
      eyebrow={localize(locale, { en: "Content section", es: "Seccion de contenido", pt: "Secao de conteudo" })}
      title={localize(locale, { en: "Fractional investment summary", es: "Fractional investment summary", pt: "Fractional investment summary" })}
    >
      <AdminCollectionDetailTextContent
        emptyMessage={localize(locale, {
          en: "No summary content has been persisted yet.",
          es: "Aun no se ha persistido contenido de resumen.",
          pt: "Ainda nao foi persistido conteudo de resumo."
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
        en: "Property information stays isolated for focused review and section-level updates.",
        es: "La informacion de propiedad queda aislada para revision enfocada y actualizaciones por seccion.",
        pt: "A informacao da propriedade fica isolada para revisao focada e atualizacoes por secao."
      })}
      eyebrow={localize(locale, { en: "Content section", es: "Seccion de contenido", pt: "Secao de conteudo" })}
      title={localize(locale, { en: "Property information", es: "Property information", pt: "Property information" })}
    >
      <AdminCollectionDetailTextContent
        emptyMessage={localize(locale, {
          en: "No property information has been persisted yet.",
          es: "Aun no se ha persistido property information.",
          pt: "Ainda nao foi persistida a property information."
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
        en: "Documents render in a stable list for review and editing context.",
        es: "Los documentos se renderizan en una lista estable para revision y contexto de edicion.",
        pt: "Os documentos renderizam em uma lista estavel para revisao e contexto de edicao."
      })}
      eyebrow={localize(locale, { en: "Content section", es: "Seccion de contenido", pt: "Secao de conteudo" })}
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
  locationSection,
  gallerySection,
  documentsSection
}: {
  locale: AppLocale;
  content: AdminCollectionContentRecord;
  summarySection?: ReactNode;
  propertyInformationSection?: ReactNode;
  locationSection?: ReactNode;
  gallerySection?: ReactNode;
  documentsSection?: ReactNode;
}): ReactElement {
  return (
    <>
      {summarySection ?? <SummarySection content={content} locale={locale} />}
      {propertyInformationSection ?? <PropertyInformationSection content={content} locale={locale} />}
      {locationSection ?? <AdminCollectionLocationShell content={content} locale={locale} />}
      {gallerySection ?? <AdminCollectionGalleryShell content={content} locale={locale} />}
      {documentsSection ?? <DocumentsSection content={content} locale={locale} />}
    </>
  );
}
