import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FooterSection() {
  return (
    <footer className="mt-10 rounded-t-3xl border border-white/10 bg-slate-900/80 px-6 py-10 md:px-10">
      <div className="grid gap-8 text-sm text-slate-300 md:grid-cols-4">
        <div>
          <h4 className="mb-2 text-base font-semibold text-white">BRIDS</h4>
          <p>Plataforma de inversión inmobiliaria tokenizada. UI demo SSR-first para Next.js App Router.</p>
          <div className="mt-4 space-y-2">
            <Input placeholder="Tu correo" aria-label="Correo" />
            <Button className="w-full">Suscribirme</Button>
          </div>
        </div>
        <div>
          <h4 className="mb-2 text-base font-semibold text-white">Producto</h4>
          <ul className="space-y-1">
            <li>Propiedades</li>
            <li>Rentabilidad</li>
            <li>Comunidad</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-2 text-base font-semibold text-white">Legal</h4>
          <ul className="space-y-1">
            <li>Términos</li>
            <li>Privacidad</li>
            <li>Riesgos</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-2 text-base font-semibold text-white">Soporte</h4>
          <ul className="space-y-1">
            <li>Centro de ayuda</li>
            <li>Contacto</li>
            <li>Estado</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
