"use client";

import Link from "next/link";
import { Button } from "../../shared/ui/ui/button";
import { H2, Lead } from "../../shared/ui/ui/typography";

export function TransparencySection() {
  return (
    <section className="relative w-full py-16 md:py-24 bg-gradient-to-b from-slate-950 via-slate-900/60 to-slate-950 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
              Prueba de Reservas & Auditoría
            </span>
            <H2 className="mt-2 text-slate-100 font-extrabold">
              Transparencia Absoluta Garantizada
            </H2>
            <Lead className="mt-4 text-slate-300 leading-relaxed">
              Cada token en BRIDS representa una participación legal en un vehículo de propósito especial (SPV) propietario del inmueble. Todas las cuentas de depósito, contratos de arrendamiento y registros de propiedad son públicos en la blockchain de Solana.
            </Lead>
            <div className="mt-8">
              <Link href="/transparencia">
                <Button variant="primary">Ver Informe de Transparencia</Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-medium text-slate-400">Verificación On-Chain</span>
              <span className="inline-flex items-center text-xs font-bold text-emerald-400">
                <span className="h-2 w-2 rounded-full bg-emerald-400 mr-2 animate-ping" />
                Solana Devnet
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-medium text-slate-400">Auditoría Notarial</span>
              <span className="text-xs font-bold text-slate-200">100% Verificado</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">Custodia de Activos</span>
              <span className="text-xs font-bold text-slate-200">Multi-Sig Notariado</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
