import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";

export default function AdminCollectionsPage() {
  return (
    <AdminModulePlaceholder
      highlights={["Listado de colecciones", "Asociacion con activos", "Estado on-chain de coleccion"]}
      subtitle="Gestion de colecciones NFT por activo."
      title="Colecciones"
    />
  );
}
