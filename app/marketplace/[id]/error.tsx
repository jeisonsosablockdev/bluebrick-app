"use client";

import { Button } from "@/components/ui/button";

type MarketplaceDetailErrorProps = {
  error: Error;
  reset: () => void;
};

export default function MarketplaceDetailError({ error, reset }: MarketplaceDetailErrorProps) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5">
        <h2 className="text-xl font-semibold text-rose-100">No se pudo cargar el detalle</h2>
        <p className="mt-2 text-sm text-rose-100/90">{error.message || "Error inesperado consultando backend."}</p>
        <Button className="mt-4 min-h-11" onClick={reset}>
          Reintentar
        </Button>
      </div>
    </main>
  );
}
