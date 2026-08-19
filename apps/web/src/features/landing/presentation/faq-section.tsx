"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { H2, Lead } from "../../shared/ui/ui/typography";

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "¿Qué es una fracción inmobiliaria tokenizada?",
      a: "Es la representación digital y legal de una participación dentro de una propiedad real en la blockchain de Solana. Cada fracción concede derechos sobre los rendimientos generados por el alquiler del inmueble."
    },
    {
      q: "¿Cómo recibo los pagos de alquiler?",
      a: "Los ingresos netos por alquiler se distribuyen mensualmente de forma automática a través de contratos inteligentes en tu billetera conectada en USDC o SOL."
    },
    {
      q: "¿Puedo vender mis fracciones cuando lo necesite?",
      a: "Sí, puedes publicar tus fracciones en nuestro Marketplace secundario 24/7 sin intermediarios ni trámites burocráticos tradicionales."
    },
    {
      q: "¿Qué respaldo legal tienen mis fracciones?",
      a: "Cada propiedad pertenece a un Vehículo de Propósito Especial (SPV) legalmente constituido. Tus tokens están vinculados notarialmente a las acciones del SPV."
    }
  ];

  return (
    <section className="relative w-full py-16 md:py-24 bg-slate-950">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
            Preguntas Frecuentes
          </span>
          <H2 className="mt-2 text-slate-100 font-extrabold">
            Resuelve tus Dudas sobre BRIDS
          </H2>
          <Lead className="mt-2 text-slate-400">
            Todo lo que necesitas saber antes de realizar tu primera inversión inmobiliaria.
          </Lead>
        </div>

        <div className="mt-12 space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.q}
                className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between p-5 text-left font-bold text-slate-100 transition-colors hover:text-emerald-400"
                >
                  <span>{faq.q}</span>
                  <span className="ml-4 text-emerald-400 font-mono text-lg">
                    {isOpen ? "−" : "+"}
                  </span>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="px-5 pb-5 text-xs leading-relaxed text-slate-300 border-t border-white/5 pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
