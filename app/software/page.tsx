import type { Metadata } from "next";

import { JsonLdScript } from "@/components/seo/json-ld-script";
import { InstitutionalPageTemplate } from "@/components/templates";
import { createPageMetadata } from "@/lib/seo";
import { createInstitutionalTemplateSchemas } from "@/lib/schema";

export const metadata: Metadata = createPageMetadata({
  title: "Software",
  description: "Entry route for software layer content and platform-focused technical pages.",
  path: "/software",
  section: "software"
});

export default function SoftwareLayerPage() {
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Software", href: "/software" }
  ];
  const schemas = createInstitutionalTemplateSchemas({
    title: "Software",
    summary: "Entry route for software layer content and platform-focused technical pages.",
    path: "/software",
    breadcrumbs
  });

  return (
    <>
      <JsonLdScript id="jsonld-software" schemas={schemas} />
      <InstitutionalPageTemplate
        title="Software"
        summary="Entry route for software layer content and platform-focused technical pages."
        sectionTitle="Software layer namespace"
        sectionBody="This namespace is reserved for software-facing pages. Reusable templates and centralized route mapping keep URLs deterministic and prevent slug collisions as content scales."
        breadcrumbs={breadcrumbs}
      />
    </>
  );
}
