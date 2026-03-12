import { AdminModulePlaceholder } from "@/components/admin/admin-module-placeholder";
import { localize } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";

export default async function AdminCollectionsPage() {
  const locale = await getServerLocale();

  return (
    <AdminModulePlaceholder
      highlights={[
        localize(locale, { en: "Collections list", es: "Listado de colecciones", pt: "Lista de colecoes" }),
        localize(locale, { en: "Association with assets", es: "Asociacion con activos", pt: "Associacao com ativos" }),
        localize(locale, { en: "On-chain collection status", es: "Estado on-chain de coleccion", pt: "Status on-chain da colecao" })
      ]}
      listTitle={localize(locale, { en: "Initial module content", es: "Contenido inicial del modulo", pt: "Conteudo inicial do modulo" })}
      subtitle={localize(locale, {
        en: "NFT collection management per asset.",
        es: "Gestion de colecciones NFT por activo.",
        pt: "Gestao de colecoes NFT por ativo."
      })}
      title={localize(locale, { en: "Collections", es: "Colecciones", pt: "Colecoes" })}
    />
  );
}
