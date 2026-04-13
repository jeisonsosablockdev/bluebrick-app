import type { Metadata } from "next";

import { JsonLdScript } from "@/components/seo/json-ld-script";
import { KnowledgeHubTemplate } from "@/components/templates";
import { createPageMetadata } from "@/lib/seo";
import { createKnowledgeHubTemplateSchemas } from "@/lib/schema";

export const metadata: Metadata = createPageMetadata({
  title: "Knowledge",
  description: "Canonical knowledge hub with namespaced routes for articles, FAQ, and definitions.",
  path: "/knowledge",
  section: "knowledge"
});

export default function KnowledgeLayerPage() {
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Knowledge", href: "/knowledge" }
  ];
  const schemas = createKnowledgeHubTemplateSchemas({
    title: "Knowledge",
    summary: "Canonical knowledge hub with namespaced routes for articles, FAQ, and definitions.",
    path: "/knowledge",
    breadcrumbs
  });

  return (
    <>
      <JsonLdScript id="jsonld-knowledge-hub" schemas={schemas} />
      <KnowledgeHubTemplate
        title="Knowledge"
        summary="Canonical knowledge hub with namespaced routes for articles, FAQ, and definitions."
        sections={[
          {
            title: "Articles",
            description: "Long-form guides and explainers.",
            links: [{ label: "Tokenization fundamentals", href: "/knowledge/articles/tokenization-fundamentals" }]
          },
          {
            title: "FAQ",
            description: "Operational and platform frequently asked questions.",
            links: [{ label: "View FAQ hub", href: "/knowledge/faq" }]
          },
          {
            title: "Definitions",
            description: "Glossary terms with stable semantic URLs.",
            links: [{ label: "Yield", href: "/knowledge/definitions/yield" }]
          }
        ]}
      />
    </>
  );
}
