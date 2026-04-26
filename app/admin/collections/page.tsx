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
        localize(locale, { en: "Collection cards with visual status", es: "Cards de colecciones con estado visual", pt: "Cards de colecoes com estado visual" }),
        localize(locale, { en: "Detail navigation continues in later slices", es: "La navegacion de detalle continua en slices posteriores", pt: "A navegacao de detalhe continua em slices posteriores" })
      ]}
      listTitle={localize(locale, { en: "Index readiness", es: "Preparacion del index", pt: "Preparacao do index" })}
      subtitle={localize(locale, {
        en: "Visual admin index for owned collections using the approved read-model contract.",
        es: "Index visual admin para colecciones propias usando el contrato aprobado del read-model.",
        pt: "Index visual admin para colecoes proprias usando o contrato aprovado do read-model."
      })}
      title={localize(locale, { en: "Collections", es: "Colecciones", pt: "Colecoes" })}
    >
      <AdminCollectionsMinimalList locale={locale} state={state} />
    </AdminModulePlaceholder>
  );
}
