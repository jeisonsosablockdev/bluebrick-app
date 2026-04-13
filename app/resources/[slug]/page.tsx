import { ResourcePageTemplate } from "@/components/templates";

function toTitleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export default async function ResourcePage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = await params;
  const title = toTitleFromSlug(resolvedParams.slug);

  return (
    <ResourcePageTemplate
      title={title}
      summary="Resource template baseline for changelog and downloadable references."
      body="This route is reserved for resource-like content and can later connect to typed content loaders for changelogs, whitepapers, and public exports."
      relatedLinks={[
        { label: "Knowledge hub", href: "/knowledge" },
        { label: "Platform", href: "/platform" }
      ]}
    />
  );
}
