"use client";

import { motion } from "motion/react";

export function BrandMotionLogo() {
  return (
    <div className="relative flex flex-col items-center justify-center space-y-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 p-0.5 shadow-2xl shadow-emerald-500/20"
      >
        <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-slate-950">
          <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-3xl font-black tracking-wider text-transparent">
            B
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="flex flex-col items-center text-center"
      >
        <h1 className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
          BRIDS
        </h1>
        <p className="mt-1 text-xs font-medium tracking-widest text-emerald-400 uppercase">
          Real Estate Tokenization
        </p>
      </motion.div>
    </div>
  );
}
