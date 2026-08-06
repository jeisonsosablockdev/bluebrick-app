'use client';

import React from 'react';
import { ArticleEntity } from '../domain';
import { ArticleCardGrid } from './article-card-grid';

export interface ResourcePageTemplateProps {
  articles: ArticleEntity[];
}

export function ResourcePageTemplate({ articles }: ResourcePageTemplateProps) {
  return (
    <section className="max-w-5xl mx-auto py-12 px-6">
      <div className="space-y-4 text-center md:text-left">
        <h1 className="text-3xl font-extrabold text-slate-100">Recursos Educativos & Conocimiento Web3</h1>
        <p className="text-slate-400 max-w-2xl">
          Explora artículos, guías de inversión inmobiliaria, análisis técnico de contratos inteligentes y documentación AI Discovery.
        </p>
      </div>

      <ArticleCardGrid articles={articles} />
    </section>
  );
}
