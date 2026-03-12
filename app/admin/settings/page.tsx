import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";

export default function AdminSettingsPage() {
  return (
    <AdminModulePlaceholder
      highlights={["Parametros de operacion", "Flags de modulos", "Preferencias de consola"]}
      subtitle="Configuracion general de consola admin."
      title="Configuracion"
    />
  );
}
