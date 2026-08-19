"use client";

import { useKnowledgeSearch } from "../application/use-knowledge-search";
import type { ArticleType, DefinitionType } from "../domain/knowledge-schemas";
import { ArticleCard } from "./article-card";
import { DefinitionCard } from "./definition-card";
import { H1, Lead } from "../../shared/ui/ui/typography";
import { Input } from "../../shared/ui/ui/input";

type KnowledgePageClientProps = {
  initialArticles?: ArticleType[];
  initialDefinitions?: DefinitionType[];
};

export function KnowledgePageClient({
  initialArticles = [],
  initialDefinitions = []
}: KnowledgePageClientProps) {
  const {
    query,
    setQuery,
    filteredArticles,
    filteredDefinitions
  } = useKnowledgeSearch(initialArticles, initialDefinitions);

  return (
    <div className="min-h-screen bg-slate-950 py-16 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase">
            Centro de Conocimiento
          </span>
          <H1 className="mt-2 text-slate-100 font-extrabold">
            Aprende sobre Tokenización & Web3
          </H1>
          <Lead className="mt-2 text-slate-400">
            Guías, artículos educativos y glosario interactivo para dominar la inversión inmobiliaria digital.
          </Lead>

          <div className="mt-8 max-w-md mx-auto">
            <Input
              type="text"
              placeholder="Buscar artículos o conceptos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-slate-900/80 border-white/10 text-white placeholder-slate-500"
            />
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-xl font-bold text-slate-100">Artículos Educativos ({filteredArticles.length})</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article) => (
              <ArticleCard key={article.slug} article={article} />
            ))}
          </div>
        </div>

        {filteredDefinitions.length > 0 && (
          <div className="mt-16 border-t border-white/10 pt-12">
            <h2 className="text-xl font-bold text-slate-100">Glosario Web3 & Inmobiliario ({filteredDefinitions.length})</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDefinitions.map((def) => (
                <DefinitionCard key={def.term} definition={def} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
