import type { Metadata } from "next";

import { JsonLdScript } from "@/components/seo/json-ld-script";
import { DefinitionTemplate } from "@/components/templates";
import { buildDefinitionSemanticContext } from "@/lib/knowledge-graph";
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
  const context = await buildDefinitionSemanticContext(slug);
  const term = context.term || toLabelFromSlug(slug);

  return createPageMetadata({
    title: `${term} Definition`,
    description: context.summary || `Glossary definition page for ${term}.`,
    path: context.canonicalPath,
    section: "knowledge"
  });
}

export default async function KnowledgeDefinitionPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const context = await buildDefinitionSemanticContext(resolvedParams.slug);
  const term = context.term || toLabelFromSlug(resolvedParams.slug);
  const definition = context.definition;
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Knowledge", href: "/knowledge" },
    { label: "Definitions", href: "/knowledge/definitions" },
    { label: term, href: context.canonicalPath }
  ];
  const schemas = createDefinitionTemplateSchemas({
    term,
    summary: context.summary,
    definition,
    path: context.canonicalPath,
    breadcrumbs
  });

  return (
    <>
      <JsonLdScript id="jsonld-knowledge-definition" schemas={schemas} />
      <DefinitionTemplate
        term={term}
        summary={context.summary}
        definition={definition}
        relatedLinks={[...context.relatedLinks, { label: "Knowledge hub", href: "/knowledge" }]}
      />
    </>
  );
}
