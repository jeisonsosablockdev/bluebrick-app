import type { Metadata } from "next";

import { JsonLdScript } from "@/components/seo/json-ld-script";
import { InstitutionalPageTemplate } from "@/components/templates";
import { createPageMetadata } from "@/lib/seo";
import { createInstitutionalTemplateSchemas } from "@/lib/schema";

export const metadata: Metadata = createPageMetadata({
  title: "About",
  description: "Company profile, mission, and operating principles for BRIDS.",
  path: "/about"
});

export default function AboutPage() {
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" }
  ];
  const schemas = createInstitutionalTemplateSchemas({
    title: "About",
    summary: "Company profile, mission, and operating principles for BRIDS.",
    path: "/about",
    breadcrumbs
  });

  return (
    <>
      <JsonLdScript id="jsonld-about" schemas={schemas} />
      <InstitutionalPageTemplate
        title="About"
        summary="Company profile, mission, and operating principles for BRIDS."
        sectionTitle="Institutional profile"
        sectionBody="This route is the canonical institutional namespace for company-level communication. It is intentionally separated from knowledge and regulatory layers to avoid URL drift and keep semantic boundaries stable."
        breadcrumbs={breadcrumbs}
      />
    </>
  );
}
