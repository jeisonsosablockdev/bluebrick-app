export interface ArticleMetadata {
  slug: string;
  title: string;
  description: string;
  category: 'educational' | 'technical' | 'regulatory' | 'platform';
  publishedAt: string;
  author: string;
  readTimeMinutes: number;
}

export interface ArticleEntity extends ArticleMetadata {
  contentMarkdown: string;
  jsonLdSchema?: Record<string, unknown>;
}
