import { ContentAsCodeLoader } from '../infrastructure';
import { ArticleEntity } from '../domain';

export async function getAllResourcesQuery(): Promise<ArticleEntity[]> {
  const loader = new ContentAsCodeLoader();
  return loader.loadAllArticles();
}

export async function getResourceBySlugQuery(slug: string): Promise<ArticleEntity | null> {
  const loader = new ContentAsCodeLoader();
  return loader.loadArticleBySlug(slug);
}
