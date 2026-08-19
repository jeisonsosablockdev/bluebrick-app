import Link from "next/link";
import type { ReactElement } from "react";

import { AdminCollectionBlockchainBasePanel } from "@/features/admin/presentation/admin-collection-blockchain-base-panel";
import { AdminCollectionGalleryShell } from "@/features/admin/presentation/admin-collection-gallery-shell";
import { AdminCollectionDetailHero } from "@/features/admin/presentation/admin-collection-detail-hero";
import { AdminCollectionDetailSections } from "@/features/admin/presentation/admin-collection-detail-sections";
import { AdminCollectionDocumentsEditor } from "@/features/admin/presentation/admin-collection-documents-editor";
import { AdminCollectionLocationEditor } from "@/features/admin/presentation/admin-collection-location-editor";
import { AdminCollectionPropertyInformationEditor } from "@/features/admin/presentation/admin-collection-property-information-editor";
import { AdminCollectionSummaryEditor } from "@/features/admin/presentation/admin-collection-summary-editor";
import type { AdminCollectionBlockchainPanel } from "@/lib/admin/collection-blockchain-panel";
import type { AdminCollectionContentRecord } from "@/lib/admin/collection-content-repository";
import type { AdminCollectionOwnership } from "@/lib/admin/collection-ownership";
import { localize, type AppLocale } from "@/lib/i18n";

type AdminCollectionDetailShellProps = {
  locale: AppLocale;
  ownership: AdminCollectionOwnership;
  content: AdminCollectionContentRecord;
  blockchain: AdminCollectionBlockchainPanel;
};

function DetailShellFooter({
  locale
}: {
  locale: AppLocale;
}): ReactElement {
  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Link
        className="inline-flex min-h-11 items-center justify-center rounded-full bg-gradientPrimary px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:opacity-95"
        href="/admin/collections"
      >
        {localize(locale, { en: "Back to collections", es: "Volver a colecciones", pt: "Voltar para colecoes" })}
      </Link>
    </div>
  );
}

export function AdminCollectionDetailShell({
  locale,
  ownership,
  content,
  blockchain
}: AdminCollectionDetailShellProps): ReactElement {
  const googleMapsEmbedApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY?.trim() || null;

  return (
    <div className="space-y-4">
      <AdminCollectionDetailHero content={content} locale={locale} ownership={ownership} />
      <section className="space-y-3" aria-labelledby="collection-content-workspace-heading">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">
            {localize(locale, { en: "Content workspace", es: "Workspace de contenido", pt: "Workspace de conteudo" })}
          </p>
          <h3 id="collection-content-workspace-heading" className="text-lg font-semibold text-white">
            {localize(locale, { en: "Editable marketplace content", es: "Contenido editable de marketplace", pt: "Conteudo editavel de marketplace" })}
          </h3>
        </div>
        <AdminCollectionDetailSections
          content={content}
          locale={locale}
          summarySection={
            <AdminCollectionSummaryEditor
              entryId={content.entryId}
              initialValue={content.fractionalInvestmentSummary}
              locale={locale}
            />
          }
          propertyInformationSection={
            <AdminCollectionPropertyInformationEditor
              entryId={content.entryId}
              initialValue={content.propertyInformation}
              locale={locale}
            />
          }
          locationSection={
            <AdminCollectionLocationEditor
              content={content}
              entryId={content.entryId}
              googleMapsEmbedApiKey={googleMapsEmbedApiKey}
              locale={locale}
            />
          }
          gallerySection={<AdminCollectionGalleryShell content={content} locale={locale} />}
          documentsSection={
            <AdminCollectionDocumentsEditor
              entryId={content.entryId}
              initialDocuments={content.documents}
              locale={locale}
            />
          }
        />
      </section>
      <section className="space-y-3" aria-labelledby="collection-blockchain-reference-heading">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">
            {localize(locale, { en: "Blockchain reference", es: "Referencia blockchain", pt: "Referencia blockchain" })}
          </p>
          <h3 id="collection-blockchain-reference-heading" className="text-lg font-semibold text-white">
            {localize(locale, { en: "Read-only collection evidence", es: "Evidencia read-only de coleccion", pt: "Evidencia read-only da colecao" })}
          </h3>
        </div>
        <AdminCollectionBlockchainBasePanel blockchain={blockchain} locale={locale} />
      </section>
      <DetailShellFooter locale={locale} />
    </div>
  );
}
