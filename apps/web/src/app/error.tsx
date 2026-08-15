"use client";

import { useEffect } from "react";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  const { t } = useI18n();

  useEffect(() => {
    const payload = {
      eventType: "client_error",
      path: typeof window !== "undefined" ? window.location.pathname : "/",
      message: error.message,
      occurredAt: new Date().toISOString(),
      viewportWidth: typeof window !== "undefined" ? window.innerWidth : undefined,
      viewportHeight: typeof window !== "undefined" ? window.innerHeight : undefined
    };

    void fetch("/api/analytics/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
      cache: "no-store"
    });
  }, [error.message]);

  return (
    <main className="mx-auto max-w-6xl p-6 md:p-10">
      <div className="rounded-2xl border border-red-300/25 bg-red-500/10 p-6 text-red-200">
        <p className="font-semibold">
          {t({
            en: "An unexpected error occurred while rendering the interface.",
            es: "Ocurrio un error inesperado al renderizar la interfaz.",
            pt: "Ocorreu um erro inesperado ao renderizar a interface."
          })}
        </p>
        <p className="mt-2 text-sm opacity-85">
          {error.message || t({ en: "Unspecified error", es: "Error no especificado", pt: "Erro nao especificado" })}
        </p>
        <Button className="mt-4" onClick={reset}>
          {t({ en: "Retry", es: "Reintentar", pt: "Tentar novamente" })}
        </Button>
      </div>
    </main>
  );
}
