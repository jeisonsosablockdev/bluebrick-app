import type { Metadata } from "next";

import { JsonLdScript } from "@/components/seo/json-ld-script";
import { InstitutionalPageTemplate } from "@/components/templates";
import { createPageMetadata } from "@/lib/seo";
import { createInstitutionalTemplateSchemas } from "@/lib/schema";

export const metadata: Metadata = createPageMetadata({
  title: "Platform",
  description: "Technical overview of BRIDS platform capabilities and service boundaries.",
  path: "/platform"
});

export default function PlatformPage() {
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Platform", href: "/platform" }
  ];
  const schemas = createInstitutionalTemplateSchemas({
    title: "Platform",
    summary: "Technical overview of BRIDS platform capabilities and service boundaries.",
    path: "/platform",
    breadcrumbs
  });

  return (
    <>
      <JsonLdScript id="jsonld-platform" schemas={schemas} />
      <InstitutionalPageTemplate
        title="Platform"
        summary="Technical overview of BRIDS platform capabilities and service boundaries."
        sectionTitle="Platform overview"
        sectionBody="This route acts as a stable institutional entry point for platform communication. Detailed technical references should be linked from this page to the knowledge namespace."
        breadcrumbs={breadcrumbs}
      />
    </>
  );
}
