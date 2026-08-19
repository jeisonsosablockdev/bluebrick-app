import { notFound } from "next/navigation";

import { AdminModulePlaceholder } from "@/features/admin/presentation/admin-module-placeholder";
import { localize } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";
import { isReleaseControlledRouteVisible } from "@/lib/release-module-visibility";

export default async function AdminSettingsPage() {
  if (!isReleaseControlledRouteVisible("/admin/settings")) {
    notFound();
  }

  const locale = await getServerLocale();

  return (
    <AdminModulePlaceholder
      highlights={[
        localize(locale, { en: "Operation parameters", es: "Parametros de operacion", pt: "Parametros de operacao" }),
        localize(locale, { en: "Module flags", es: "Flags de modulos", pt: "Flags de modulos" }),
        localize(locale, { en: "Console preferences", es: "Preferencias de consola", pt: "Preferencias do console" })
      ]}
      listTitle={localize(locale, { en: "Initial module content", es: "Contenido inicial del modulo", pt: "Conteudo inicial do modulo" })}
      subtitle={localize(locale, {
        en: "General settings for admin console.",
        es: "Configuracion general de consola admin.",
        pt: "Configuracao geral do console admin."
      })}
      title={localize(locale, { en: "Settings", es: "Configuracion", pt: "Configuracao" })}
    />
  );
}
