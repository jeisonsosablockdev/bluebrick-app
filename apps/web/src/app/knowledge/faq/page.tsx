import type { Metadata } from "next";

import { JsonLdScript } from "@/components/seo/json-ld-script";
import { FaqTemplate } from "@/components/templates";
import { createPageMetadata } from "@/lib/seo";
import { createFaqTemplateSchemas } from "@/lib/schema";

export const metadata: Metadata = createPageMetadata({
  title: "Knowledge FAQ",
  description: "Frequently asked questions for the BRIDS knowledge layer.",
  path: "/knowledge/faq",
  section: "knowledge"
});

export default function KnowledgeFaqPage() {
  const entries = [
    {
      question: "Why is FAQ under /knowledge/faq?",
      answer:
        "The namespace separates FAQ semantics from article and definition routes, preventing path collisions and improving crawl consistency."
    },
    {
      question: "Can FAQ entries become standalone pages later?",
      answer:
        "Yes. The current route architecture supports evolving into /knowledge/faq/[slug] without breaking existing hierarchy."
    }
  ];
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Knowledge", href: "/knowledge" },
    { label: "FAQ", href: "/knowledge/faq" }
  ];
  const schemas = createFaqTemplateSchemas({
    title: "FAQ",
    summary: "Frequently asked questions in a dedicated namespace to preserve route clarity.",
    path: "/knowledge/faq",
    entries,
    breadcrumbs
  });

  return (
    <>
      <JsonLdScript id="jsonld-knowledge-faq" schemas={schemas} />
      <FaqTemplate
        title="FAQ"
        summary="Frequently asked questions in a dedicated namespace to preserve route clarity."
        entries={entries}
      />
    </>
  );
}
