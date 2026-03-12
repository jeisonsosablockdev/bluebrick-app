import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";

export default function AdminAssetsPage() {
  return (
    <AdminModulePlaceholder
      highlights={["Listado de activos", "Filtros por tipo/estado", "Acciones operativas por fila"]}
      subtitle="Administracion central de activos tokenizables."
      title="Activos"
    />
  );
}
