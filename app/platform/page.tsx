import { InstitutionalPageTemplate } from "@/components/templates";

export default function PlatformPage() {
  return (
    <InstitutionalPageTemplate
      title="Platform"
      summary="Technical overview of BRIDS platform capabilities and service boundaries."
      sectionTitle="Platform overview"
      sectionBody="This route acts as a stable institutional entry point for platform communication. Detailed technical references should be linked from this page to the knowledge namespace."
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Platform", href: "/platform" }
      ]}
    />
  );
}
