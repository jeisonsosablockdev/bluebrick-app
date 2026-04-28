import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";
import { AdminCollectionsHealthWorkspace } from "@/components/admin/admin-collections-health-workspace";
import { loadAdminCollectionsHealthPageState } from "@/lib/admin/collections-health-page-state";
import { localize } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";

export default async function AdminCollectionsHealthPage() {
  const locale = await getServerLocale();
  const state = await loadAdminCollectionsHealthPageState();

  return (
    <AdminModulePlaceholder
      highlights={[
        localize(locale, { en: "Read-only queue over actor-scoped failures", es: "Cola read-only sobre fallas del actor", pt: "Fila read-only sobre falhas do ator" }),
        localize(locale, { en: "Bootstrap and consistency degradations unified", es: "Degradaciones de bootstrap y consistencia unificadas", pt: "Degradacoes de bootstrap e consistencia unificadas" }),
        localize(locale, { en: "Happy-path collections stay separate", es: "Las colecciones happy-path permanecen separadas", pt: "As colecoes happy-path permanecem separadas" })
      ]}
      listTitle={localize(locale, { en: "Health queue contract", es: "Contrato de la cola health", pt: "Contrato da fila health" })}
      subtitle={localize(locale, {
        en: "Operational read-only queue for collection rows that require review before they can safely rejoin the editable admin workspace.",
        es: "Cola operacional read-only para filas de colecciones que requieren revision antes de poder volver de forma segura al workspace editable admin.",
        pt: "Fila operacional read-only para linhas de colecoes que requerem revisao antes de voltar com seguranca ao workspace editavel admin."
      })}
      title={localize(locale, { en: "Collections health", es: "Salud de colecciones", pt: "Saude de colecoes" })}
    >
      <AdminCollectionsHealthWorkspace locale={locale} state={state} />
    </AdminModulePlaceholder>
  );
}
