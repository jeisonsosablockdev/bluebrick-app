import type { Metadata } from "next";

import { FaqTemplate } from "@/components/templates";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Knowledge FAQ",
  description: "Frequently asked questions for the BRIDS knowledge layer.",
  path: "/knowledge/faq",
  section: "knowledge"
});

export default function KnowledgeFaqPage() {
  return (
    <FaqTemplate
      title="FAQ"
      summary="Frequently asked questions in a dedicated namespace to preserve route clarity."
      entries={[
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
      ]}
    />
  );
}
