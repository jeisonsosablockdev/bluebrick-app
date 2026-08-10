"use client";

import { motion } from "motion/react";
import type { DefinitionType } from "../domain/knowledge-schemas";

type DefinitionCardProps = {
  definition: DefinitionType;
};

export function DefinitionCard({ definition }: DefinitionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="glass-interactive-card rounded-2xl border border-white/10 bg-slate-900/60 p-5 backdrop-blur-xl"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-base font-bold text-slate-100">{definition.term}</h4>
        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-slate-400 uppercase">
          {definition.category}
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-300">
        {definition.definition}
      </p>
    </motion.div>
  );
}
