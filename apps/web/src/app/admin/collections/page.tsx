import { AdminModulePlaceholder } from "@/features/admin/presentation/admin-module-placeholder";
import { AdminCollectionsWorkspace } from "@/features/admin/presentation/admin-collections-workspace";
import { loadAdminCollectionsPageState } from "@/lib/admin/collections-page-state";
import { localize } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";

export default async function AdminCollectionsPage() {
  const locale = await getServerLocale();
  const state = await loadAdminCollectionsPageState();

  return (
    <AdminModulePlaceholder
      highlights={[
        localize(locale, { en: "Server-side ownership checks", es: "Ownership verificado server-side", pt: "Ownership verificado server-side" }),
        localize(locale, { en: "Ready rows open the detail editor", es: "Las filas listas abren el editor de detalle", pt: "Linhas prontas abrem o editor de detalhe" }),
        localize(locale, { en: "Review rows stay in the health queue", es: "Las filas en revision quedan en la cola health", pt: "Linhas em revisao ficam na fila health" })
      ]}
      listTitle={localize(locale, { en: "Index controls", es: "Controles del index", pt: "Controles do index" })}
      subtitle={localize(locale, {
        en: "Manage ready collection entries and route degraded rows to health review.",
        es: "Gestiona entries de coleccion listas y envia filas degradadas a revision health.",
        pt: "Gerencie entradas de colecao prontas e envie linhas degradadas para revisao health."
      })}
      title={localize(locale, { en: "Collections", es: "Colecciones", pt: "Colecoes" })}
    >
      <AdminCollectionsWorkspace locale={locale} state={state} />
    </AdminModulePlaceholder>
  );
}
