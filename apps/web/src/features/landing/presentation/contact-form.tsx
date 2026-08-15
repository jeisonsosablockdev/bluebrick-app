"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n/locale-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { COUNTRIES } from "@/lib/countries";

export const CONTACT_FORM_SECTION_ID = "contact-form";

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
    <section
      id={CONTACT_FORM_SECTION_ID}
      className="contact-gradient-panel mt-12 mb-10 w-full scroll-mt-24 rounded-[2rem] p-8 sm:p-12 max-w-5xl mx-auto relative overflow-hidden group"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-300/0 via-white/0 to-violet-300/0 opacity-0 blur-3xl transition-all duration-700 group-hover:opacity-35 group-hover:from-cyan-300/20 group-hover:to-violet-300/20"></div>
      
      <div className="relative z-10 max-w-3xl mx-auto">
        <h2 className="mb-4 text-3xl font-extrabold text-white text-center sm:text-4xl">
          {t({ en: "Get in touch", es: "Contacta con nosotros", pt: "Entre em contato" })}
        </h2>
        <p className="mb-10 text-slate-300 text-center text-base sm:text-lg">
          {t({
            en: "Leave your details and our team will contact you to guide your platform and process questions.",
            es: "Deja tus datos y nuestro equipo te contactará para orientarte sobre la plataforma y sus procesos.",
            pt: "Deixe seus dados e nossa equipe entrará em contato para orientar sobre a plataforma e seus processos."
          })}
        </p>

        <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">{t({ en: "Name", es: "Nombre", pt: "Nome" })}</label>
              <Input
                placeholder={t({ en: "Your name", es: "Tu nombre", pt: "Seu nome" })}
                className="contact-gradient-field h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">{t({ en: "Email", es: "Correo electrónico", pt: "E-mail" })}</label>
              <Input
                type="email"
                placeholder="name@example.com"
                className="contact-gradient-field h-12 rounded-xl"
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/80">{t({ en: "Country", es: "País", pt: "País" })}</label>
              <select
                className="contact-gradient-field flex h-12 w-full rounded-xl px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
                onChange={(event) => {
                  const newCountry = event.target.value;
                  setCountry(newCountry);
                  const info = COUNTRIES.find((c) => c.code === newCountry);
                  if (info && (!phone || phone.trim() === "")) setPhone(info.dialCode + " ");
                }}
                suppressHydrationWarning
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
                  className="contact-gradient-dial flex h-12 w-[110px] rounded-l-xl px-4 py-2 text-sm focus-visible:outline-none"
                  onChange={(event) => {
                    const newCode = event.target.value;
                    const oldCodeMatch = COUNTRIES.find((c) => phone.startsWith(c.dialCode));
                    const numberPart = oldCodeMatch ? phone.slice(oldCodeMatch.dialCode.length).trim() : phone.trim();
                    setPhone(newCode + " " + numberPart);
                  }}
                  suppressHydrationWarning
                  value={selectedDialCode}
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code + c.dialCode} value={c.dialCode}>
                      {c.dialCode}
                    </option>
                  ))}
                </select>
                <Input
                  className="contact-gradient-field rounded-l-none h-12"
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
              className="contact-gradient-field flex min-h-32 w-full rounded-xl px-4 py-3 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              placeholder={t({ en: "How can we help you?", es: "¿Cómo podemos ayudarte?", pt: "Como podemos te ajudar?" })}
              suppressHydrationWarning
            />
          </div>

          <div className="flex items-center space-x-3 pt-2">
            <input 
              type="checkbox" 
              id="newsletter_contact" 
              defaultChecked 
              className="contact-gradient-checkbox h-5 w-5 rounded cursor-pointer"
              suppressHydrationWarning
            />
            <label htmlFor="newsletter_contact" className="text-sm font-medium text-slate-300 cursor-pointer select-none">
              {t({ en: "Add me to the newsletter for future updates and properties.", es: "Agregarme al newsletter para recibir actualizaciones y oportunidades.", pt: "Adicionar-me a newsletter para receber atualizações e propriedades." })}
            </label>
          </div>

          <div className="pt-4 flex justify-center">
            <Button className="contact-gradient-submit w-full sm:w-auto min-w-[220px] h-14 rounded-full font-bold px-8 transition-all text-base">
              {t({ en: "Submit details", es: "Enviar datos", pt: "Enviar dados" })}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
