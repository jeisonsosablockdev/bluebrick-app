import { TemplatePageShell } from "./page-shell";
import type { TemplateLink, TemplateTocItem } from "./types";

interface ArticleTemplateProps {
  title: string;
  summary: string;
  breadcrumbs: TemplateLink[];
  toc: TemplateTocItem[];
  relatedLinks?: TemplateLink[];
  previousLink?: TemplateLink;
  nextLink?: TemplateLink;
  children: React.ReactNode;
}

export function ArticleTemplate({
  title,
  summary,
  breadcrumbs,
  toc,
  relatedLinks,
  previousLink,
  nextLink,
  children
}: ArticleTemplateProps) {
  return (
    <TemplatePageShell
      title={title}
      summary={summary}
      breadcrumbs={breadcrumbs}
      tableOfContents={toc}
      relatedLinks={relatedLinks}
      previousLink={previousLink}
      nextLink={nextLink}
    >
      <div className="space-y-6">{children}</div>
    </TemplatePageShell>
  );
}
