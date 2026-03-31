"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COUNTRIES } from "@/lib/countries";

export function ContactFormSection() {
  const { t } = useI18n();
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");

  const selectedDialCode = (() => {
    const match = COUNTRIES.find((c) => phone.startsWith(c.dialCode));
    return match ? match.dialCode : "+1";
  })();

  const phoneNumberOnly = (() => {
    const match = COUNTRIES.find((c) => phone.startsWith(c.dialCode));
    return match ? phone.slice(match.dialCode.length).trim() : phone;
  })();

  return (
    <section className="mt-12 mb-10 w-full rounded-3xl border border-white/5 bg-slate-900/40 p-8 sm:p-12 glass-surface transition hover:bg-slate-900/60 max-w-5xl mx-auto shadow-2xl relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/0 via-fuchsia-500/0 to-blue-500/0 opacity-0 blur-3xl transition-all duration-700 group-hover:opacity-20 group-hover:from-cyan-500/10 group-hover:to-blue-500/10"></div>
      
      <div className="relative z-10 max-w-3xl mx-auto">
        <h2 className="mb-4 text-3xl font-extrabold text-white text-center">
          {t({ en: "Get in touch", es: "Contacta con nosotros", pt: "Entre em contato" })}
        </h2>
        <p className="mb-10 text-slate-300 text-center">
          {t({
            en: "Leave your details below and an advisor will contact you shortly to review our models and the investment process.",
            es: "Deja tus datos a continuación y un asesor se pondrá en contacto contigo en breve para revisar nuestros modelos y el proceso de inversión.",
            pt: "Deixe seus dados abaixo e um consultor entrará em contato em breve para revisar nossos modelos e o processo de investimento."
          })}
        </p>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">{t({ en: "Name", es: "Nombre", pt: "Nome" })}</label>
              <Input
                placeholder={t({ en: "Your name", es: "Tu nombre", pt: "Seu nome" })}
                className="bg-black/40 border-white/10 text-white h-12 focus-visible:ring-cyan-500/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">{t({ en: "Email", es: "Correo electrónico", pt: "E-mail" })}</label>
              <Input
                type="email"
                placeholder="name@example.com"
                className="bg-black/40 border-white/10 text-white h-12 focus-visible:ring-cyan-500/50"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">{t({ en: "Country", es: "País", pt: "País" })}</label>
              <select
                className="flex h-12 w-full rounded-md border border-white/10 bg-black/40 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                onChange={(event) => {
                  const newCountry = event.target.value;
                  setCountry(newCountry);
                  const info = COUNTRIES.find((c) => c.code === newCountry);
                  if (info && (!phone || phone.trim() === "")) setPhone(info.dialCode + " ");
                }}
                value={country}
              >
                <option value="">{t({ en: "Select", es: "Seleccionar", pt: "Selecionar" })}</option>
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {t({ en: c.nameEn, es: c.nameEs, pt: c.namePt })}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">{t({ en: "Phone", es: "Teléfono", pt: "Telefone" })}</label>
              <div className="flex w-full items-center">
                <select
                  className="flex h-12 w-[110px] rounded-l-md border border-r-0 border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/50"
                  onChange={(event) => {
                    const newCode = event.target.value;
                    const oldCodeMatch = COUNTRIES.find((c) => phone.startsWith(c.dialCode));
                    const numberPart = oldCodeMatch ? phone.slice(oldCodeMatch.dialCode.length).trim() : phone.trim();
                    setPhone(newCode + " " + numberPart);
                  }}
                  value={selectedDialCode}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code + c.dialCode} value={c.dialCode}>
                      {c.dialCode}
                    </option>
                  ))}
                </select>
                <Input
                  className="rounded-l-none bg-black/40 border-l-white/5 border-white/10 text-white h-12 focus-visible:ring-cyan-500/50"
                  placeholder="000-0000"
                  onChange={(event) => {
                    setPhone(selectedDialCode + " " + event.target.value);
                  }}
                  value={phoneNumberOnly}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">{t({ en: "Message", es: "Mensaje", pt: "Mensagem" })}</label>
            <textarea
              className="flex min-h-28 w-full rounded-md border border-white/10 bg-black/40 px-3 py-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={t({ en: "How can we help you?", es: "¿Cómo podemos ayudarte?", pt: "Como podemos te ajudar?" })}
            />
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <input 
              type="checkbox" 
              id="newsletter_contact" 
              defaultChecked 
              className="h-5 w-5 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500 bg-black/40 cursor-pointer" 
            />
            <label htmlFor="newsletter_contact" className="text-sm font-medium text-slate-300 cursor-pointer select-none">
              {t({ en: "Add me to the newsletter for future updates and properties.", es: "Agregarme al newsletter para recibir actualizaciones y oportunidades.", pt: "Adicionar-me a newsletter para receber atualizações e propriedades." })}
            </label>
          </div>

          <div className="pt-4 flex justify-center">
            <Button className="w-full sm:w-auto min-w-[200px] h-14 rounded-full bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-8 transition-colors shadow-lg shadow-cyan-500/20 text-base">
              {t({ en: "Submit details", es: "Enviar datos", pt: "Enviar dados" })}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
