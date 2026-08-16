import { getManagedPropertiesQuery, PropertyManagementPageClient } from "@/features/property-management";
import { AdminModulePlaceholder } from "@/features/admin/presentation/admin-module-placeholder";
import { localize } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";

export default async function AdminAssetsPage() {
  const locale = await getServerLocale();
  const properties = await getManagedPropertiesQuery();

  return (
    <div className="space-y-6">
      <PropertyManagementPageClient properties={properties} />
      <AdminModulePlaceholder
        highlights={[
          localize(locale, { en: "Asset list", es: "Listado de activos", pt: "Lista de ativos" }),
          localize(locale, { en: "Filters by type/status", es: "Filtros por tipo/estado", pt: "Filtros por tipo/status" }),
          localize(locale, { en: "Operational row actions", es: "Acciones operativas por fila", pt: "Acoes operacionais por linha" })
        ]}
        listTitle={localize(locale, { en: "Initial module content", es: "Contenido inicial del modulo", pt: "Conteudo inicial do modulo" })}
        subtitle={localize(locale, {
          en: "Central administration of tokenizable assets.",
          es: "Administracion central de activos tokenizables.",
          pt: "Administracao central de ativos tokenizaveis."
        })}
        title={localize(locale, { en: "Assets", es: "Activos", pt: "Ativos" })}
      />
    </div>
  );
}
