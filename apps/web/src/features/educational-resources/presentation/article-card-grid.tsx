'use client';

import React from 'react';
import { ArticleEntity } from '../domain';
import { Card } from '../../shared/ui';

export interface ArticleCardGridProps {
  articles: ArticleEntity[];
}

export function ArticleCardGrid({ articles }: ArticleCardGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
      {articles.map((article) => (
        <Card key={article.slug} title={article.title} className="hover:border-emerald-500/50 transition-colors">
          <p className="text-slate-400 text-sm mb-4 leading-relaxed">{article.description}</p>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800">
            <span>{article.author}</span>
            <span>{article.readTimeMinutes} min de lectura</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
