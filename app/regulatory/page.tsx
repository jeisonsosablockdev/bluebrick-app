import { InstitutionalPageTemplate } from "@/components/templates";

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
