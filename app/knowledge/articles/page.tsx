import type { Metadata } from "next";
import { getAllResourcesQuery, ResourcePageTemplate } from "@/features/educational-resources";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Articles",
  description: "Educational articles and technical guides for tokenized real estate.",
  path: "/knowledge/articles",
  section: "knowledge"
});

export default async function ArticlesPage() {
  const articles = await getAllResourcesQuery();
  return <ResourcePageTemplate articles={articles} />;
}
