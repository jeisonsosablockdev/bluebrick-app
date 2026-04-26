import type { ReactElement } from "react";
import Image from "next/image";
import Link from "next/link";

import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";
import { Card } from "@/components/ui/card";
import { loadAdminCollectionDetailPageState } from "@/lib/admin/collection-detail-page-state";
import { localize } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";

type AdminCollectionDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(locale: string, value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(parsed);
}

function DetailMetaCard({
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

export default async function AdminCollectionDetailPage({
  params
}: AdminCollectionDetailPageProps): Promise<ReactElement> {
  const locale = await getServerLocale();
  const { id } = await params;
  const state = await loadAdminCollectionDetailPageState(id);

  if (state.kind === "error") {
    return (
      <AdminModulePlaceholder
        highlights={[
          localize(locale, { en: "Route contract is live", es: "El contrato de ruta ya esta activo", pt: "O contrato de rota ja esta ativo" }),
          localize(locale, { en: "Ownership stays server-side", es: "El ownership sigue server-side", pt: "O ownership permanece server-side" }),
          localize(locale, { en: "Editor UI remains deferred", es: "La UI del editor sigue diferida", pt: "A UI do editor permanece adiada" })
        ]}
        listTitle={localize(locale, { en: "Detail handoff", es: "Handoff de detalle", pt: "Handoff de detalhe" })}
        subtitle={localize(locale, {
          en: "This route now exists, but it only exposes a safe handoff while the modular editor arrives in the next story slices.",
          es: "Esta ruta ya existe, pero por ahora solo expone un handoff seguro mientras el editor modular llega en los siguientes slices.",
          pt: "Esta rota ja existe, mas por enquanto expoe apenas um handoff seguro enquanto o editor modular chega nos proximos slices."
        })}
        title={localize(locale, { en: "Collection detail", es: "Detalle de coleccion", pt: "Detalhe da colecao" })}
      >
        <Card className="space-y-4">
          <p className="rounded-2xl border border-rose-300/20 bg-rose-400/10 p-4 text-sm text-rose-100">{state.message}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white/85 transition-all hover:bg-white/15"
              href="/admin/collections"
            >
              {localize(locale, { en: "Back to collections", es: "Volver a colecciones", pt: "Voltar para colecoes" })}
            </Link>
          </div>
        </Card>
      </AdminModulePlaceholder>
    );
  }

  return (
    <AdminModulePlaceholder
      highlights={[
        localize(locale, { en: "GET detail contract connected", es: "Contrato GET de detalle conectado", pt: "Contrato GET de detalhe conectado" }),
        localize(locale, { en: "Cover remains read-only", es: "La caratula sigue read-only", pt: "A capa continua read-only" }),
        localize(locale, { en: "Section editors ship in STORY-011-06", es: "Los editores por seccion llegan en STORY-011-06", pt: "Os editores por secao chegam na STORY-011-06" })
      ]}
      listTitle={localize(locale, { en: "Navigation handoff", es: "Handoff de navegacion", pt: "Handoff de navegacao" })}
      subtitle={localize(locale, {
        en: "This page validates the approved detail route and surfaces the owned collection context without pulling editor complexity into the index story.",
        es: "Esta pagina valida la ruta aprobada de detalle y muestra el contexto de la coleccion propia sin arrastrar complejidad del editor dentro de la story del index.",
        pt: "Esta pagina valida a rota aprovada de detalhe e mostra o contexto da colecao propria sem puxar a complexidade do editor para a story do index."
      })}
      title={state.content.title}
    >
      <Card className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.2),transparent_50%),linear-gradient(165deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] lg:max-w-md">
            {state.content.coverImageUrl ? (
              <Image
                alt={localize(locale, {
                  en: `${state.content.title} cover`,
                  es: `Caratula de ${state.content.title}`,
                  pt: `Capa de ${state.content.title}`
                })}
                className="h-full w-full object-cover"
                fill
                sizes="(max-width: 1024px) 100vw, 420px"
                src={state.content.coverImageUrl}
              />
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/70">
                {localize(locale, {
                  en: "Cover comes from on-chain metadata.",
                  es: "La caratula proviene de metadata on-chain.",
                  pt: "A capa vem da metadata on-chain."
                })}
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2 text-xs text-white/70">
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-emerald-200">
                  {localize(locale, { en: "Detail route active", es: "Ruta de detalle activa", pt: "Rota de detalhe ativa" })}
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1">
                  {localize(locale, { en: "Editor pending", es: "Editor pendiente", pt: "Editor pendente" })}
                </span>
              </div>
              <h2 className="text-2xl font-semibold text-white">{state.content.title}</h2>
              <p className="text-sm text-white/70">
                {localize(locale, {
                  en: "The next story will replace this handoff with section-level editing. For now, the route proves ownership, payload resolution, and contextual navigation.",
                  es: "La siguiente story reemplazara este handoff por edicion por secciones. Por ahora, la ruta prueba ownership, resolucion del payload y navegacion contextual.",
                  pt: "A proxima story substituira este handoff por edicao por secoes. Por enquanto, a rota prova ownership, resolucao do payload e navegacao contextual."
                })}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <DetailMetaCard
                label={localize(locale, { en: "Collection", es: "Coleccion", pt: "Colecao" })}
                value={state.ownership.collectionAddress}
              />
              <DetailMetaCard
                label={localize(locale, { en: "Candy machine", es: "Candy machine", pt: "Candy machine" })}
                value={state.ownership.candyMachineAddress}
              />
              <DetailMetaCard
                label={localize(locale, { en: "Snapshot status", es: "Estado del snapshot", pt: "Status do snapshot" })}
                value={`${state.ownership.snapshotVerificationStatus} / ${state.ownership.snapshotMarketplaceHandoffStatus}`}
              />
              <DetailMetaCard
                label={localize(locale, { en: "Last updated", es: "Ultima actualizacion", pt: "Ultima atualizacao" })}
                value={formatDate(locale, state.content.updatedAt)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-gradientPrimary px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition-all hover:opacity-95"
            href="/admin/collections"
          >
            {localize(locale, { en: "Back to collections", es: "Volver a colecciones", pt: "Voltar para colecoes" })}
          </Link>
          <span className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm text-white/65">
            {localize(locale, {
              en: "Editors for summary, property info, gallery, and documents land next.",
              es: "Los editores de resumen, property info, galeria y documentos llegan despues.",
              pt: "Os editores de resumo, property info, galeria e documentos chegam depois."
            })}
          </span>
        </div>
      </Card>
    </AdminModulePlaceholder>
  );
}
