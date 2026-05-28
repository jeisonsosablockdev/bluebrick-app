"use client";

import { motion } from "motion/react";

import { Card } from "@/components/ui/card";
import { DEFAULT_LOCALE, localize } from "@/lib/i18n";

function LoadingRail() {
  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{localize(DEFAULT_LOCALE, { en: "Preparing marketplace", es: "Preparando marketplace", pt: "Preparando marketplace" })}</span>
        <span>{localize(DEFAULT_LOCALE, { en: "Almost ready", es: "Casi listo", pt: "Quase pronto" })}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-300 to-fuchsia-300"
          initial={{ width: "20%" }}
          animate={{ width: ["34%", "72%", "94%"] }}
          transition={{ duration: 1.8, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}

function LoadingCard({ delay }: { delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className="space-y-4 overflow-hidden bg-slate-900/70 p-0">
        <div className="h-44 animate-pulse bg-slate-700/50" />
        <div className="space-y-3 p-4">
          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-700/50" />
          <div className="h-3 w-full animate-pulse rounded bg-slate-700/50" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-slate-700/50" />
          <div className="h-11 w-full animate-pulse rounded-full bg-slate-700/50" />
        </div>
      </Card>
    </motion.div>
  );
}

export default function MarketplaceLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
      <section className="space-y-3">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-700/50" />
        <div className="h-10 w-full max-w-xl animate-pulse rounded bg-slate-700/50" />
        <LoadingRail />
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <LoadingCard key={`marketplace-loading-${index}`} delay={0.06 * index} />
        ))}
      </section>
    </main>
  );
}
