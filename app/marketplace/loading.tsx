import { Card } from "@/components/ui/card";
import { DEFAULT_LOCALE, localize } from "@/lib/i18n";

export default function MarketplaceLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <section className="space-y-3">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-700/50" />
        <div className="h-10 w-full max-w-xl animate-pulse rounded bg-slate-700/50" />
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={`marketplace-loading-${index}`} className="h-72 animate-pulse bg-slate-900/70">
            <span className="sr-only">
              {localize(DEFAULT_LOCALE, {
                en: "Loading marketplace",
                es: "Cargando marketplace",
                pt: "Carregando marketplace"
              })}
            </span>
          </Card>
        ))}
      </section>
    </main>
  );
}
