import Link from "next/link";
import type { ReactElement } from "react";

import { AdminCollectionGalleryShell } from "@/components/admin/admin-collection-gallery-shell";
import { AdminCollectionDetailHero } from "@/components/admin/admin-collection-detail-hero";
import { AdminCollectionDetailSections } from "@/components/admin/admin-collection-detail-sections";
import { AdminCollectionPropertyInformationEditor } from "@/components/admin/admin-collection-property-information-editor";
import { AdminCollectionSummaryEditor } from "@/components/admin/admin-collection-summary-editor";
import type { AdminCollectionContentRecord } from "@/lib/admin/collection-content-repository";
import type { AdminCollectionOwnership } from "@/lib/admin/collection-ownership";
import { localize, type AppLocale } from "@/lib/i18n";

type AdminCollectionDetailShellProps = {
  locale: AppLocale;
  ownership: AdminCollectionOwnership;
  content: AdminCollectionContentRecord;
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
      <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-white/65">
        {localize(locale, {
          en: "Summary and property editing are live, and gallery tabs are now staged. Documents arrive in the next STORY-011-06 slice.",
          es: "La edicion de summary y property information ya esta activa, y las tabs de gallery ya quedaron montadas. Documents llega en el siguiente slice de STORY-011-06.",
          pt: "A edicao de summary e property information ja esta ativa, e as abas de gallery agora estao montadas. Documents chega no proximo slice de STORY-011-06."
        })}
      </span>
    </div>
  );
}

export function AdminCollectionDetailShell({
  locale,
  ownership,
  content
}: AdminCollectionDetailShellProps): ReactElement {
  return (
    <div className="space-y-4">
      <AdminCollectionDetailHero content={content} locale={locale} ownership={ownership} />
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
        gallerySection={<AdminCollectionGalleryShell content={content} locale={locale} />}
      />
      <DetailShellFooter locale={locale} />
    </div>
  );
}
