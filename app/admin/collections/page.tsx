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
        localize(locale, { en: "Admin-only server contract", es: "Contrato server-side solo admin", pt: "Contrato server-side so admin" }),
        localize(locale, { en: "Read-only state handoff", es: "Handoff read-only de estados", pt: "Handoff read-only de estados" }),
        localize(locale, { en: "Final UI deferred to STORY-011-05", es: "UI final diferida a STORY-011-05", pt: "UI final adiada para STORY-011-05" })
      ]}
      listTitle={localize(locale, { en: "Minimal contract consumption", es: "Consumo minimo del contrato", pt: "Consumo minimo do contrato" })}
      subtitle={localize(locale, {
        en: "Minimal read-only wiring for the approved admin collections list contract.",
        es: "Wiring minimo read-only para el contrato aprobado del listado admin de colecciones.",
        pt: "Wiring minimo read-only para o contrato aprovado da lista admin de colecoes."
      })}
      title={localize(locale, { en: "Collections", es: "Colecciones", pt: "Colecoes" })}
    >
      <AdminCollectionsMinimalList locale={locale} state={state} />
    </AdminModulePlaceholder>
  );
}
