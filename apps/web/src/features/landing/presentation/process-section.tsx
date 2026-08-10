"use client";

import { motion } from "motion/react";
import { LANDING_PROCESS_STEPS } from "../domain/landing-constants";
import { H2, Lead } from "../../shared/ui/ui/typography";

export function ProcessSection() {
  return (
    <section className="relative w-full py-16 md:py-24 bg-slate-900/40 border-y border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
            Paso a Paso
          </span>
          <H2 className="mt-2 text-slate-100 font-extrabold">
            ¿Cómo Funciona Invertir en BRIDS?
          </H2>
          <Lead className="mt-2 text-slate-400">
            Tres sencillos pasos para diversificar tu portafolio en activos inmobiliarios reales.
          </Lead>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {LANDING_PROCESS_STEPS.map((step, idx) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.15, duration: 0.5 }}
              className="glass-interactive-card relative flex flex-col rounded-2xl border border-white/10 bg-slate-900/80 p-6 backdrop-blur-xl"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 text-lg font-black text-slate-950 shadow-lg shadow-emerald-500/20">
                0{step.step}
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-100">
                {step.titleEs}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-400">
                {step.descEs}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
