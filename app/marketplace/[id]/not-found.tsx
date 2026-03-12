import Link from "next/link";

import { localize } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";

export default async function MarketplaceDetailNotFound() {
  const locale = await getServerLocale();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <div className="rounded-2xl border border-white/10 bg-panel p-6">
        <h1 className="text-2xl font-semibold text-white">
          {localize(locale, { en: "Property not found", es: "Propiedad no encontrada", pt: "Propriedade nao encontrada" })}
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          {localize(locale, {
            en: "The requested asset does not exist or is currently unavailable.",
            es: "El activo solicitado no existe o no esta disponible en este momento.",
            pt: "O ativo solicitado nao existe ou nao esta disponivel neste momento."
          })}
        </p>
        <Link href="/marketplace" className="mt-4 inline-flex text-sm font-semibold text-cyan-300 hover:underline">
          {localize(locale, {
            en: "Back to marketplace",
            es: "Volver al marketplace",
            pt: "Voltar ao marketplace"
          })}
        </Link>
      </div>
    </main>
  );
}
