import { Card } from "@/components/ui/card";
import { H2, Lead } from "@/components/ui/typography";

export function UiStatesSection() {
  return (
    <section className="py-12">
      <div className="mb-7 text-center">
        <H2 className="text-white">Estados de UI</H2>
        <Lead className="mx-auto mt-2 max-w-xl">Visuales listos para integrar con datos reales más adelante.</Lead>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="mb-3 text-sm font-semibold text-cyan-300">Loading</p>
          <div className="space-y-2">
            <div className="h-4 animate-pulse rounded bg-white/10" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
            <div className="h-20 animate-pulse rounded bg-white/10" />
          </div>
        </Card>

        <Card>
          <p className="mb-3 text-sm font-semibold text-cyan-300">Empty</p>
          <div className="rounded-xl border border-dashed border-white/20 p-4 text-sm text-slate-300">
            No hay elementos disponibles para mostrar en este momento.
          </div>
        </Card>

        <Card>
          <p className="mb-3 text-sm font-semibold text-cyan-300">Error</p>
          <div className="rounded-xl border border-red-300/35 bg-red-500/10 p-4 text-sm text-red-200">
            Ocurrió un error al cargar datos. Inténtalo de nuevo más tarde.
          </div>
        </Card>
      </div>
    </section>
  );
}
