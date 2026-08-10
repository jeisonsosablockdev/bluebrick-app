"use client";

import { motion } from "motion/react";
import { H2, Lead } from "../../shared/ui/ui/typography";

export function FeaturesSection() {
  const features = [
    {
      title: "Transacciones Instantáneas en Solana",
      description: "Operaciones de compra y venta de fracciones en milisegundos con costos de gas insignificantes."
    },
    {
      title: "Trazabilidad On-Chain 24/7",
      description: "Títulos de propiedad y contratos de arrendamiento representados transparentemente en la blockchain."
    },
    {
      title: "Distribución Automática de Rentas",
      description: "Tus dividendos por alquiler se acreditan automáticamente en tu billetera en USDC o SOL."
    },
    {
      title: "Cumplimiento Regulatorio e Identidad KYC",
      description: "Verificación de identidad integrada y notariado de acuerdos para protección legal de los inversionistas."
    }
  ];

  return (
    <section className="relative w-full py-16 md:py-24 bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
            Ventajas Tecnológicas
          </span>
          <H2 className="mt-2 text-slate-100 font-extrabold">
            ¿Por qué Elegir BRIDS?
          </H2>
          <Lead className="mt-2 text-slate-400">
            Combinamos la seguridad legal del sector inmobiliario tradicional con la liquidez y transparencia de Web3.
          </Lead>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.4 }}
              className="glass-interactive-card rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl"
            >
              <h3 className="text-base font-bold text-slate-100">{item.title}</h3>
              <p className="mt-3 text-xs leading-relaxed text-slate-400">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
