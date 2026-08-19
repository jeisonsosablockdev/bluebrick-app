"use client";

import Link from "next/link";
import { ThemeToggle } from "../../shared/ui/theme/theme-toggle";

export function FooterSection() {
  return (
    <footer className="relative w-full border-t border-white/10 bg-slate-950 py-12 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="text-xl font-black text-slate-100 tracking-tight">BRIDS</span>
            <p className="mt-2 text-xs text-slate-400 leading-relaxed">
              Plataforma de tokenización y fraccionamiento inmobiliario en la red de Solana.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Plataforma</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li><Link href="/marketplace" className="hover:text-emerald-400 transition-colors">Marketplace</Link></li>
              <li><Link href="/knowledge" className="hover:text-emerald-400 transition-colors">Conocimiento</Link></li>
              <li><Link href="/transparencia" className="hover:text-emerald-400 transition-colors">Transparencia</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Legal</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li><Link href="/regulatory" className="hover:text-emerald-400 transition-colors">Regulación y KYC</Link></li>
              <li><Link href="/terms" className="hover:text-emerald-400 transition-colors">Términos del Servicio</Link></li>
              <li><Link href="/privacy" className="hover:text-emerald-400 transition-colors">Política de Privacidad</Link></li>
            </ul>
          </div>

          <div className="flex flex-col items-start space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Preferencia Visual</h4>
            <ThemeToggle />
          </div>
        </div>

        <div className="mt-12 border-t border-white/5 pt-6 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} BRIDS Real Estate. Todos los derechos reservados. Red Solana Devnet.
        </div>
      </div>
    </footer>
  );
}
