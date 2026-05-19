import { Card } from "@/components/ui/card";
import { DEFAULT_LOCALE, localize } from "@/lib/i18n";

export default function MarketplaceDetailLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <section className="grid gap-6 md:grid-cols-2">
        <Card className="h-80 animate-pulse bg-slate-900/70">
          <span className="sr-only">
            {localize(DEFAULT_LOCALE, {
              en: "Loading detail",
              es: "Cargando detalle",
              pt: "Carregando detalhe"
            })}
          </span>
        </Card>
        <Card className="h-80 animate-pulse bg-slate-900/70">
          <span className="sr-only">
            {localize(DEFAULT_LOCALE, {
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
