import type { Metadata } from "next";
import { getAllResourcesQuery, ResourcePageTemplate } from "@/features/educational-resources";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Definitions",
  description: "Glossary definitions and Web3 real estate terminology.",
  path: "/knowledge/definitions",
  section: "knowledge"
});

export default async function DefinitionsPage() {
  const articles = await getAllResourcesQuery();
  return <ResourcePageTemplate articles={articles} />;
}
