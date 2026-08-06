'use client';

import React from 'react';
import { motion } from 'motion/react';

export function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-emerald-400 font-bold text-2xl pointer-events-none"
    >
      BRIDS Real Estate
    </motion.div>
  );
}
