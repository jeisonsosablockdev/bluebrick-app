"use client";

import { useMemo, useState } from "react";
import type { ArticleType, DefinitionType } from "../domain/knowledge-schemas";

export function useKnowledgeSearch(
  articles: ArticleType[] = [],
  definitions: DefinitionType[] = []
) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      const matchesCategory = selectedCategory === "all" || art.category === selectedCategory;
      const matchesQuery =
        !query ||
        art.title.toLowerCase().includes(query.toLowerCase()) ||
        art.description.toLowerCase().includes(query.toLowerCase());
      return matchesCategory && matchesQuery;
    });
  }, [articles, query, selectedCategory]);

  const filteredDefinitions = useMemo(() => {
    return definitions.filter((def) => {
      const matchesQuery =
        !query ||
        def.term.toLowerCase().includes(query.toLowerCase()) ||
        def.definition.toLowerCase().includes(query.toLowerCase());
      return matchesQuery;
    });
  }, [definitions, query]);

  return {
    query,
    setQuery,
    selectedCategory,
    setSelectedCategory,
    filteredArticles,
    filteredDefinitions
  };
}
