import { AdminModulePlaceholder } from "@/features/admin/presentation/admin-module-placeholder";
import { AdminCollectionsHealthWorkspace } from "@/features/admin/presentation/admin-collections-health-workspace";
import { loadAdminCollectionsHealthPageState } from "@/lib/admin/collections-health-page-state";
import { localize } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";

export default async function AdminCollectionsHealthPage() {
  const locale = await getServerLocale();
  const state = await loadAdminCollectionsHealthPageState();

  return (
    <AdminModulePlaceholder
      highlights={[
        localize(locale, { en: "Actor-scoped review queue", es: "Cola de revision acotada al actor", pt: "Fila de revisao limitada ao ator" }),
        localize(locale, { en: "Bootstrap and consistency checks", es: "Checks de bootstrap y consistencia", pt: "Checks de bootstrap e consistencia" }),
        localize(locale, { en: "Ready projects stay in collections", es: "Los proyectos listos siguen en colecciones", pt: "Projetos prontos ficam em colecoes" })
      ]}
      listTitle={localize(locale, { en: "Review queue", es: "Cola de revision", pt: "Fila de revisao" })}
      subtitle={localize(locale, {
        en: "Collections that need operator review before returning to the editable admin workspace.",
        es: "Colecciones que necesitan revision operativa antes de volver al workspace editable admin.",
        pt: "Colecoes que precisam de revisao operacional antes de voltar ao workspace editavel admin."
      })}
      title={localize(locale, { en: "Collections health", es: "Salud de colecciones", pt: "Saude de colecoes" })}
    >
      <AdminCollectionsHealthWorkspace locale={locale} state={state} />
    </AdminModulePlaceholder>
  );
}
