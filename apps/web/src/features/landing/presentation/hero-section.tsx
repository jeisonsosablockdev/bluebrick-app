"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";

import { useLandingStats } from "../application/use-landing-stats";
import { Button } from "../../shared/ui/ui/button";
import { H1, Lead } from "../../shared/ui/ui/typography";

type HeroSectionProps = {
  marketplaceTotal?: number;
};

export function HeroSection({ marketplaceTotal = 0 }: HeroSectionProps) {
  const { stats } = useLandingStats(marketplaceTotal, true);

  return (
    <section className="text-slate-100 relative w-full overflow-hidden -mt-[88px] pt-[140px] md:pt-[180px] lg:pt-[220px] pb-12 md:pb-20">
      <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center hero-bg-wrapper">
        <Image
          src="/images/BRD-NY-04.png"
          alt="Hero Background"
          fill
          sizes="100vw"
          priority
          className="hero-bg-dark object-cover object-right-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/80 to-slate-950" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-7 flex flex-col items-start text-left"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 backdrop-blur-md mb-6">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Tokenización Inmobiliaria en Solana Devnet
            </div>

            <H1 className="text-slate-100 font-black tracking-tight">
              Invierte en Fracciones de{" "}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Bienes Raíces
              </span>{" "}
              en Blockchain
            </H1>

            <Lead className="mt-6 text-slate-300 max-w-2xl text-base md:text-lg leading-relaxed">
              BRIDS democratiza el acceso a inversiones inmobiliarias de alto rendimiento. Compra fracciones digitales tokenizadas con trazabilidad 24/7 y rentas distribuidas en tu billetera.
            </Lead>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href="/marketplace">
                <Button variant="primary" className="min-w-[180px] shadow-lg shadow-emerald-500/20">
                  Explorar Propiedades
                </Button>
              </Link>
              <Link href="/knowledge">
                <Button variant="outline" className="min-w-[160px]">
                  Aprender Más
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="lg:col-span-5 grid grid-cols-2 gap-4"
          >
            {stats.map((stat) => (
              <div
                key={stat.id}
                className="glass-interactive-card flex flex-col rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl transition-all hover:border-emerald-500/30"
              >
                <span className="text-2xl font-black text-white md:text-3xl bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  {stat.value}
                </span>
                <span className="mt-2 text-xs font-medium text-slate-400 leading-snug">
                  {stat.label}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
