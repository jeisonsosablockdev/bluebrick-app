import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";

export default function AdminSalesPage() {
  return (
    <AdminModulePlaceholder
      highlights={["Eventos de venta", "Wallet compradora", "Volumen y conversion"]}
      subtitle="Seguimiento comercial de ventas NFT."
      title="Ventas"
    />
  );
}
