import type { Metadata } from "next";

import { JsonLdScript } from "@/components/seo/json-ld-script";
import { InstitutionalPageTemplate } from "@/components/templates";
import { createPageMetadata } from "@/lib/seo";
import { createInstitutionalTemplateSchemas } from "@/lib/schema";

export const metadata: Metadata = createPageMetadata({
  title: "Regulatory",
  description: "Entry route for regulatory disclosures and compliance-facing public documents.",
  path: "/regulatory",
  section: "regulatory"
});

export default function RegulatoryLayerPage() {
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Regulatory", href: "/regulatory" }
  ];
  const schemas = createInstitutionalTemplateSchemas({
    title: "Regulatory",
    summary: "Entry route for regulatory disclosures and compliance-facing public documents.",
    path: "/regulatory",
    breadcrumbs
  });

  return (
    <>
      <JsonLdScript id="jsonld-regulatory" schemas={schemas} />
      <InstitutionalPageTemplate
        title="Regulatory"
        summary="Entry route for regulatory disclosures and compliance-facing public documents."
        sectionTitle="Regulatory layer namespace"
        sectionBody="Regulatory content remains isolated from product and knowledge routes to maintain auditability, traceability, and compliance-friendly navigation boundaries."
        breadcrumbs={breadcrumbs}
      />
    </>
  );
}
