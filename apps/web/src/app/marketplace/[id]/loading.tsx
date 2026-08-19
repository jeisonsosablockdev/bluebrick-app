"use client";

import { motion } from "motion/react";

import { Card } from "@/components/ui/card";
import { DEFAULT_LOCALE, localize } from "@/lib/i18n";

function LoadingRail() {
  return (
    <div className="mb-4 space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{localize(DEFAULT_LOCALE, { en: "Opening property", es: "Abriendo propiedad", pt: "Abrindo propriedade" })}</span>
        <span>{localize(DEFAULT_LOCALE, { en: "Almost there", es: "Ya casi", pt: "Quase la" })}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-300"
          initial={{ width: "24%" }}
          animate={{ width: ["40%", "76%", "96%"] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

export default function MarketplaceDetailLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <LoadingRail />
      <section className="grid gap-6 md:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, delay: 0.05 }}>
          <Card className="h-80 overflow-hidden bg-slate-900/70 p-0">
            <div className="h-full animate-pulse bg-slate-700/50" />
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, delay: 0.12 }}>
          <Card className="space-y-4 bg-slate-900/70">
            <div className="h-5 w-24 animate-pulse rounded bg-slate-700/50" />
            <div className="h-10 w-11/12 animate-pulse rounded bg-slate-700/50" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-700/50" />
            <div className="h-4 w-5/6 animate-pulse rounded bg-slate-700/50" />
            <div className="h-11 w-44 animate-pulse rounded-full bg-slate-700/50" />
          </Card>
        </motion.div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <motion.div
            key={`detail-loading-${index}`}
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.24, delay: 0.18 + index * 0.05 }}
          >
            <Card className="space-y-3 bg-slate-900/70">
              <div className="h-5 w-2/5 animate-pulse rounded bg-slate-700/50" />
              <div className="h-4 w-full animate-pulse rounded bg-slate-700/50" />
              <div className="h-4 w-11/12 animate-pulse rounded bg-slate-700/50" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-slate-700/50" />
            </Card>
          </motion.div>
        ))}
      </section>
    </main>
  );
}
