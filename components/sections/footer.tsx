"use client";

import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function FooterSection() {
  const { t } = useI18n();

  return (
    <footer className="app-footer mt-10 rounded-t-3xl border border-white/10 bg-slate-900/80 px-6 py-10 md:px-10">
      <div className="grid gap-8 text-sm text-slate-300 md:grid-cols-4">
        <div>
          <h4 className="mb-2 text-base font-semibold text-white">BRIDS</h4>
          <p>
            {t({
              en: "Tokenized real estate investment platform. SSR-first UI demo for Next.js App Router.",
              es: "Plataforma de inversion inmobiliaria tokenizada. UI demo SSR-first para Next.js App Router.",
              pt: "Plataforma de investimento imobiliario tokenizado. UI demo SSR-first para Next.js App Router."
            })}
          </p>
          <div className="mt-4 space-y-2">
            <Input
              placeholder={t({ en: "Your email", es: "Tu correo", pt: "Seu e-mail" })}
              aria-label={t({ en: "Email", es: "Correo", pt: "E-mail" })}
            />
            <Button className="w-full">{t({ en: "Subscribe", es: "Suscribirme", pt: "Inscrever-me" })}</Button>
          </div>
        </div>
        <div>
          <h4 className="mb-2 text-base font-semibold text-white">{t({ en: "Product", es: "Producto", pt: "Produto" })}</h4>
          <ul className="space-y-1">
            <li>{t({ en: "Properties", es: "Propiedades", pt: "Imoveis" })}</li>
            <li>{t({ en: "Yield", es: "Rentabilidad", pt: "Rentabilidade" })}</li>
            <li>{t({ en: "Community", es: "Comunidad", pt: "Comunidade" })}</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-2 text-base font-semibold text-white">{t({ en: "Legal", es: "Legal", pt: "Legal" })}</h4>
          <ul className="space-y-1">
            <li>{t({ en: "Terms", es: "Terminos", pt: "Termos" })}</li>
            <li>{t({ en: "Privacy", es: "Privacidad", pt: "Privacidade" })}</li>
            <li>{t({ en: "Risks", es: "Riesgos", pt: "Riscos" })}</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-2 text-base font-semibold text-white">{t({ en: "Support", es: "Soporte", pt: "Suporte" })}</h4>
          <ul className="space-y-1">
            <li>{t({ en: "Help center", es: "Centro de ayuda", pt: "Central de ajuda" })}</li>
            <li>{t({ en: "Contact", es: "Contacto", pt: "Contato" })}</li>
            <li>{t({ en: "Status", es: "Estado", pt: "Status" })}</li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
