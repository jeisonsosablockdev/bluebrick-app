import type { Metadata } from "next";

import { JsonLdScript } from "@/components/seo/json-ld-script";
import { ArticleTemplate } from "@/components/templates";
import { buildKnowledgeBreadcrumbs } from "@/lib/content/routes";
import { buildArticleSemanticContext } from "@/lib/knowledge-graph";
import { createPageMetadata } from "@/lib/seo";
import { createArticleTemplateSchemas } from "@/lib/schema";

function toTitleCaseFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const context = await buildArticleSemanticContext(slug);
  const title = context.title || toTitleCaseFromSlug(slug);

  return createPageMetadata({
    title,
    description: context.summary || `Knowledge article for ${title}.`,
    path: context.canonicalPath,
    section: "knowledge"
  });
}

export default async function KnowledgeArticlePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const context = await buildArticleSemanticContext(resolvedParams.slug);
  const title = context.title || toTitleCaseFromSlug(resolvedParams.slug);
  const breadcrumbs = buildKnowledgeBreadcrumbs({
    label: "Articles",
    href: "/knowledge/articles"
  }).concat([{ label: title, href: context.canonicalPath }]);
  const schemas = createArticleTemplateSchemas({
    title,
    summary: context.summary,
    path: context.canonicalPath,
    breadcrumbs,
    technical: true
  });

  return (
    <>
      <JsonLdScript id="jsonld-knowledge-article" schemas={schemas} />
      <ArticleTemplate
        title={title}
        summary={context.summary}
        breadcrumbs={breadcrumbs}
        toc={[
          { id: "overview", label: "Overview" },
          { id: "implementation-notes", label: "Implementation notes" }
        ]}
        relatedLinks={[...context.relatedLinks, { label: "Knowledge hub", href: "/knowledge" }]}
        previousLink={context.previousLink}
        nextLink={context.nextLink}
      >
        <section id="overview" className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Overview</h2>
          <p className="text-sm leading-7 text-muted-foreground md:text-base">
            This route uses document-type namespacing (`/knowledge/articles/[slug]`) to avoid collisions
            with glossary and FAQ namespaces.
          </p>
        </section>
        <section id="implementation-notes" className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight md:text-2xl">Implementation notes</h2>
          <p className="text-sm leading-7 text-muted-foreground md:text-base">
            Data loading remains decoupled from templates. Content contracts are resolved in the content
            layer before rendering and should feed this template with typed props.
          </p>
        </section>
      </ArticleTemplate>
    </>
  );
}
