import type { Metadata } from "next";

import { DefinitionTemplate } from "@/components/templates";
import { createPageMetadata } from "@/lib/seo";

function toLabelFromSlug(slug: string): string {
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
  const term = toLabelFromSlug(slug);

  return createPageMetadata({
    title: `${term} Definition`,
    description: `Glossary definition page for ${term}.`,
    path: `/knowledge/definitions/${slug}`,
    section: "knowledge"
  });
}

export default async function KnowledgeDefinitionPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const term = toLabelFromSlug(resolvedParams.slug);

  return (
    <DefinitionTemplate
      term={term}
      summary="Glossary template baseline with semantic namespaced routing."
      definition={`${term} is rendered from the glossary namespace and is isolated from article and FAQ routes by design.`}
      relatedLinks={[
        { label: "Knowledge hub", href: "/knowledge" },
        { label: "Related article", href: "/knowledge/articles/tokenization-fundamentals" }
      ]}
    />
  );
}
