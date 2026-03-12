import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";
import { localize } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";

export default async function AdminSalesPage() {
  const locale = await getServerLocale();

  return (
    <AdminModulePlaceholder
      highlights={[
        localize(locale, { en: "Sales events", es: "Eventos de venta", pt: "Eventos de venda" }),
        localize(locale, { en: "Buyer wallet", es: "Wallet compradora", pt: "Wallet compradora" }),
        localize(locale, { en: "Volume and conversion", es: "Volumen y conversion", pt: "Volume e conversao" })
      ]}
      listTitle={localize(locale, { en: "Initial module content", es: "Contenido inicial del modulo", pt: "Conteudo inicial do modulo" })}
      subtitle={localize(locale, {
        en: "Commercial tracking for NFT sales.",
        es: "Seguimiento comercial de ventas NFT.",
        pt: "Acompanhamento comercial de vendas NFT."
      })}
      title={localize(locale, { en: "Sales", es: "Ventas", pt: "Vendas" })}
    />
  );
}
