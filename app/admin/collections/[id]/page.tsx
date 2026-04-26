import type { ReactElement } from "react";
import Link from "next/link";

import { AdminCollectionDetailShell } from "@/components/admin/admin-collection-detail-shell";
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
        localize(locale, { en: "Summary editor mounted", es: "Editor de summary montado", pt: "Editor de summary montado" }),
        localize(locale, { en: "Cover stays locked from Candy Machine", es: "La caratula sigue bloqueada desde Candy Machine", pt: "A capa segue bloqueada pela Candy Machine" }),
        localize(locale, { en: "Other sections remain modular scaffolds", es: "Las otras secciones siguen como scaffolds modulares", pt: "As outras secoes continuam como scaffolds modulares" })
      ]}
      listTitle={localize(locale, { en: "Detail shell", es: "Shell de detalle", pt: "Shell de detalhe" })}
      subtitle={localize(locale, {
        en: "Detail layout over the approved contract, now with the summary edit loop live and the remaining sections staged for later slices.",
        es: "Layout de detalle sobre el contrato aprobado, ahora con el loop de edicion del summary activo y las secciones restantes preparadas para slices posteriores.",
        pt: "Layout de detalhe sobre o contrato aprovado, agora com o loop de edicao do summary ativo e as secoes restantes preparadas para slices posteriores."
      })}
      title={state.content.title}
    >
      <AdminCollectionDetailShell content={state.content} locale={locale} ownership={state.ownership} />
    </AdminModulePlaceholder>
  );
}
