import { Card } from "@/components/ui/card";
import { localize } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n-server";

export default async function MarketplaceDetailLoading() {
  const locale = await getServerLocale();

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <section className="grid gap-6 md:grid-cols-2">
        <Card className="h-80 animate-pulse bg-slate-900/70">
          <span className="sr-only">
            {localize(locale, {
              en: "Loading detail",
              es: "Cargando detalle",
              pt: "Carregando detalhe"
            })}
          </span>
        </Card>
        <Card className="h-80 animate-pulse bg-slate-900/70">
          <span className="sr-only">
            {localize(locale, {
              en: "Loading detail",
              es: "Cargando detalle",
              pt: "Carregando detalhe"
            })}
          </span>
        </Card>
      </section>
    </main>
  );
}
