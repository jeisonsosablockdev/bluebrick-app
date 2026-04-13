import type { Metadata } from "next";

import { JsonLdScript } from "@/components/seo/json-ld-script";
import { DefinitionTemplate } from "@/components/templates";
import { createPageMetadata } from "@/lib/seo";
import { createDefinitionTemplateSchemas } from "@/lib/schema";

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
  const definition = `${term} is rendered from the glossary namespace and is isolated from article and FAQ routes by design.`;
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Knowledge", href: "/knowledge" },
    { label: "Definitions", href: "/knowledge/definitions" },
    { label: term, href: `/knowledge/definitions/${resolvedParams.slug}` }
  ];
  const schemas = createDefinitionTemplateSchemas({
    term,
    summary: "Glossary template baseline with semantic namespaced routing.",
    definition,
    path: `/knowledge/definitions/${resolvedParams.slug}`,
    breadcrumbs
  });

  return (
    <>
      <JsonLdScript id="jsonld-knowledge-definition" schemas={schemas} />
      <DefinitionTemplate
        term={term}
        summary="Glossary template baseline with semantic namespaced routing."
        definition={definition}
        relatedLinks={[
          { label: "Knowledge hub", href: "/knowledge" },
          { label: "Related article", href: "/knowledge/articles/tokenization-fundamentals" }
        ]}
      />
    </>
  );
}
