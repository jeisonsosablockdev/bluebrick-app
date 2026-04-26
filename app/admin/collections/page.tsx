import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";
import { AdminCollectionsWorkspace } from "@/components/admin/admin-collections-workspace";
import { loadAdminCollectionsPageState } from "@/lib/admin/collections-page-state";
import { localize } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";

export default async function AdminCollectionsPage() {
  const locale = await getServerLocale();
  const state = await loadAdminCollectionsPageState();

  return (
    <AdminModulePlaceholder
      highlights={[
        localize(locale, { en: "Ownership checked server-side", es: "Ownership verificado server-side", pt: "Ownership verificado server-side" }),
        localize(locale, { en: "Collection cards with visual status", es: "Cards de colecciones con estado visual", pt: "Cards de colecoes com estado visual" }),
        localize(locale, { en: "Detail route now active for ready entries", es: "La ruta de detalle ya esta activa para entries listas", pt: "A rota de detalhe ja esta ativa para entradas prontas" })
      ]}
      listTitle={localize(locale, { en: "Index readiness", es: "Preparacion del index", pt: "Preparacao do index" })}
      subtitle={localize(locale, {
        en: "Visual admin index for owned collections using the approved read-model contract and handoff route to detail.",
        es: "Index visual admin para colecciones propias usando el contrato aprobado del read-model y la ruta de handoff al detalle.",
        pt: "Index visual admin para colecoes proprias usando o contrato aprovado do read-model e a rota de handoff para detalhe."
      })}
      title={localize(locale, { en: "Collections", es: "Colecciones", pt: "Colecoes" })}
    >
      <AdminCollectionsWorkspace locale={locale} state={state} />
    </AdminModulePlaceholder>
  );
}
