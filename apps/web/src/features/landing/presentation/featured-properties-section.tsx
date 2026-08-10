"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "../../shared/ui/ui/button";
import { H2, Lead } from "../../shared/ui/ui/typography";

export function FeaturedPropertiesSection() {
  return (
    <section className="relative w-full py-16 md:py-24 bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
              Oportunidades Destacadas
            </span>
            <H2 className="mt-2 text-slate-100 font-extrabold">
              Propiedades Tokenizadas en BRIDS
            </H2>
            <Lead className="mt-2 text-slate-400 max-w-xl">
              Explora los activos con mayor rendimiento y respaldo legal verificable en la blockchain.
            </Lead>
          </div>
          <Link href="/marketplace">
            <Button variant="outline">Ver Todo el Marketplace</Button>
          </Link>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              id: "brd-ny-01",
              title: "Manhattan Prime Residential",
              location: "New York, USA",
              apy: "8.5%",
              fractionPrice: "$200",
              funded: "84%"
            },
            {
              id: "brd-ny-02",
              title: "Brooklyn Commercial Center",
              location: "Brooklyn, NY",
              apy: "9.2%",
              fractionPrice: "$150",
              funded: "92%"
            },
            {
              id: "brd-ny-03",
              title: "Miami Beach Luxury Suites",
              location: "Miami, FL",
              apy: "10.1%",
              fractionPrice: "$300",
              funded: "68%"
            }
          ].map((property, idx) => (
            <motion.div
              key={property.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="glass-interactive-card group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 transition-all hover:border-emerald-500/40"
            >
              <div className="relative h-48 w-full bg-slate-800 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
                <div className="absolute top-3 left-3 z-20 rounded-full border border-emerald-500/30 bg-slate-950/80 px-3 py-1 text-xs font-bold text-emerald-400 backdrop-blur-md">
                  APY {property.apy}
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                  {property.title}
                </h3>
                <p className="mt-1 text-xs text-slate-400">{property.location}</p>

                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs">
                  <div>
                    <span className="block text-slate-500">Fracción desde</span>
                    <span className="font-bold text-slate-200">{property.fractionPrice}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-slate-500">Fondo Recaudado</span>
                    <span className="font-bold text-emerald-400">{property.funded}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
