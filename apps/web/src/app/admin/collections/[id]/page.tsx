import type { ReactElement } from "react";
import Link from "next/link";

import { AdminCollectionDetailShell } from "@/features/admin/presentation/admin-collection-detail-shell";
import { AdminModulePlaceholder } from "@/features/admin/presentation/admin-module-placeholder";
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
          localize(locale, { en: "Editor requires payload", es: "El editor requiere payload", pt: "O editor requer payload" })
        ]}
        listTitle={localize(locale, { en: "Detail state", es: "Estado de detalle", pt: "Estado de detalhe" })}
        subtitle={localize(locale, {
          en: "This route exists, but the server did not return an editable collection payload.",
          es: "Esta ruta existe, pero el servidor no devolvio un payload editable de coleccion.",
          pt: "Esta rota existe, mas o servidor nao retornou um payload editavel de colecao."
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
        localize(locale, { en: "Editable content first", es: "Contenido editable primero", pt: "Conteudo editavel primeiro" }),
        localize(locale, { en: "Blockchain stays read-only", es: "Blockchain sigue read-only", pt: "Blockchain permanece read-only" }),
        localize(locale, { en: "Cover stays locked from Candy Machine", es: "La caratula sigue bloqueada desde Candy Machine", pt: "A capa segue bloqueada pela Candy Machine" })
      ]}
      listTitle={localize(locale, { en: "Detail editor", es: "Editor de detalle", pt: "Editor de detalhe" })}
      subtitle={localize(locale, {
        en: "Edit marketplace content while immutable collection evidence remains read-only.",
        es: "Edita contenido de marketplace mientras la evidencia inmutable de coleccion permanece read-only.",
        pt: "Edite conteudo de marketplace enquanto a evidencia imutavel da colecao permanece read-only."
        })}
      title={state.content.title}
    >
      <AdminCollectionDetailShell
        blockchain={state.blockchain}
        content={state.content}
        locale={locale}
        ownership={state.ownership}
      />
    </AdminModulePlaceholder>
  );
}
