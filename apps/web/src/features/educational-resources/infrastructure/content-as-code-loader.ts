import { ArticleEntity } from '../domain';

export class ContentAsCodeLoader {
  async loadArticleBySlug(slug: string): Promise<ArticleEntity | null> {
    const articles = await this.loadAllArticles();
    return articles.find(a => a.slug === slug) || null;
  }

  async loadAllArticles(): Promise<ArticleEntity[]> {
    return [
      {
        slug: 'guia-inversion-inmobiliaria-tokenizada-solana',
        title: 'Guía Completa: Cómo Invertir en Bienes Raíces Tokenizados en Solana',
        description: 'Aprende los fundamentos de la tokenización inmobiliaria, smart contracts Metaplex y rentabilidades en blockchain.',
        category: 'educational',
        publishedAt: '2026-08-01',
        author: 'Equipo BRIDS Research',
        readTimeMinutes: 6,
        contentMarkdown: '# Guía Completa de Inversión...',
      },
      {
        slug: 'arquitectura-solana-kit-fdd-monorepo',
        title: 'Arquitectura FDD y Solana Kit 2.0 en BRIDS',
        description: 'Un desglose técnico sobre cómo desacoplamos la aplicación web de los smart contracts en Rust.',
        category: 'technical',
        publishedAt: '2026-08-04',
        author: 'Equipo Antigravity Architect',
        readTimeMinutes: 10,
        contentMarkdown: '# Arquitectura FDD...',
      },
    ];
  }
}
