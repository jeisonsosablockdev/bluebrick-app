import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";
import { AdminCollectionsMinimalList } from "@/components/admin/admin-collections-minimal-list";
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
        localize(locale, { en: "Clear loading, empty, and error states", es: "Estados claros de carga, vacio y error", pt: "Estados claros de carregamento, vazio e erro" }),
        localize(locale, { en: "Card polish continues in later slices", es: "El polish de cards continua en slices posteriores", pt: "O polish dos cards continua em slices posteriores" })
      ]}
      listTitle={localize(locale, { en: "Index readiness", es: "Preparacion del index", pt: "Preparacao do index" })}
      subtitle={localize(locale, {
        en: "Operational states for the admin collections workspace.",
        es: "Estados operativos para el workspace admin de colecciones.",
        pt: "Estados operacionais para o workspace admin de colecoes."
      })}
      title={localize(locale, { en: "Collections", es: "Colecciones", pt: "Colecoes" })}
    >
      <AdminCollectionsMinimalList locale={locale} state={state} />
    </AdminModulePlaceholder>
  );
}
