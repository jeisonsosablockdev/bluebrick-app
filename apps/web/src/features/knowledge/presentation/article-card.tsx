"use client";

import Link from "next/link";
import { motion } from "motion/react";
import type { ArticleType } from "../domain/knowledge-schemas";

type ArticleCardProps = {
  article: ArticleType;
};

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="glass-interactive-card group flex flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-xl transition-all hover:border-emerald-500/40"
    >
      <div>
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 capitalize">
            {article.category}
          </span>
          <span className="text-xs text-slate-500">{article.readTimeMinutes} min lectura</span>
        </div>

        <h3 className="mt-4 text-lg font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
          {article.title}
        </h3>

        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          {article.description}
        </p>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4 text-xs text-slate-500">
        <span>Por {article.author}</span>
        <Link
          href={`/knowledge/articles/${article.slug}`}
          className="font-bold text-emerald-400 hover:underline"
        >
          Leer Artículo →
        </Link>
      </div>
    </motion.div>
  );
}
