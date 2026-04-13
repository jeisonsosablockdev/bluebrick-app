import type { Metadata } from "next";

import { InstitutionalPageTemplate } from "@/components/templates";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "Platform",
  description: "Technical overview of BRIDS platform capabilities and service boundaries.",
  path: "/platform"
});

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
