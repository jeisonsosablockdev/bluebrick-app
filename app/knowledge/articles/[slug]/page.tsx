import { ArticleTemplate } from "@/components/templates";
import { buildKnowledgeBreadcrumbs } from "@/lib/content/routes";

function toTitleCaseFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export default async function KnowledgeArticlePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const title = toTitleCaseFromSlug(slug);

  return (
    <ArticleTemplate
      title={title}
      summary="Article template baseline with namespaced route architecture and contextual navigation placeholders."
      breadcrumbs={buildKnowledgeBreadcrumbs({
        label: "Articles",
        href: "/knowledge/articles"
      }).concat([{ label: title, href: `/knowledge/articles/${slug}` }])}
      toc={[
        { id: "overview", label: "Overview" },
        { id: "implementation-notes", label: "Implementation notes" }
      ]}
      relatedLinks={[
        { label: "Knowledge hub", href: "/knowledge" },
        { label: "FAQ", href: "/knowledge/faq" }
      ]}
      previousLink={{ label: "Previous article", href: "/knowledge/articles/previous-article" }}
      nextLink={{ label: "Next article", href: "/knowledge/articles/next-article" }}
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
  );
}
