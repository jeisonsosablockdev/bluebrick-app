import Image from "next/image";
import type { ReactElement } from "react";

import { Card } from "@/components/ui/card";
import { formatAdminDate } from "@/components/admin/admin-collection-view-format";
import type { AdminCollectionContentRecord } from "@/lib/admin/collection-content-repository";
import type { AdminCollectionOwnership } from "@/lib/admin/collection-ownership";
import { localize, type AppLocale } from "@/lib/i18n";

function MetaStat({
  label,
  value
}: {
  label: string;
  value: string;
}): ReactElement {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/45">{label}</p>
      <p className="mt-2 break-all text-sm text-white/85">{value}</p>
    </div>
  );
}

function MountingPlan({
  locale
}: {
  locale: AppLocale;
}): ReactElement {
  const mountedEditors = [
    localize(locale, { en: "Summary editor", es: "Editor de resumen", pt: "Editor de resumo" }),
    localize(locale, { en: "Property info editor", es: "Editor de property info", pt: "Editor de property info" }),
    localize(locale, { en: "Gallery tabs", es: "Tabs de galeria", pt: "Tabs de galeria" }),
    localize(locale, { en: "Documents editor", es: "Editor de documentos", pt: "Editor de documentos" })
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-white/45">
        {localize(locale, { en: "Mounting plan", es: "Plan de montaje", pt: "Plano de montagem" })}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {mountedEditors.map((label) => (
          <span key={label} className="inline-flex min-h-8 items-center rounded-full border border-white/15 bg-white/5 px-3 text-xs text-white/70">
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AdminCollectionDetailHero({
  locale,
  ownership,
  content
}: {
  locale: AppLocale;
  ownership: AdminCollectionOwnership;
  content: AdminCollectionContentRecord;
}): ReactElement {
  return (
    <Card className="overflow-hidden p-0">
      <div className="grid gap-0 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="border-b border-white/10 p-5 sm:p-6 xl:border-b-0 xl:border-r">
          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-3">
              <div className="relative aspect-[16/10] overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.2),transparent_50%),linear-gradient(165deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))]">
                {content.coverImageUrl ? (
                  <Image
                    alt={localize(locale, {
                      en: `${content.title} cover`,
                      es: `Caratula de ${content.title}`,
                      pt: `Capa de ${content.title}`
                    })}
                    className="h-full w-full object-cover"
                    fill
                    sizes="(max-width: 1024px) 100vw, 540px"
                    src={content.coverImageUrl}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/70">
                    {localize(locale, {
                      en: "Cover is sourced from on-chain metadata.",
                      es: "La caratula se obtiene desde metadata on-chain.",
                      pt: "A capa e obtida da metadata on-chain."
                    })}
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex min-h-9 items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
                  {localize(locale, { en: "Managed from Candy Machine", es: "Gestionado desde Candy Machine", pt: "Gerenciado pela Candy Machine" })}
                </span>
                <span className="inline-flex min-h-9 items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/65">
                  {localize(locale, { en: "Read-only cover", es: "Caratula read-only", pt: "Capa read-only" })}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                  {localize(locale, { en: "Collection detail shell", es: "Shell de detalle de coleccion", pt: "Shell de detalhe da colecao" })}
                </p>
                <h2 className="text-2xl font-semibold text-white sm:text-3xl">{content.title}</h2>
                <p className="text-sm leading-6 text-white/70">
                  {localize(locale, {
                    en: "This shell separates immutable blockchain-derived cover and metadata from the editable sections that will mount in later slices.",
                    es: "Este shell separa la caratula y metadata inmutables derivadas de blockchain de las secciones editables que se montaran en slices posteriores.",
                    pt: "Este shell separa a capa e a metadata imutaveis derivadas do blockchain das secoes editaveis que serao montadas em slices posteriores."
                  })}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <MetaStat
                  label={localize(locale, { en: "Updated", es: "Actualizado", pt: "Atualizado" })}
                  value={formatAdminDate(locale, content.updatedAt)}
                />
                <MetaStat
                  label={localize(locale, { en: "Snapshot", es: "Snapshot", pt: "Snapshot" })}
                  value={`${ownership.snapshotVerificationStatus} / ${ownership.snapshotMarketplaceHandoffStatus}`}
                />
              </div>

              <MountingPlan locale={locale} />
            </div>
          </div>
        </div>

        <div className="space-y-3 p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">
            {localize(locale, { en: "Read-only metadata", es: "Metadata read-only", pt: "Metadata read-only" })}
          </p>
          <MetaStat label={localize(locale, { en: "Collection", es: "Coleccion", pt: "Colecao" })} value={ownership.collectionAddress} />
          <MetaStat label={localize(locale, { en: "Candy machine", es: "Candy machine", pt: "Candy machine" })} value={ownership.candyMachineAddress} />
          <MetaStat label={localize(locale, { en: "Snapshot draft", es: "Snapshot draft", pt: "Snapshot draft" })} value={ownership.snapshotDraftId} />
        </div>
      </div>
    </Card>
  );
}
