"use client";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";

type MarketplaceDetailErrorProps = {
  error: Error;
  reset: () => void;
};

export default function MarketplaceDetailError({ error, reset }: MarketplaceDetailErrorProps) {
  const { t } = useI18n();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5">
        <h2 className="text-xl font-semibold text-rose-100">
          {t({
            en: "Property details could not be loaded",
            es: "No se pudo cargar el detalle",
            pt: "Nao foi possivel carregar os detalhes"
          })}
        </h2>
        <p className="mt-2 text-sm text-rose-100/90">
          {error.message
            || t({
              en: "Unexpected backend error.",
              es: "Error inesperado consultando backend.",
              pt: "Erro inesperado ao consultar backend."
            })}
        </p>
        <Button className="mt-4 min-h-11" onClick={reset}>
          {t({ en: "Retry", es: "Reintentar", pt: "Tentar novamente" })}
        </Button>
      </div>
    </main>
  );
}
