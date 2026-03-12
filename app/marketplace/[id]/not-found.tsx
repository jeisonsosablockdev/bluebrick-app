import Link from "next/link";

export default function MarketplaceDetailNotFound() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <div className="rounded-2xl border border-white/10 bg-panel p-6">
        <h1 className="text-2xl font-semibold text-white">Propiedad no encontrada</h1>
        <p className="mt-2 text-sm text-slate-300">El activo solicitado no existe o no esta disponible en este momento.</p>
        <Link href="/marketplace" className="mt-4 inline-flex text-sm font-semibold text-cyan-300 hover:underline">
          Volver al marketplace
        </Link>
      </div>
    </main>
  );
}
