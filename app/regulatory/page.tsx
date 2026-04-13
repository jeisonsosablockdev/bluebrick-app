import type { Metadata } from "next";

import { InstitutionalPageTemplate } from "@/components/templates";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Regulatory",
  description: "Entry route for regulatory disclosures and compliance-facing public documents.",
  path: "/regulatory",
  section: "regulatory"
});

export default function RegulatoryLayerPage() {
  return (
    <InstitutionalPageTemplate
      title="Regulatory"
      summary="Entry route for regulatory disclosures and compliance-facing public documents."
      sectionTitle="Regulatory layer namespace"
      sectionBody="Regulatory content remains isolated from product and knowledge routes to maintain auditability, traceability, and compliance-friendly navigation boundaries."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Regulatory", href: "/regulatory" }
      ]}
    />
  );
}
