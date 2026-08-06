'use client';

import React from 'react';
import { motion } from 'motion/react';
import { LandingHeroData } from '../domain';
import { Button } from '../../shared/ui';

export interface HeroSectionProps {
  hero: LandingHeroData;
}

export function HeroSection({ hero }: HeroSectionProps) {
  return (
    <section className="relative py-20 px-6 text-center overflow-hidden">
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-block px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider"
        >
          {hero.badge}
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl sm:text-6xl font-extrabold text-slate-100 tracking-tight leading-tight"
        >
          {hero.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed"
        >
          {hero.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-4 pt-4"
        >
          <Button variant="primary">{hero.ctaPrimaryText}</Button>
          <Button variant="outline">{hero.ctaSecondaryText}</Button>
        </motion.div>
      </div>
    </section>
  );
}
