"use client";

import { Button } from "@/components/ui/button";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  return (
    <main className="mx-auto max-w-6xl p-6 md:p-10">
      <div className="rounded-2xl border border-red-300/25 bg-red-500/10 p-6 text-red-200">
        <p className="font-semibold">Ocurrió un error inesperado al renderizar la interfaz.</p>
        <p className="mt-2 text-sm opacity-85">{error.message || "Error no especificado"}</p>
        <Button className="mt-4" onClick={reset}>
          Reintentar
        </Button>
      </div>
    </main>
  );
}
