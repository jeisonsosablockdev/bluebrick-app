"use client";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";

type MarketplaceErrorProps = {
  error: Error;
  reset: () => void;
};

export default function MarketplaceError({ error, reset }: MarketplaceErrorProps) {
  const { t } = useI18n();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-5">
        <h2 className="text-xl font-semibold text-rose-100">
          {t({
            en: "Marketplace could not be loaded",
            es: "No se pudo cargar el marketplace",
            pt: "Nao foi possivel carregar o marketplace"
          })}
        </h2>
        <p className="mt-2 text-sm text-rose-100/90">
          {error.message || t({ en: "Unexpected error.", es: "Error inesperado.", pt: "Erro inesperado." })}
        </p>
        <Button className="mt-4 min-h-11" onClick={reset}>
          {t({ en: "Retry", es: "Reintentar", pt: "Tentar novamente" })}
        </Button>
      </div>
    </main>
  );
}
