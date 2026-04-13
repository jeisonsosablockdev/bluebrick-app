import type { Metadata } from "next";

import { JsonLdScript } from "@/components/seo/json-ld-script";
import { ResourcePageTemplate } from "@/components/templates";
import { createPageMetadata } from "@/lib/seo";
import { createResourceTemplateSchemas } from "@/lib/schema";

function toTitleFromSlug(slug: string): string {
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
  const title = toTitleFromSlug(slug);

  return createPageMetadata({
    title,
    description: `Resource page for ${title}.`,
    path: `/resources/${slug}`
  });
}

export default async function ResourcePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const title = toTitleFromSlug(resolvedParams.slug);
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Resources", href: "/resources" },
    { label: title, href: `/resources/${resolvedParams.slug}` }
  ];
  const schemas = createResourceTemplateSchemas({
    title,
    summary: "Resource template baseline for changelog and downloadable references.",
    path: `/resources/${resolvedParams.slug}`,
    breadcrumbs
  });

  return (
    <>
      <JsonLdScript id="jsonld-resource" schemas={schemas} />
      <ResourcePageTemplate
        title={title}
        summary="Resource template baseline for changelog and downloadable references."
        body="This route is reserved for resource-like content and can later connect to typed content loaders for changelogs, whitepapers, and public exports."
        relatedLinks={[
          { label: "Knowledge hub", href: "/knowledge" },
          { label: "Platform", href: "/platform" }
        ]}
      />
    </>
  );
}
