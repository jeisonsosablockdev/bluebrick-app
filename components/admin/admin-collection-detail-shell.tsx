import Link from "next/link";
import type { ReactElement } from "react";

import { AdminCollectionDetailHero } from "@/components/admin/admin-collection-detail-hero";
import { AdminCollectionDetailSections } from "@/components/admin/admin-collection-detail-sections";
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
          en: "Read-only shell complete. Editors mount in the next STORY-011-06 slices.",
          es: "Shell read-only completo. Los editores se montan en los siguientes slices de STORY-011-06.",
          pt: "Shell read-only completo. Os editores serao montados nos proximos slices da STORY-011-06."
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
      <AdminCollectionDetailSections content={content} locale={locale} />
      <DetailShellFooter locale={locale} />
    </div>
  );
}
